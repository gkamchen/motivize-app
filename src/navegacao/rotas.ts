import type { NavigatorScreenParams } from '@react-navigation/native';

export type RotasAuth = {
  Entrar: undefined;
  Cadastro: undefined;
  RecuperarSenha: undefined;
};

export type RotasAbas = {
  Jornada: undefined;
  Rota: undefined;
  Mapa: undefined;
  Historico: undefined;
  Perfil: undefined;
};

export type RotasApp = {
  Abas: NavigatorScreenParams<RotasAbas>;
  DetalheJornada: { id: string };
  Navegacao: undefined;
};

declare global {
  namespace ReactNavigation {
    // Permite useNavigation() tipado em qualquer tela.
    interface RootParamList extends RotasApp, RotasAuth {}
  }
}
