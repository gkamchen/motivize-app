import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { armazenamento } from '../storage/armazenamento';
import * as parse from '../servidor/parse';
import type { Sessao } from '../servidor/sessao';

interface ValorSessao {
  carregando: boolean;
  sessao: Sessao | null;
  servidorConfigurado: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>;
  recuperarSenha: (email: string) => Promise<void>;
  usarLocal: (nome: string) => Promise<void>;
  alterarNome: (nome: string) => Promise<void>;
  sair: () => Promise<void>;
}

const Contexto = createContext<ValorSessao | null>(null);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [sessao, setSessao] = useState<Sessao | null>(null);

  useEffect(() => {
    armazenamento.lerSessao().then((s) => {
      setSessao(s);
      setCarregando(false);
    });
  }, []);

  const definir = useCallback(async (s: Sessao | null) => {
    await armazenamento.gravarSessao(s);
    setSessao(s);
  }, []);

  const valor = useMemo<ValorSessao>(
    () => ({
      carregando,
      sessao,
      servidorConfigurado: parse.servidorConfigurado,
      entrar: async (email, senha) => definir(await parse.entrar(email, senha)),
      cadastrar: async (nome, email, senha) =>
        definir(await parse.cadastrar(nome, email, senha)),
      recuperarSenha: parse.recuperarSenha,
      usarLocal: (nome) => definir({ modo: 'local', nome: nome.trim() }),
      alterarNome: async (nome) => {
        if (sessao) await definir({ ...sessao, nome: nome.trim() });
      },
      sair: async () => {
        if (sessao?.modo === 'servidor') await parse.sair(sessao.token);
        await definir(null);
      },
    }),
    [carregando, sessao, definir],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): ValorSessao {
  const v = useContext(Contexto);
  if (!v) throw new Error('useSessao fora do SessaoProvider');
  return v;
}
