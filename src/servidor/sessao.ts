/** Usuário que está usando o app. */
export type Sessao =
  | {
      modo: 'local';
      nome: string;
    }
  | {
      modo: 'servidor';
      nome: string;
      email: string;
      usuarioId: string;
      token: string;
    };
