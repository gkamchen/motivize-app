import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { randomUUID } from 'expo-crypto';
import * as regras from '../domain/rota';
import type { Coord, Parada, Rota } from '../domain/rota';
import {
  mapboxDisponivel,
  otimizarOrdem,
  tracarTrajeto,
  type Lugar,
} from '../mapbox/api';
import { armazenamento } from '../storage/armazenamento';
import { useJornada } from './JornadaContext';
import { posicaoAtual } from './localizacao';

interface ValorRota {
  rota: Rota;
  mapboxDisponivel: boolean;
  /** O trajeto desenhado corresponde às paradas pendentes. */
  trajetoEmDia: boolean;
  adicionar: (lugar: Lugar) => void;
  adicionarAqui: (nome: string) => Promise<void>;
  remover: (id: string) => void;
  mover: (id: string, sentido: -1 | 1) => void;
  limpar: () => void;
  /** Reordena as paradas pendentes pela melhor ordem e traça o caminho. */
  otimizar: () => Promise<void>;
  /** Traça o caminho na ordem atual. */
  tracar: () => Promise<void>;
  marcarVisitada: (id: string) => void;
}

const Contexto = createContext<ValorRota | null>(null);

export function RotaProvider({ children }: { children: ReactNode }) {
  const { posicao } = useJornada();
  const [rota, setRotaEstado] = useState<Rota>(regras.ROTA_VAZIA);
  const rotaRef = useRef<Rota>(regras.ROTA_VAZIA);

  useEffect(() => {
    armazenamento.lerRota().then((r) => {
      if (r) {
        rotaRef.current = r;
        setRotaEstado(r);
      }
    });
  }, []);

  const setRota = useCallback((r: Rota) => {
    rotaRef.current = r;
    setRotaEstado(r);
    void armazenamento.gravarRota(r);
  }, []);

  /** Origem do trajeto: GPS; sem GPS, a primeira parada pendente. */
  const origem = useCallback(async (): Promise<{
    origem: Coord;
    paradas: Parada[];
  }> => {
    const faltam = regras.pendentes(rotaRef.current);
    if (faltam.length === 0) throw new Error('Adicione pelo menos uma parada.');
    const aqui =
      posicao && Date.now() - posicao.em < 120_000
        ? posicao
        : await posicaoAtual(6000);
    if (aqui) return { origem: aqui, paradas: faltam };
    if (faltam.length < 2) {
      throw new Error(
        'Sem a sua localização, a rota precisa de pelo menos duas paradas.',
      );
    }
    return { origem: faltam[0].coord, paradas: faltam.slice(1) };
  }, [posicao]);

  const comTrajeto = useCallback(
    async (ordenadas: Parada[], o: Coord) => {
      if (ordenadas.length + 1 > regras.MAX_PONTOS_DIRECOES) {
        throw new Error(
          `O Mapbox traça até ${regras.MAX_PONTOS_DIRECOES - 1} paradas por vez.`,
        );
      }
      const trajeto = await tracarTrajeto(o, ordenadas);
      const visitadas = rotaRef.current.paradas.filter((p) => p.visitadaEm);
      const restantes = rotaRef.current.paradas.filter(
        (p) => !p.visitadaEm && !ordenadas.some((x) => x.id === p.id),
      );
      // Paradas usadas como origem (sem GPS) continuam na frente.
      setRota({
        paradas: [...visitadas, ...restantes, ...ordenadas],
        trajeto: {
          ...trajeto,
          ordem: regras
            .pendentes({ paradas: [...visitadas, ...restantes, ...ordenadas] })
            .map((p) => p.id),
        },
      });
    },
    [setRota],
  );

  const valor = useMemo<ValorRota>(
    () => ({
      rota,
      mapboxDisponivel,
      trajetoEmDia: regras.trajetoAtual(rota),
      adicionar: (lugar) =>
        setRota(
          regras.adicionarParada(rotaRef.current, {
            id: randomUUID(),
            nome: lugar.nome,
            endereco: lugar.endereco,
            coord: lugar.coord,
          }),
        ),
      adicionarAqui: async (nome) => {
        const aqui = posicao ?? (await posicaoAtual());
        if (!aqui) throw new Error('Não foi possível obter sua localização.');
        setRota(
          regras.adicionarParada(rotaRef.current, {
            id: randomUUID(),
            nome: nome.trim() || 'Local marcado',
            coord: { latitude: aqui.latitude, longitude: aqui.longitude },
          }),
        );
      },
      remover: (id) => setRota(regras.removerParada(rotaRef.current, id)),
      mover: (id, sentido) =>
        setRota(regras.moverParada(rotaRef.current, id, sentido)),
      limpar: () => setRota(regras.ROTA_VAZIA),
      otimizar: async () => {
        const { origem: o, paradas } = await origem();
        if (paradas.length + 1 > regras.MAX_PONTOS_OTIMIZACAO) {
          throw new Error(
            `A otimização do Mapbox aceita até ${regras.MAX_PONTOS_OTIMIZACAO - 1} paradas.`,
          );
        }
        const ordenadas =
          paradas.length > 1
            ? regras.aplicarOrdemOtimizada(
                paradas,
                await otimizarOrdem(o, paradas.map((p) => p.coord)),
              )
            : paradas;
        await comTrajeto(ordenadas, o);
      },
      tracar: async () => {
        const { origem: o, paradas } = await origem();
        await comTrajeto(paradas, o);
      },
      marcarVisitada: (id) =>
        setRota(regras.marcarVisitada(rotaRef.current, id, Date.now())),
    }),
    [rota, posicao, setRota, origem, comTrajeto],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useRota(): ValorRota {
  const v = useContext(Contexto);
  if (!v) throw new Error('useRota fora do RotaProvider');
  return v;
}
