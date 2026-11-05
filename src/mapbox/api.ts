/**
 * Serviços do Mapbox usados pelo planejamento de rota:
 * - Search / Geocoding v6: encontrar endereços e lugares;
 * - Optimization v1: melhor ordem para visitar as paradas;
 * - Directions v5: caminho pelas ruas, com instruções em português.
 */
import type { Coord, Passo, Trajeto } from '../domain/rota';
import { tokenMapbox, usaMapbox } from '../mapa/estilo';

const BASE = 'https://api.mapbox.com';

export const mapboxDisponivel = usaMapbox;

export class ErroMapbox extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErroMapbox';
  }
}

async function obter<T>(caminho: string, params: Record<string, string>) {
  if (!mapboxDisponivel) {
    throw new ErroMapbox(
      'Mapbox não configurado: defina EXPO_PUBLIC_MAPBOX_TOKEN no .env.',
    );
  }
  const qs = new URLSearchParams({ ...params, access_token: tokenMapbox });
  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}${caminho}?${qs.toString()}`);
  } catch {
    throw new ErroMapbox('Sem conexão com o Mapbox.');
  }
  const dados = (await resposta.json().catch(() => ({}))) as T & {
    message?: string;
    code?: string;
  };
  if (!resposta.ok) {
    if (resposta.status === 401) {
      throw new ErroMapbox('Token do Mapbox inválido.');
    }
    if (resposta.status === 429) {
      throw new ErroMapbox('Limite de uso do Mapbox atingido. Tente em instantes.');
    }
    throw new ErroMapbox(dados.message ?? `Erro ${resposta.status} no Mapbox.`);
  }
  return dados;
}

const lonLat = (c: Coord) =>
  `${c.longitude.toFixed(6)},${c.latitude.toFixed(6)}`;

const deLonLat = ([longitude, latitude]: number[]): Coord => ({
  latitude,
  longitude,
});

// ---------------------------------------------------------------------------
// Busca de endereços
// ---------------------------------------------------------------------------

export interface Lugar {
  id: string;
  nome: string;
  endereco: string;
  coord: Coord;
}

interface RespostaGeocoding {
  features: {
    id: string;
    geometry: { coordinates: number[] };
    properties: {
      name?: string;
      full_address?: string;
      place_formatted?: string;
    };
  }[];
}

export async function buscarLugares(
  texto: string,
  perto?: Coord,
): Promise<Lugar[]> {
  const q = texto.trim();
  if (q.length < 3) return [];
  const params: Record<string, string> = {
    q,
    country: 'br',
    language: 'pt',
    limit: '6',
  };
  if (perto) params.proximity = lonLat(perto);
  const r = await obter<RespostaGeocoding>('/search/geocode/v6/forward', params);
  return r.features.map((f) => ({
    id: f.id,
    nome: f.properties.name ?? q,
    endereco:
      f.properties.full_address ?? f.properties.place_formatted ?? '',
    coord: deLonLat(f.geometry.coordinates),
  }));
}

// ---------------------------------------------------------------------------
// Otimização da ordem
// ---------------------------------------------------------------------------

interface RespostaOtimizacao {
  code: string;
  waypoints: { waypoint_index: number }[];
}

/**
 * Melhor ordem para sair da origem e visitar todos os pontos, sem voltar.
 * Devolve, para cada ponto enviado (origem incluída), sua posição na viagem.
 */
export async function otimizarOrdem(
  origem: Coord,
  pontos: Coord[],
): Promise<number[]> {
  const todos = [origem, ...pontos];
  const r = await obter<RespostaOtimizacao>(
    `/optimized-trips/v1/mapbox/driving/${todos.map(lonLat).join(';')}`,
    { source: 'first', roundtrip: 'false', destination: 'any' },
  );
  if (r.code !== 'Ok') {
    throw new ErroMapbox('Não foi possível otimizar a rota para estes pontos.');
  }
  return r.waypoints.map((w) => w.waypoint_index);
}

// ---------------------------------------------------------------------------
// Direções
// ---------------------------------------------------------------------------

interface PassoMapbox {
  distance: number;
  duration: number;
  name: string;
  geometry: { coordinates: number[][] };
  maneuver: {
    instruction: string;
    type: string;
    modifier?: string;
    location: number[];
  };
}

interface RespostaDirecoes {
  code: string;
  routes: {
    distance: number;
    duration: number;
    geometry: { coordinates: number[][] };
    legs: { steps: PassoMapbox[] }[];
  }[];
}

/** Converte a resposta do Directions em um Trajeto (exportado p/ testes). */
export function converterDirecoes(
  r: RespostaDirecoes,
  ordem: string[],
  agora: number,
): Trajeto {
  const rota = r.routes[0];
  if (r.code !== 'Ok' || !rota) {
    throw new ErroMapbox('Não foi encontrado caminho entre estes pontos.');
  }
  const geometria: Coord[] = [];
  const passos: Passo[] = [];
  for (const perna of rota.legs) {
    for (const s of perna.steps) {
      const coords = s.geometry.coordinates.map(deLonLat);
      // Evita repetir o ponto de junção entre passos.
      const inicio = geometria.length > 0 ? geometria.length - 1 : 0;
      const novos = geometria.length > 0 ? coords.slice(1) : coords;
      geometria.push(...novos);
      passos.push({
        instrucao: s.maneuver.instruction,
        tipo: s.maneuver.type,
        modificador: s.maneuver.modifier,
        rua: s.name || undefined,
        local: deLonLat(s.maneuver.location),
        distanciaM: s.distance,
        duracaoS: s.duration,
        inicioGeometria: inicio,
      });
    }
  }
  return {
    geometria,
    distanciaM: rota.distance,
    duracaoS: rota.duration,
    passos,
    ordem,
    calculadoEm: agora,
  };
}

/** Caminho de carro passando pelos pontos, na ordem dada. */
export async function tracarTrajeto(
  origem: Coord,
  paradas: { id: string; coord: Coord }[],
): Promise<Trajeto> {
  const todos = [origem, ...paradas.map((p) => p.coord)];
  const r = await obter<RespostaDirecoes>(
    `/directions/v5/mapbox/driving/${todos.map(lonLat).join(';')}`,
    {
      geometries: 'geojson',
      overview: 'full',
      steps: 'true',
      language: 'pt-BR',
    },
  );
  return converterDirecoes(r, paradas.map((p) => p.id), Date.now());
}
