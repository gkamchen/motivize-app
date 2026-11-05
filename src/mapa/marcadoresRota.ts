import type { Rota } from '../domain/rota';
import type { Marcador } from './tipos';

/** Marcadores das paradas: número na ordem de visita, ✓ nas visitadas. */
export function marcadoresDaRota(rota: Rota): Marcador[] {
  let n = 0;
  return rota.paradas.map((p) => {
    const visitada = Boolean(p.visitadaEm);
    if (!visitada) n += 1;
    return {
      id: `parada-${p.id}`,
      ponto: p.coord,
      tipo: visitada ? 'visitada' : 'parada',
      rotulo: visitada ? '✓' : String(n),
      titulo: p.nome,
      descricao: p.endereco,
    };
  });
}
