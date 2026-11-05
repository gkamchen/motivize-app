import type { Jornada } from '../domain/jornada';
import { formatarDuracaoCurta, formatarHora } from '../domain/tempo';
import type { Marcador } from './tipos';

/** Marcadores numerados dos atendimentos e intervalos com local. */
export function marcadoresDa(jornada: Jornada, agora: number): Marcador[] {
  let n = 0;
  const lista: Marcador[] = [];
  for (const t of jornada.trechos) {
    if (t.tipo === 'deslocamento') continue;
    if (t.tipo === 'atendimento') n += 1;
    if (!t.local) continue;
    const duracao = formatarDuracaoCurta((t.fim ?? agora) - t.inicio);
    const horario = `${formatarHora(t.inicio)}${t.fim ? `–${formatarHora(t.fim)}` : ' (em andamento)'}`;
    lista.push({
      id: t.id,
      ponto: t.local,
      tipo: t.tipo,
      rotulo: t.tipo === 'atendimento' ? String(n) : 'I',
      titulo:
        t.tipo === 'atendimento'
          ? `${n}. ${t.cliente ?? 'Atendimento'}`
          : 'Intervalo',
      descricao: `${horario} · ${duracao}${t.observacao ? ` · ${t.observacao}` : ''}`,
    });
  }
  return lista;
}
