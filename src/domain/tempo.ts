import type { Jornada, TipoTrecho } from './jornada';

export type Totais = Record<TipoTrecho, number> & { total: number };

/** Soma, em milissegundos, quanto tempo foi gasto em cada tipo de trecho. */
export function totais(jornada: Jornada | null, agora: number): Totais {
  const soma: Totais = {
    deslocamento: 0,
    atendimento: 0,
    intervalo: 0,
    total: 0,
  };
  if (!jornada) return soma;
  for (const t of jornada.trechos) {
    const fim = t.fim ?? agora;
    const duracao = Math.max(0, fim - t.inicio);
    soma[t.tipo] += duracao;
    soma.total += duracao;
  }
  return soma;
}

/** 3725000 ms → "01:02:05". Passa de 24 h sem virar o dia. */
export function formatarDuracao(ms: number): string {
  const segundos = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

/** 5400000 ms → "1 h 30 min"; abaixo de 1 min → "45 s". */
export function formatarDuracaoCurta(ms: number): string {
  const segundos = Math.max(0, Math.floor(ms / 1000));
  if (segundos < 60) return `${segundos} s`;
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function formatarHora(momento: number): string {
  const d = new Date(momento);
  return [d.getHours(), d.getMinutes()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

/** "2026-11-05" → "qui, 5 nov 2026". */
export function formatarDia(dia: string): string {
  const [a, m, d] = dia.split('-').map(Number);
  const data = new Date(a, m - 1, d);
  return `${DIAS[data.getDay()]}, ${d} ${MESES[m - 1]} ${a}`;
}

/** Percentual inteiro de cada parte; a soma sempre fecha em 100. */
export function percentuais(valores: number[]): number[] {
  const total = valores.reduce((a, b) => a + b, 0);
  if (total <= 0) return valores.map(() => 0);
  const brutos = valores.map((v) => (v / total) * 100);
  const inteiros = brutos.map(Math.floor);
  let falta = 100 - inteiros.reduce((a, b) => a + b, 0);
  const ordem = brutos
    .map((b, i) => ({ i, resto: b - Math.floor(b) }))
    .sort((x, y) => y.resto - x.resto);
  for (const { i } of ordem) {
    if (falta <= 0) break;
    inteiros[i] += 1;
    falta -= 1;
  }
  return inteiros;
}
