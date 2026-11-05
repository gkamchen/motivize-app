import type { Ponto, TipoTrecho } from '../domain/jornada';
import type { Coord } from '../domain/rota';
import type { Tema } from '../ui/tema';

export type TipoMarcador = TipoTrecho | 'parada' | 'visitada';

export interface Marcador {
  id: string;
  ponto: Coord;
  tipo: TipoMarcador;
  titulo: string;
  descricao?: string;
  /** Texto curto exibido no marcador (número/letra). */
  rotulo?: string;
}

export interface PropsMapa {
  percurso: Ponto[];
  marcadores: Marcador[];
  posicao?: Ponto;
  /** Caminho planejado (Mapbox Directions). */
  trajeto?: Coord[];
  /** Centraliza na posição atual em vez de enquadrar tudo. */
  seguirPosicao?: boolean;
  /** Zoom ao seguir a posição (navegação usa mais perto). */
  zoomSeguir?: number;
}

export function corDoMarcador(t: Tema, tipo: TipoMarcador): string {
  if (tipo === 'parada') return t.marca;
  if (tipo === 'visitada') return t.textoSuave;
  return t.trecho[tipo];
}
