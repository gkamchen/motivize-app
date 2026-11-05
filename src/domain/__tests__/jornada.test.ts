import {
  TransicaoInvalida,
  atendimentos,
  diaLocal,
  finalizarAtendimento,
  finalizarDia,
  finalizarIntervalo,
  iniciarAtendimento,
  iniciarDia,
  iniciarIntervalo,
  statusDa,
} from '../jornada';
import { totais } from '../tempo';

const MIN = 60_000;
const T0 = new Date(2026, 10, 5, 8, 0, 0).getTime();

let seq = 0;
const id = () => `id-${++seq}`;

describe('jornada', () => {
  beforeEach(() => {
    seq = 0;
  });

  it('inicia o dia em deslocamento, com o dia local correto', () => {
    const j = iniciarDia(T0, id);
    expect(statusDa(j)).toBe('deslocamento');
    expect(j.dia).toBe('2026-11-05');
    expect(j.trechos).toHaveLength(1);
  });

  it('usa o mês certo (o app antigo mostrava o mês anterior)', () => {
    expect(diaLocal(new Date(2026, 0, 31).getTime())).toBe('2026-01-31');
  });

  it('faz um dia completo e soma os tempos por tipo', () => {
    let j = iniciarDia(T0, id);
    j = iniciarAtendimento(j, T0 + 30 * MIN, id, { cliente: '  Posto A ' });
    j = finalizarAtendimento(j, T0 + 75 * MIN, id, 'pedido fechado');
    j = iniciarIntervalo(j, T0 + 120 * MIN, id);
    j = finalizarIntervalo(j, T0 + 180 * MIN, id);
    j = finalizarDia(j, T0 + 200 * MIN);

    expect(statusDa(j)).toBe('parado');
    expect(j.fim).toBe(T0 + 200 * MIN);
    const soma = totais(j, T0 + 999 * MIN);
    expect(soma.atendimento).toBe(45 * MIN);
    expect(soma.intervalo).toBe(60 * MIN);
    expect(soma.deslocamento).toBe(95 * MIN);
    expect(soma.total).toBe(200 * MIN);

    const [a] = atendimentos(j);
    expect(a.cliente).toBe('Posto A');
    expect(a.observacao).toBe('pedido fechado');
    // O início do atendimento é preservado (bug do app antigo).
    expect(a.inicio).toBe(T0 + 30 * MIN);
  });

  it('conta o trecho aberto até o momento atual', () => {
    const j = iniciarAtendimento(iniciarDia(T0, id), T0 + 10 * MIN, id);
    const soma = totais(j, T0 + 25 * MIN);
    expect(soma.deslocamento).toBe(10 * MIN);
    expect(soma.atendimento).toBe(15 * MIN);
  });

  it('bloqueia transições fora de ordem', () => {
    const j = iniciarDia(T0, id);
    expect(() => finalizarAtendimento(j, T0, id)).toThrow(TransicaoInvalida);
    expect(() => finalizarIntervalo(j, T0, id)).toThrow(TransicaoInvalida);

    const emAtendimento = iniciarAtendimento(j, T0 + MIN, id);
    expect(() => iniciarIntervalo(emAtendimento, T0, id)).toThrow(
      TransicaoInvalida,
    );
    expect(() => finalizarDia(emAtendimento, T0)).toThrow(TransicaoInvalida);
  });

  it('nunca gera duração negativa se o relógio voltar', () => {
    let j = iniciarDia(T0, id);
    j = iniciarAtendimento(j, T0 - 5 * MIN, id);
    const soma = totais(j, T0 - 10 * MIN);
    expect(soma.deslocamento).toBe(0);
    expect(soma.atendimento).toBe(0);
  });
});
