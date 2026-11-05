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
import { AppState } from 'react-native';
import * as regras from '../domain/jornada';
import type { Jornada, Ponto, Status } from '../domain/jornada';
import { adicionarPonto } from '../domain/percurso';
import { armazenamento } from '../storage/armazenamento';
import { enviarJornada } from '../servidor/parse';
import {
  acompanhar,
  pedirPermissao,
  posicaoAtual,
  type PermissaoLocal,
} from './localizacao';
import { useSessao } from './SessaoContext';

interface ValorJornada {
  carregando: boolean;
  jornada: Jornada | null;
  status: Status;
  historico: Jornada[];
  posicao: Ponto | undefined;
  permissao: PermissaoLocal;
  /** Quantas jornadas encerradas ainda não foram para o servidor. */
  pendentesEnvio: number;
  pedirPermissao: () => Promise<void>;
  iniciarDia: () => Promise<void>;
  finalizarDia: () => Promise<void>;
  iniciarAtendimento: (cliente?: string) => Promise<void>;
  finalizarAtendimento: (observacao?: string) => Promise<void>;
  iniciarIntervalo: () => Promise<void>;
  finalizarIntervalo: () => Promise<void>;
  removerDoHistorico: (id: string) => Promise<void>;
  enviarPendentes: () => Promise<number>;
  /** Mantém o GPS ligado (navegação), mesmo sem dia iniciado. */
  setNavegando: (ativo: boolean) => void;
}

const Contexto = createContext<ValorJornada | null>(null);
const novoId = () => randomUUID();

export function JornadaProvider({ children }: { children: ReactNode }) {
  const { sessao } = useSessao();
  const [carregando, setCarregando] = useState(true);
  const [jornada, setJornadaEstado] = useState<Jornada | null>(null);
  const [historico, setHistorico] = useState<Jornada[]>([]);
  const [posicao, setPosicao] = useState<Ponto | undefined>();
  const [permissao, setPermissao] = useState<PermissaoLocal>('pendente');

  // Cópia sempre atual para os callbacks do GPS não usarem estado velho.
  const jornadaRef = useRef<Jornada | null>(null);
  const posicaoRef = useRef<Ponto | undefined>(undefined);

  const setJornada = useCallback((j: Jornada | null) => {
    jornadaRef.current = j;
    setJornadaEstado(j);
    void armazenamento.gravarJornadaAtual(j);
  }, []);

  useEffect(() => {
    Promise.all([
      armazenamento.lerJornadaAtual(),
      armazenamento.lerHistorico(),
    ]).then(([j, h]) => {
      jornadaRef.current = j;
      setJornadaEstado(j);
      setHistorico(h);
      setCarregando(false);
    });
  }, []);

  const [navegando, setNavegando] = useState(false);
  const status = regras.statusDa(jornada);
  const diaAtivo = status !== 'parado';
  const gpsLigado = diaAtivo || navegando;

  // Sobe a cada nova tentativa de ligar o GPS (botão ou volta ao app).
  const [tentativaGps, setTentativaGps] = useState(0);

  // Se a localização estava negada e o usuário volta ao app (talvez depois
  // de liberar nas configurações), tenta de novo.
  useEffect(() => {
    if (permissao !== 'negada') return;
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') setTentativaGps((n) => n + 1);
    });
    return () => assinatura.remove();
  }, [permissao]);

  // GPS: acompanha a posição enquanto o dia está em andamento (ou
  // durante a navegação). O percurso só é gravado com o dia iniciado.
  useEffect(() => {
    if (!gpsLigado) return;
    let parar: (() => void) | undefined;
    let cancelado = false;
    (async () => {
      const p = await pedirPermissao();
      setPermissao(p);
      if (p !== 'concedida' || cancelado) return;
      try {
        parar = await acompanhar((ponto) => {
          posicaoRef.current = ponto;
          setPosicao(ponto);
          const atual = jornadaRef.current;
          if (!atual || atual.fim !== undefined) return;
          const trilha = adicionarPonto(atual.percurso, ponto);
          if (trilha !== atual.percurso) {
            setJornada({ ...atual, percurso: trilha });
          }
        });
      } catch {
        setPermissao('negada');
      }
      if (cancelado) parar?.();
    })();
    return () => {
      cancelado = true;
      parar?.();
    };
  }, [gpsLigado, tentativaGps, setJornada]);

  const localAgora = useCallback(async (): Promise<Ponto | undefined> => {
    const recente = posicaoRef.current;
    if (recente && Date.now() - recente.em < 60_000) return recente;
    if (permissao !== 'concedida') return recente;
    return (await posicaoAtual()) ?? recente;
  }, [permissao]);

  const enviar = useCallback(
    async (lista: Jornada[]): Promise<number> => {
      if (sessao?.modo !== 'servidor') return 0;
      let enviadas = 0;
      let atualizada = lista;
      for (const j of lista) {
        if (j.fim === undefined || j.sincronizadaEm) continue;
        try {
          await enviarJornada(j, sessao);
          const marcada = { ...j, sincronizadaEm: Date.now() };
          atualizada = await armazenamento.salvarNoHistorico(marcada);
          enviadas += 1;
        } catch {
          break; // sem conexão: tenta de novo depois
        }
      }
      setHistorico(atualizada);
      return enviadas;
    },
    [sessao],
  );

  // Ao abrir o app (ou entrar), tenta enviar o que ficou pendente.
  useEffect(() => {
    if (carregando) return;
    const id = setTimeout(() => void enviar(historico), 1500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregando, sessao]);

  const aplicar = useCallback(
    (fn: (j: Jornada) => Jornada) => {
      const atual = jornadaRef.current;
      if (!atual) return;
      setJornada(fn(atual));
    },
    [setJornada],
  );

  const valor = useMemo<ValorJornada>(
    () => ({
      carregando,
      jornada,
      status,
      historico,
      posicao,
      permissao,
      pendentesEnvio:
        sessao?.modo === 'servidor'
          ? historico.filter((j) => j.fim !== undefined && !j.sincronizadaEm)
              .length
          : 0,
      pedirPermissao: async () => {
        const p = await pedirPermissao();
        setPermissao(p);
        setTentativaGps((n) => n + 1);
        if (p === 'concedida') {
          const ponto = await posicaoAtual();
          if (ponto) {
            posicaoRef.current = ponto;
            setPosicao(ponto);
          }
        }
      },
      iniciarDia: async () => {
        if (jornadaRef.current && jornadaRef.current.fim === undefined) return;
        const nova = regras.iniciarDia(Date.now(), novoId);
        const ponto = posicaoRef.current;
        setJornada(ponto ? { ...nova, percurso: [ponto] } : nova);
      },
      finalizarDia: async () => {
        const atual = jornadaRef.current;
        if (!atual) return;
        const encerrada = regras.finalizarDia(atual, Date.now());
        const lista = await armazenamento.salvarNoHistorico(encerrada);
        setHistorico(lista);
        setJornada(null);
        void enviar(lista);
      },
      iniciarAtendimento: async (cliente) => {
        const local = await localAgora();
        aplicar((j) =>
          regras.iniciarAtendimento(j, Date.now(), novoId, { local, cliente }),
        );
      },
      finalizarAtendimento: async (observacao) =>
        aplicar((j) =>
          regras.finalizarAtendimento(j, Date.now(), novoId, observacao),
        ),
      iniciarIntervalo: async () => {
        const local = await localAgora();
        aplicar((j) => regras.iniciarIntervalo(j, Date.now(), novoId, local));
      },
      finalizarIntervalo: async () =>
        aplicar((j) => regras.finalizarIntervalo(j, Date.now(), novoId)),
      removerDoHistorico: async (id) =>
        setHistorico(await armazenamento.removerDoHistorico(id)),
      enviarPendentes: () => enviar(historico),
      setNavegando,
    }),
    [
      carregando, jornada, status, historico, posicao, permissao, sessao,
      setJornada, aplicar, localAgora, enviar,
    ],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useJornada(): ValorJornada {
  const v = useContext(Contexto);
  if (!v) throw new Error('useJornada fora do JornadaProvider');
  return v;
}

/** Relógio para a tela: atualiza a cada `intervaloMs` enquanto ativo. */
export function useAgora(ativo: boolean, intervaloMs = 1000): number {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const tique = () => setAgora(Date.now());
    const primeiro = setTimeout(tique, 0);
    if (!ativo) return () => clearTimeout(primeiro);
    const id = setInterval(tique, intervaloMs);
    return () => {
      clearTimeout(primeiro);
      clearInterval(id);
    };
  }, [ativo, intervaloMs]);
  return agora;
}
