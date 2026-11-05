import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Jornada } from '../domain/jornada';
import type { Rota } from '../domain/rota';
import type { Sessao } from '../servidor/sessao';

const CHAVES = {
  jornadaAtual: 'motivize:v2:jornada-atual',
  historico: 'motivize:v2:historico',
  sessao: 'motivize:v2:sessao',
  rota: 'motivize:v2:rota',
} as const;

/** Quantos dias o histórico local guarda. */
const LIMITE_HISTORICO = 120;

async function ler<T>(chave: string): Promise<T | null> {
  try {
    const bruto = await AsyncStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}

async function gravar(chave: string, valor: unknown): Promise<void> {
  if (valor === null || valor === undefined) {
    await AsyncStorage.removeItem(chave);
    return;
  }
  await AsyncStorage.setItem(chave, JSON.stringify(valor));
}

export const armazenamento = {
  lerJornadaAtual: () => ler<Jornada>(CHAVES.jornadaAtual),
  gravarJornadaAtual: (j: Jornada | null) => gravar(CHAVES.jornadaAtual, j),

  async lerHistorico(): Promise<Jornada[]> {
    return (await ler<Jornada[]>(CHAVES.historico)) ?? [];
  },

  /** Insere ou substitui a jornada, mantendo a mais recente primeiro. */
  async salvarNoHistorico(jornada: Jornada): Promise<Jornada[]> {
    const atual = await armazenamento.lerHistorico();
    const lista = [jornada, ...atual.filter((j) => j.id !== jornada.id)]
      .sort((a, b) => b.inicio - a.inicio)
      .slice(0, LIMITE_HISTORICO);
    await gravar(CHAVES.historico, lista);
    return lista;
  },

  async removerDoHistorico(id: string): Promise<Jornada[]> {
    const lista = (await armazenamento.lerHistorico()).filter(
      (j) => j.id !== id,
    );
    await gravar(CHAVES.historico, lista);
    return lista;
  },

  lerRota: () => ler<Rota>(CHAVES.rota),
  gravarRota: (r: Rota | null) => gravar(CHAVES.rota, r),

  lerSessao: () => ler<Sessao>(CHAVES.sessao),
  gravarSessao: (s: Sessao | null) => gravar(CHAVES.sessao, s),
};
