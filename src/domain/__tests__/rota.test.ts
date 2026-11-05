import { converterDirecoes } from '../../mapbox/api';
import {
  ROTA_VAZIA,
  adicionarParada,
  aplicarOrdemOtimizada,
  distanciaAoSegmentoM,
  marcarVisitada,
  moverParada,
  paradaAlcancada,
  pendentes,
  progresso,
  trajetoAtual,
  type Parada,
  type Rota,
} from '../rota';

const parada = (id: string, lat: number, lon: number): Parada => ({
  id,
  nome: `Cliente ${id}`,
  coord: { latitude: lat, longitude: lon },
});

const A = parada('a', -27.59, -48.55);
const B = parada('b', -27.6, -48.56);
const C = parada('c', -27.61, -48.57);

const rotaABC = (): Rota =>
  [A, B, C].reduce(adicionarParada, ROTA_VAZIA);

describe('planejamento', () => {
  it('move paradas na lista e não passa dos limites', () => {
    const r = rotaABC();
    expect(moverParada(r, 'b', -1).paradas.map((p) => p.id)).toEqual([
      'b', 'a', 'c',
    ]);
    expect(moverParada(r, 'a', -1)).toBe(r);
    expect(moverParada(r, 'c', 1)).toBe(r);
  });

  it('aplica a ordem do Optimization (posição na viagem por ponto)', () => {
    // Enviados: [origem, A, B, C]; viagem ótima: origem → C → A → B
    const ordem = aplicarOrdemOtimizada([A, B, C], [0, 2, 3, 1]);
    expect(ordem.map((p) => p.id)).toEqual(['c', 'a', 'b']);
  });

  it('paradas visitadas saem das pendentes', () => {
    const r = marcarVisitada(rotaABC(), 'a', 123);
    expect(pendentes(r).map((p) => p.id)).toEqual(['b', 'c']);
  });

  it('sabe se o trajeto ainda vale para as pendentes', () => {
    const r: Rota = {
      ...rotaABC(),
      trajeto: {
        geometria: [],
        distanciaM: 0,
        duracaoS: 0,
        passos: [],
        ordem: ['a', 'b', 'c'],
        calculadoEm: 0,
      },
    };
    expect(trajetoAtual(r)).toBe(true);
    expect(trajetoAtual(moverParada(r, 'b', 1))).toBe(false);
  });
});

/** Resposta mínima no formato do Mapbox Directions v5. */
const respostaDirecoes = {
  code: 'Ok',
  routes: [
    {
      distance: 2200,
      duration: 300,
      geometry: { coordinates: [] },
      legs: [
        {
          steps: [
            {
              distance: 1100,
              duration: 150,
              name: 'Rua A',
              geometry: { coordinates: [[-48.55, -27.59], [-48.55, -27.6]] },
              maneuver: {
                instruction: 'Siga para o sul na Rua A',
                type: 'depart',
                location: [-48.55, -27.59],
              },
            },
            {
              distance: 1100,
              duration: 150,
              name: 'Rua B',
              geometry: { coordinates: [[-48.55, -27.6], [-48.56, -27.6]] },
              maneuver: {
                instruction: 'Vire à direita na Rua B',
                type: 'turn',
                modifier: 'right',
                location: [-48.55, -27.6],
              },
            },
            {
              distance: 0,
              duration: 0,
              name: 'Rua B',
              geometry: { coordinates: [[-48.56, -27.6], [-48.56, -27.6]] },
              maneuver: {
                instruction: 'Você chegou ao destino',
                type: 'arrive',
                location: [-48.56, -27.6],
              },
            },
          ],
        },
      ],
    },
  ],
};

describe('navegação', () => {
  const trajeto = converterDirecoes(respostaDirecoes, ['b'], 0);

  it('converte a resposta do Directions sem repetir pontos de junção', () => {
    expect(trajeto.passos).toHaveLength(3);
    expect(trajeto.geometria).toHaveLength(4);
    expect(trajeto.passos.map((p) => p.inicioGeometria)).toEqual([0, 1, 2]);
    expect(trajeto.passos[1].modificador).toBe('right');
  });

  it('recusa resposta sem rota', () => {
    expect(() =>
      converterDirecoes({ code: 'NoRoute', routes: [] }, [], 0),
    ).toThrow('Não foi encontrado caminho');
  });

  it('mede distância até um segmento', () => {
    const a = { latitude: -27.6, longitude: -48.55 };
    const b = { latitude: -27.6, longitude: -48.56 };
    // ~0,0005° de latitude ao norte do segmento ≈ 55 m
    const p = { latitude: -27.5995, longitude: -48.555 };
    expect(distanciaAoSegmentoM(p, a, b)).toBeCloseTo(55.7, 0);
  });

  it('no começo, a próxima manobra é a curva à direita', () => {
    const pr = progresso(trajeto, { latitude: -27.592, longitude: -48.55 });
    expect(trajeto.passos[pr.proximoPasso].tipo).toBe('turn');
    expect(pr.distanciaManobraM).toBeGreaterThan(800);
    expect(pr.foraDaRota).toBe(false);
  });

  it('depois da curva, a próxima é a chegada', () => {
    const pr = progresso(trajeto, { latitude: -27.6, longitude: -48.557 });
    expect(trajeto.passos[pr.proximoPasso].tipo).toBe('arrive');
    expect(pr.restanteM).toBeLessThan(400);
  });

  it('detecta quando saiu da rota', () => {
    const pr = progresso(trajeto, { latitude: -27.595, longitude: -48.54 });
    expect(pr.foraDaRota).toBe(true);
  });

  it('reconhece a chegada perto da parada', () => {
    const r = rotaABC();
    expect(paradaAlcancada(r, { latitude: -27.6001, longitude: -48.56 })?.id).toBe('b');
    expect(paradaAlcancada(r, { latitude: -27.605, longitude: -48.565 })).toBeUndefined();
  });
});
