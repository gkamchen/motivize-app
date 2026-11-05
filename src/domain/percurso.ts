import type { Ponto } from './jornada';

const RAIO_TERRA_M = 6_371_000;

type LatLon = Pick<Ponto, 'latitude' | 'longitude'>;

/** Distância em metros entre dois pontos (fórmula de haversine). */
export function distanciaM(a: LatLon, b: LatLon): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * RAIO_TERRA_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Leituras com precisão pior que isso são descartadas. */
export const PRECISAO_MAXIMA_M = 50;
/** Movimentos menores que isso não entram na trilha (ruído do GPS). */
export const PASSO_MINIMO_M = 15;
/** Acima disso (~200 km/h) a leitura é considerada erro do GPS. */
export const VELOCIDADE_MAXIMA_MS = 55;

/**
 * Acrescenta uma leitura à trilha, ignorando leituras imprecisas e
 * pequenas oscilações de quem está parado.
 */
export function adicionarPonto(trilha: Ponto[], ponto: Ponto): Ponto[] {
  if (
    ponto.precisao !== undefined &&
    ponto.precisao > PRECISAO_MAXIMA_M
  ) {
    return trilha;
  }
  const ultimo = trilha[trilha.length - 1];
  if (ultimo) {
    const d = distanciaM(ultimo, ponto);
    if (d < PASSO_MINIMO_M) return trilha;
    // Salto impossível (GPS "pulando"): ignora a leitura.
    const segundos = (ponto.em - ultimo.em) / 1000;
    if (segundos > 0 && d / segundos > VELOCIDADE_MAXIMA_MS) return trilha;
  }
  return [...trilha, ponto];
}

/** Distância total percorrida em metros. */
export function distanciaTotalM(trilha: Ponto[]): number {
  let total = 0;
  for (let i = 1; i < trilha.length; i += 1) {
    total += distanciaM(trilha[i - 1], trilha[i]);
  }
  return total;
}

export function formatarDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toFixed(1).replace('.', ',')} km`;
}
