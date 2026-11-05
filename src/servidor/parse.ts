/**
 * Integração opcional com um servidor Parse (por exemplo, Back4App).
 *
 * As credenciais vêm de variáveis de ambiente (arquivo .env, fora do git).
 * Sem elas o app funciona só no aparelho ("modo local").
 *
 * Use a *Client key* / *JavaScript key* do app Parse, nunca a Master key,
 * e proteja as classes com permissões (CLP) e ACL por usuário.
 */
import type { Jornada } from '../domain/jornada';
import type { Sessao } from './sessao';

const URL_SERVIDOR = (
  process.env.EXPO_PUBLIC_PARSE_SERVER_URL ?? 'https://parseapi.back4app.com'
).replace(/\/+$/, '');
const APP_ID = process.env.EXPO_PUBLIC_PARSE_APP_ID ?? '';
const CHAVE_CLIENTE = process.env.EXPO_PUBLIC_PARSE_CLIENT_KEY ?? '';

export const servidorConfigurado = APP_ID !== '' && CHAVE_CLIENTE !== '';

export class ErroServidor extends Error {
  constructor(
    message: string,
    readonly codigo?: number,
  ) {
    super(message);
    this.name = 'ErroServidor';
  }
}

/** Mensagens em português para os códigos de erro mais comuns do Parse. */
const MENSAGENS: Record<number, string> = {
  101: 'E-mail ou senha inválidos.',
  125: 'E-mail inválido.',
  200: 'Informe o e-mail.',
  201: 'Informe a senha.',
  202: 'Já existe uma conta com este e-mail.',
  203: 'Já existe uma conta com este e-mail.',
  205: 'Nenhuma conta encontrada com este e-mail.',
  209: 'Sua sessão expirou. Entre novamente.',
};

async function chamar<T>(
  caminho: string,
  opcoes: { metodo?: string; corpo?: unknown; token?: string } = {},
): Promise<T> {
  if (!servidorConfigurado) {
    throw new ErroServidor('Servidor não configurado.');
  }
  const cabecalhos: Record<string, string> = {
    'X-Parse-Application-Id': APP_ID,
    'X-Parse-Client-Key': CHAVE_CLIENTE,
    'Content-Type': 'application/json',
  };
  if (opcoes.token) cabecalhos['X-Parse-Session-Token'] = opcoes.token;

  let resposta: Response;
  try {
    resposta = await fetch(`${URL_SERVIDOR}${caminho}`, {
      method: opcoes.metodo ?? 'GET',
      headers: cabecalhos,
      body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
    });
  } catch {
    throw new ErroServidor('Sem conexão com o servidor.');
  }

  const dados = (await resposta.json().catch(() => ({}))) as {
    code?: number;
    error?: string;
  } & T;
  if (!resposta.ok) {
    const codigo = dados.code;
    const msg =
      (codigo !== undefined && MENSAGENS[codigo]) ||
      dados.error ||
      `Erro ${resposta.status} no servidor.`;
    throw new ErroServidor(msg, codigo);
  }
  return dados;
}

interface UsuarioParse {
  objectId: string;
  sessionToken: string;
  username: string;
  email?: string;
  nome?: string;
}

function paraSessao(u: UsuarioParse, nome?: string): Sessao {
  return {
    modo: 'servidor',
    nome: nome || u.nome || u.username,
    email: u.email ?? u.username,
    usuarioId: u.objectId,
    token: u.sessionToken,
  };
}

export async function entrar(email: string, senha: string): Promise<Sessao> {
  // POST no /login: a senha vai no corpo, nunca na URL.
  const u = await chamar<UsuarioParse>('/login', {
    metodo: 'POST',
    corpo: { username: email.trim().toLowerCase(), password: senha },
  });
  return paraSessao(u);
}

export async function cadastrar(
  nome: string,
  email: string,
  senha: string,
): Promise<Sessao> {
  const emailNormalizado = email.trim().toLowerCase();
  const u = await chamar<UsuarioParse>('/users', {
    metodo: 'POST',
    corpo: {
      username: emailNormalizado,
      email: emailNormalizado,
      password: senha,
      nome: nome.trim(),
    },
  });
  return paraSessao({ ...u, username: emailNormalizado, email: emailNormalizado }, nome.trim());
}

export async function recuperarSenha(email: string): Promise<void> {
  await chamar('/requestPasswordReset', {
    metodo: 'POST',
    corpo: { email: email.trim().toLowerCase() },
  });
}

export async function sair(token: string): Promise<void> {
  await chamar('/logout', { metodo: 'POST', token }).catch(() => undefined);
}

/**
 * Envia uma jornada encerrada para a classe "Jornada".
 * Só o próprio usuário consegue ler a jornada (ACL).
 */
export async function enviarJornada(
  jornada: Jornada,
  sessao: Extract<Sessao, { modo: 'servidor' }>,
): Promise<void> {
  const ponteiro = {
    __type: 'Pointer',
    className: '_User',
    objectId: sessao.usuarioId,
  };
  const corpo = {
    jornadaId: jornada.id,
    dia: jornada.dia,
    inicio: { __type: 'Date', iso: new Date(jornada.inicio).toISOString() },
    fim: jornada.fim
      ? { __type: 'Date', iso: new Date(jornada.fim).toISOString() }
      : undefined,
    trechos: jornada.trechos,
    percurso: jornada.percurso,
    usuario: ponteiro,
    ACL: { [sessao.usuarioId]: { read: true, write: true } },
  };
  await chamar('/classes/Jornada', {
    metodo: 'POST',
    corpo,
    token: sessao.token,
  });
}
