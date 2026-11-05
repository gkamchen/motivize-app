import { useColorScheme } from 'react-native';
import type { Status, TipoTrecho } from '../domain/jornada';

export interface Tema {
  escuro: boolean;
  fundo: string;
  superficie: string;
  superficieAlta: string;
  borda: string;
  texto: string;
  textoSuave: string;
  marca: string;
  marcaTexto: string;
  perigo: string;
  sucesso: string;
  /** Linha da rota planejada. */
  rota: string;
  trecho: Record<TipoTrecho, string>;
}

const claro: Tema = {
  escuro: false,
  fundo: '#F6F4F3',
  superficie: '#FFFFFF',
  superficieAlta: '#F0ECEA',
  borda: '#E4DEDB',
  texto: '#1F1A19',
  textoSuave: '#6B625F',
  marca: '#E5383B',
  marcaTexto: '#FFFFFF',
  perigo: '#B7243E',
  sucesso: '#2F7D32',
  rota: '#4F46E5',
  trecho: {
    deslocamento: '#D97706',
    atendimento: '#0284C7',
    intervalo: '#4D7C0F',
  },
};

const escuro: Tema = {
  escuro: true,
  fundo: '#141111',
  superficie: '#1F1B1A',
  superficieAlta: '#2A2524',
  borda: '#3A3331',
  texto: '#F5F0EE',
  textoSuave: '#B3A9A6',
  marca: '#FF6B6B',
  marcaTexto: '#1A0B0B',
  perigo: '#FF8A9A',
  sucesso: '#7BC47F',
  rota: '#818CF8',
  trecho: {
    deslocamento: '#FBBF24',
    atendimento: '#38BDF8',
    intervalo: '#A3E635',
  },
};

export function useTema(): Tema {
  return useColorScheme() === 'dark' ? escuro : claro;
}

export const NOME_TRECHO: Record<TipoTrecho, string> = {
  deslocamento: 'Deslocamento',
  atendimento: 'Atendimento',
  intervalo: 'Intervalo',
};

export const NOME_STATUS: Record<Status, string> = {
  parado: 'Dia não iniciado',
  deslocamento: 'Em deslocamento',
  atendimento: 'Em atendimento',
  intervalo: 'Em intervalo',
};

export const espaco = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 };
export const raio = { s: 8, m: 12, l: 16 };
