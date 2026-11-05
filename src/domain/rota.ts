/**
 * Planejamento de rota e acompanhamento da navegação.
 * Funções puras: os dados do Mapbox chegam já convertidos (ver mapbox/api).
 */
import type { Ponto } from './jornada';
import { distanciaM } from './percurso';

/** Coordenada simples (sem horário). */
export interface Coord {
  latitude: number;
  longitude: number;
}

export interface Parada {
  id: string;
  nome: string;
  endereco?: string;
  coord: Coord;
  /** Quando o atendimento nessa parada começou. */
  visitadaEm?: number;
}

export interface Passo {
  instrucao: string;
  /** Tipo de manobra do Mapbox (turn, depart, arrive, roundabout…). */
  tipo: string;
  /** Direção (left, right, slight left, straight…). */
  modificador?: string;
  rua?: string;
  /** Onde a manobra acontece. */
  local: Coord;
  /** Distância (m) e duração (s) do trecho que começa nesta manobra. */
  distanciaM: number;
  duracaoS: number;
  /** Índice do primeiro ponto da geometria que pertence a este passo. */
  inicioGeometria: number;
}

export interface Trajeto {
  geometria: Coord[];
  distanciaM: number;
  duracaoS: number;
  passos: Passo[];
  /** Ordem das paradas usada no cálculo (ids). */
  ordem: string[];
  calculadoEm: number;
}

export interface Rota {
  paradas: Parada[];
  trajeto?: Trajeto;
}

export const ROTA_VAZIA: Rota = { paradas: [] };

/** Limites dos serviços do Mapbox (contando a origem). */
export const MAX_PONTOS_OTIMIZACAO = 12;
export const MAX_PONTOS_DIRECOES = 25;

export function adicionarParada(rota: Rota, parada: Parada): Rota {
  return { paradas: [...rota.paradas, parada] };
}

export function removerParada(rota: Rota, id: string): Rota {
  return { paradas: rota.paradas.filter((p) => p.id !== id) };
}

/** Move a parada uma posição para cima (-1) ou para baixo (+1). */
export function moverParada(rota: Rota, id: string, sentido: -1 | 1): Rota {
  const i = rota.paradas.findIndex((p) => p.id === id);
  const j = i + sentido;
  if (i < 0 || j < 0 || j >= rota.paradas.length) return rota;
  const paradas = [...rota.paradas];
  [paradas[i], paradas[j]] = [paradas[j], paradas[i]];
  return { paradas };
}

/**
 * Aplica a ordem devolvida pela otimização.
 * `posicaoNaViagem[k]` = posição, na viagem otimizada, do k-ésimo ponto
 * enviado (o ponto 0 é a origem, as paradas vêm depois).
 */
export function aplicarOrdemOtimizada(
  paradas: Parada[],
  posicaoNaViagem: number[],
): Parada[] {
  return paradas
    .map((p, k) => ({ p, pos: posicaoNaViagem[k + 1] ?? k + 1 }))
    .sort((a, b) => a.pos - b.pos)
    .map((x) => x.p);
}

/** Paradas que ainda faltam visitar, na ordem atual. */
export function pendentes(rota: Rota): Parada[] {
  return rota.paradas.filter((p) => !p.visitadaEm);
}

export function marcarVisitada(rota: Rota, id: string, em: number): Rota {
  return {
    ...rota,
    paradas: rota.paradas.map((p) =>
      p.id === id ? { ...p, visitadaEm: em } : p,
    ),
  };
}

/** O trajeto ainda corresponde às paradas pendentes? */
export function trajetoAtual(rota: Rota): boolean {
  const t = rota.trajeto;
  if (!t) return false;
  const ids = pendentes(rota).map((p) => p.id);
  return ids.length === t.ordem.length && ids.every((id, i) => id === t.ordem[i]);
}

// ---------------------------------------------------------------------------
// Navegação
// ---------------------------------------------------------------------------

/**
 * Distância (m) de um ponto até o segmento AB. Usa projeção plana local,
 * suficiente para distâncias de rua (centenas de metros).
 */
export function distanciaAoSegmentoM(p: Coord, a: Coord, b: Coord): number {
  const latRef = (p.latitude * Math.PI) / 180;
  const mLat = 111_320;
  const mLon = 111_320 * Math.cos(latRef);
  const ax = (a.longitude - p.longitude) * mLon;
  const ay = (a.latitude - p.latitude) * mLat;
  const bx = (b.longitude - p.longitude) * mLon;
  const by = (b.latitude - p.latitude) * mLat;
  const dx = bx - ax;
  const dy = by - ay;
  const comp2 = dx * dx + dy * dy;
  const t = comp2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / comp2));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.sqrt(cx * cx + cy * cy);
}

/** Distância a partir da qual consideramos que saiu da rota. */
export const LIMITE_FORA_DA_ROTA_M = 50;
/** Distância da parada para considerar que chegou. */
export const RAIO_CHEGADA_M = 40;

export interface Progresso {
  /** Índice do próximo passo (manobra) a executar. */
  proximoPasso: number;
  /** Distância até a próxima manobra. */
  distanciaManobraM: number;
  /** Distância restante até o fim do trajeto. */
  restanteM: number;
  /** Duração restante estimada (s), proporcional à distância. */
  restanteS: number;
  /** Distância da posição até a linha da rota. */
  desvioM: number;
  foraDaRota: boolean;
}

/** Onde estamos no trajeto e qual é a próxima manobra. */
export function progresso(trajeto: Trajeto, posicao: Ponto | Coord): Progresso {
  const g = trajeto.geometria;
  if (g.length < 2) {
    return {
      proximoPasso: 0,
      distanciaManobraM: 0,
      restanteM: 0,
      restanteS: 0,
      desvioM: 0,
      foraDaRota: false,
    };
  }

  // Segmento mais próximo da posição atual.
  let melhor = 0;
  let menor = Infinity;
  for (let i = 0; i < g.length - 1; i += 1) {
    const d = distanciaAoSegmentoM(posicao, g[i], g[i + 1]);
    if (d < menor) {
      menor = d;
      melhor = i;
    }
  }

  // Restante: do ponto atual até o fim do segmento, mais o resto da linha.
  let restanteM = distanciaM(posicao, g[melhor + 1]);
  for (let i = melhor + 1; i < g.length - 1; i += 1) {
    restanteM += distanciaM(g[i], g[i + 1]);
  }

  // Próxima manobra: primeiro passo que começa depois do segmento atual.
  let proximoPasso = trajeto.passos.findIndex(
    (p) => p.inicioGeometria > melhor,
  );
  if (proximoPasso < 0) proximoPasso = trajeto.passos.length - 1;
  const passo = trajeto.passos[proximoPasso];
  const distanciaManobraM = passo
    ? distanciaAteIndice(g, posicao, melhor, passo.inicioGeometria)
    : restanteM;

  const total = trajeto.distanciaM || 1;
  return {
    proximoPasso,
    distanciaManobraM,
    restanteM,
    restanteS: (trajeto.duracaoS * restanteM) / total,
    desvioM: menor,
    foraDaRota: menor > LIMITE_FORA_DA_ROTA_M,
  };
}

function distanciaAteIndice(
  g: Coord[],
  posicao: Coord,
  segmento: number,
  alvo: number,
): number {
  if (alvo <= segmento) return distanciaM(posicao, g[alvo]);
  let d = distanciaM(posicao, g[segmento + 1]);
  for (let i = segmento + 1; i < alvo && i < g.length - 1; i += 1) {
    d += distanciaM(g[i], g[i + 1]);
  }
  return d;
}

/** Parada pendente mais próxima dentro do raio de chegada. */
export function paradaAlcancada(
  rota: Rota,
  posicao: Coord,
): Parada | undefined {
  return pendentes(rota).find(
    (p) => distanciaM(posicao, p.coord) <= RAIO_CHEGADA_M,
  );
}

export function formatarDuracaoRota(segundos: number): string {
  const min = Math.round(segundos / 60);
  if (min < 60) return `${Math.max(1, min)} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
