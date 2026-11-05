/**
 * Regras da jornada de trabalho em campo.
 *
 * Tudo aqui é função pura: recebe o estado atual e devolve o próximo.
 * Os tempos são calculados a partir dos horários de início e fim de cada
 * trecho, nunca contando segundo a segundo — assim o app pode ser fechado
 * e reaberto sem perder nada.
 */

export type TipoTrecho = 'deslocamento' | 'atendimento' | 'intervalo';

export type Status = 'parado' | TipoTrecho;

export interface Ponto {
  latitude: number;
  longitude: number;
  /** Precisão em metros informada pelo GPS. */
  precisao?: number;
  /** Momento da leitura (epoch em ms). */
  em: number;
}

export interface Trecho {
  id: string;
  tipo: TipoTrecho;
  inicio: number;
  fim?: number;
  /** Onde o trecho começou (atendimento e intervalo). */
  local?: Ponto;
  /** Cliente ou local do atendimento. */
  cliente?: string;
  observacao?: string;
}

export interface Jornada {
  id: string;
  /** Dia local no formato AAAA-MM-DD. */
  dia: string;
  inicio: number;
  fim?: number;
  trechos: Trecho[];
  /** Trilha de GPS registrada durante o dia. */
  percurso: Ponto[];
  /** Momento em que foi enviada ao servidor (quando houver servidor). */
  sincronizadaEm?: number;
}

export class TransicaoInvalida extends Error {
  constructor(acao: string, status: Status) {
    super(`Não é possível ${acao} com a jornada em "${status}".`);
    this.name = 'TransicaoInvalida';
  }
}

export function diaLocal(momento: number): string {
  const d = new Date(momento);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function trechoAberto(jornada: Jornada | null): Trecho | undefined {
  if (!jornada || jornada.fim !== undefined) return undefined;
  const ultimo = jornada.trechos[jornada.trechos.length - 1];
  return ultimo && ultimo.fim === undefined ? ultimo : undefined;
}

export function statusDa(jornada: Jornada | null): Status {
  return trechoAberto(jornada)?.tipo ?? 'parado';
}

function fecharAberto(jornada: Jornada, agora: number): Trecho[] {
  return jornada.trechos.map((t) =>
    t.fim === undefined ? { ...t, fim: Math.max(agora, t.inicio) } : t,
  );
}

function abrir(
  jornada: Jornada,
  tipo: TipoTrecho,
  agora: number,
  novoId: () => string,
  extra: Partial<Trecho> = {},
): Jornada {
  return {
    ...jornada,
    trechos: [
      ...fecharAberto(jornada, agora),
      { id: novoId(), tipo, inicio: agora, ...extra },
    ],
  };
}

export function iniciarDia(
  agora: number,
  novoId: () => string,
): Jornada {
  const jornada: Jornada = {
    id: novoId(),
    dia: diaLocal(agora),
    inicio: agora,
    trechos: [],
    percurso: [],
  };
  return abrir(jornada, 'deslocamento', agora, novoId);
}

export function iniciarAtendimento(
  jornada: Jornada,
  agora: number,
  novoId: () => string,
  dados: { local?: Ponto; cliente?: string } = {},
): Jornada {
  const status = statusDa(jornada);
  if (status !== 'deslocamento') {
    throw new TransicaoInvalida('iniciar atendimento', status);
  }
  const cliente = dados.cliente?.trim() || undefined;
  return abrir(jornada, 'atendimento', agora, novoId, {
    local: dados.local,
    cliente,
  });
}

export function finalizarAtendimento(
  jornada: Jornada,
  agora: number,
  novoId: () => string,
  observacao?: string,
): Jornada {
  const status = statusDa(jornada);
  if (status !== 'atendimento') {
    throw new TransicaoInvalida('finalizar atendimento', status);
  }
  const obs = observacao?.trim();
  const comObs: Jornada = obs
    ? {
        ...jornada,
        trechos: jornada.trechos.map((t) =>
          t.fim === undefined ? { ...t, observacao: obs } : t,
        ),
      }
    : jornada;
  return abrir(comObs, 'deslocamento', agora, novoId);
}

export function iniciarIntervalo(
  jornada: Jornada,
  agora: number,
  novoId: () => string,
  local?: Ponto,
): Jornada {
  const status = statusDa(jornada);
  if (status !== 'deslocamento') {
    throw new TransicaoInvalida('iniciar intervalo', status);
  }
  return abrir(jornada, 'intervalo', agora, novoId, { local });
}

export function finalizarIntervalo(
  jornada: Jornada,
  agora: number,
  novoId: () => string,
): Jornada {
  const status = statusDa(jornada);
  if (status !== 'intervalo') {
    throw new TransicaoInvalida('finalizar intervalo', status);
  }
  return abrir(jornada, 'deslocamento', agora, novoId);
}

export function finalizarDia(jornada: Jornada, agora: number): Jornada {
  const status = statusDa(jornada);
  if (status !== 'deslocamento') {
    throw new TransicaoInvalida('finalizar o dia', status);
  }
  return {
    ...jornada,
    trechos: fecharAberto(jornada, agora),
    fim: Math.max(agora, jornada.inicio),
  };
}

/** Atendimentos da jornada, na ordem em que aconteceram. */
export function atendimentos(jornada: Jornada): Trecho[] {
  return jornada.trechos.filter((t) => t.tipo === 'atendimento');
}
