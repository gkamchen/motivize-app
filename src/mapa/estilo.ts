/**
 * Fonte dos mapas: estilos do Mapbox quando há token no .env
 * (EXPO_PUBLIC_MAPBOX_TOKEN); sem token, OpenStreetMap.
 *
 * Usa as "Static Tiles" do Mapbox, que funcionam tanto no Expo Go
 * (react-native-maps) quanto na web (Leaflet), sem build nativo.
 * Use um token público (pk.*), de preferência restrito por URL/app.
 */
import { useEffect, useState } from 'react';

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

export const usaMapbox = TOKEN.startsWith('pk.');
export const tokenMapbox = usaMapbox ? TOKEN : '';

export interface FonteMapa {
  url: string;
  atribuicao: string;
  /** Atribuição em HTML (Leaflet). */
  atribuicaoHtml: string;
  zoomMaximo: number;
}

export function fonteMapa(escuro: boolean, mapbox = usaMapbox): FonteMapa {
  if (mapbox) {
    const estilo = escuro ? 'dark-v11' : 'streets-v12';
    return {
      url:
        `https://api.mapbox.com/styles/v1/mapbox/${estilo}/tiles/256/` +
        `{z}/{x}/{y}@2x?access_token=${TOKEN}`,
      atribuicao: '© Mapbox © OpenStreetMap',
      atribuicaoHtml:
        '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> ' +
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
        '<a href="https://www.mapbox.com/map-feedback/"><strong>Melhore este mapa</strong></a>',
      zoomMaximo: 22,
    };
  }
  return {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    atribuicao: '© OpenStreetMap',
    atribuicaoHtml:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    zoomMaximo: 19,
  };
}

/**
 * Confere o token uma única vez por sessão. Se o Mapbox recusar
 * (token errado, revogado ou sem permissão), os mapas usam o
 * OpenStreetMap em vez de ficarem cinza. Sem internet, mantém o Mapbox.
 */
let verificacao: Promise<boolean> | null = null;

function tokenAceito(): Promise<boolean> {
  if (!usaMapbox) return Promise.resolve(false);
  verificacao ??= fetch(
    `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${TOKEN}`,
  )
    .then((r) => r.status !== 401 && r.status !== 403)
    .catch(() => true);
  return verificacao;
}

/** Fonte do mapa já considerando se o token foi aceito. */
export function useFonteMapa(escuro: boolean): FonteMapa & { mapbox: boolean } {
  const [aceito, setAceito] = useState(usaMapbox);
  useEffect(() => {
    let ativo = true;
    tokenAceito().then((ok) => {
      if (ativo) setAceito(ok);
    });
    return () => {
      ativo = false;
    };
  }, []);
  return { ...fonteMapa(escuro, aceito), mapbox: aceito };
}
