import type { Ponto } from '../jornada';
import {
  adicionarPonto,
  distanciaM,
  distanciaTotalM,
  formatarDistancia,
} from '../percurso';
import {
  formatarDia,
  formatarDuracao,
  formatarDuracaoCurta,
  percentuais,
} from '../tempo';

const p = (latitude: number, longitude: number, precisao = 5): Ponto => ({
  latitude,
  longitude,
  precisao,
  em: 0,
});

describe('tempo', () => {
  it('formata duração em HH:MM:SS, inclusive acima de 24 h', () => {
    expect(formatarDuracao(0)).toBe('00:00:00');
    expect(formatarDuracao(59_999)).toBe('00:00:59');
    expect(formatarDuracao(3_725_000)).toBe('01:02:05');
    expect(formatarDuracao(26 * 3_600_000)).toBe('26:00:00');
    expect(formatarDuracao(-5)).toBe('00:00:00');
  });

  it('formata duração curta', () => {
    expect(formatarDuracaoCurta(45_000)).toBe('45 s');
    expect(formatarDuracaoCurta(25 * 60_000)).toBe('25 min');
    expect(formatarDuracaoCurta(2 * 3_600_000)).toBe('2 h');
    expect(formatarDuracaoCurta(90 * 60_000)).toBe('1 h 30 min');
  });

  it('formata o dia por extenso', () => {
    expect(formatarDia('2026-11-05')).toBe('qui, 5 nov 2026');
  });

  it('percentuais sempre somam 100', () => {
    expect(percentuais([1, 1, 1])).toEqual([34, 33, 33]);
    expect(percentuais([0, 0, 0])).toEqual([0, 0, 0]);
    expect(percentuais([3, 1, 0]).reduce((a, b) => a + b)).toBe(100);
  });
});

describe('percurso', () => {
  it('calcula distância com haversine', () => {
    // 0,001° de latitude ≈ 111 m
    expect(distanciaM(p(-27, -48.6), p(-27.001, -48.6))).toBeCloseTo(111.2, 0);
  });

  it('ignora leituras imprecisas e oscilações de quem está parado', () => {
    let trilha: Ponto[] = [];
    trilha = adicionarPonto(trilha, p(-27, -48.6));
    trilha = adicionarPonto(trilha, p(-27.00001, -48.6)); // ~1 m
    trilha = adicionarPonto(trilha, p(-27.01, -48.6, 200)); // impreciso
    expect(trilha).toHaveLength(1);
    trilha = adicionarPonto(trilha, p(-27.001, -48.6));
    expect(trilha).toHaveLength(2);
    expect(distanciaTotalM(trilha)).toBeGreaterThan(100);
  });

  it('ignora saltos impossíveis do GPS', () => {
    const a = { ...p(-27, -48.6), em: 0 };
    const salto = { ...p(-27.1, -48.6), em: 10_000 }; // 11 km em 10 s
    expect(adicionarPonto([a], salto)).toHaveLength(1);
    const devagar = { ...p(-27.1, -48.6), em: 900_000 }; // 11 km em 15 min
    expect(adicionarPonto([a], devagar)).toHaveLength(2);
  });

  it('formata distância', () => {
    expect(formatarDistancia(850.4)).toBe('850 m');
    expect(formatarDistancia(12_345)).toBe('12,3 km');
  });
});
