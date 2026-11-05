import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { View } from 'react-native';
import { useSessao } from '../../estado/SessaoContext';
import type { RotasAuth } from '../../navegacao/rotas';
import { Aviso, Botao, Campo, Cartao, Tela, Texto } from '../../ui/componentes';
import { espaco } from '../../ui/tema';
import { Cabecalho } from './Cabecalho';
import { erroEmail, erroNome } from './validacao';

type Props = NativeStackScreenProps<RotasAuth, 'Entrar'>;

export function EntrarTela({ navigation }: Props) {
  const { servidorConfigurado } = useSessao();
  return (
    <Tela>
      <Cabecalho subtitulo="Sua jornada em campo, do primeiro deslocamento ao último atendimento." />
      {servidorConfigurado ? (
        <FormularioServidor
          aoCadastrar={() => navigation.navigate('Cadastro')}
          aoRecuperar={() => navigation.navigate('RecuperarSenha')}
        />
      ) : (
        <FormularioLocal />
      )}
    </Tela>
  );
}

function FormularioLocal() {
  const { usarLocal } = useSessao();
  const [nome, setNome] = useState('');
  const [tentou, setTentou] = useState(false);
  const erro = tentou ? erroNome(nome) : undefined;

  const comecar = () => {
    setTentou(true);
    if (!erroNome(nome)) void usarLocal(nome);
  };

  return (
    <Cartao>
      <Texto forte>Como podemos te chamar?</Texto>
      <Campo
        rotulo="Nome"
        placeholder="Seu nome"
        value={nome}
        onChangeText={setNome}
        autoCapitalize="words"
        autoComplete="name"
        returnKeyType="go"
        onSubmitEditing={comecar}
        erro={erro}
      />
      <Botao titulo="Começar" aoPressionar={comecar} />
      <Texto suave tamanho={13}>
        Os dados ficam salvos neste aparelho. Nenhuma conta é necessária.
      </Texto>
    </Cartao>
  );
}

function FormularioServidor({
  aoCadastrar,
  aoRecuperar,
}: {
  aoCadastrar: () => void;
  aoRecuperar: () => void;
}) {
  const { entrar } = useSessao();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tentou, setTentou] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const erroE = tentou ? erroEmail(email) : undefined;
  const erroS = tentou && !senha ? 'Informe a senha.' : undefined;

  const enviar = async () => {
    setTentou(true);
    if (erroEmail(email) || !senha) return;
    setCarregando(true);
    setErro(null);
    try {
      await entrar(email, senha);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar.');
      setCarregando(false);
    }
  };

  return (
    <View style={{ gap: espaco.l }}>
      <Cartao>
        <Campo
          rotulo="E-mail"
          placeholder="voce@empresa.com.br"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          erro={erroE}
        />
        <Campo
          rotulo="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          autoComplete="password"
          returnKeyType="go"
          onSubmitEditing={enviar}
          erro={erroS}
        />
        {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
        <Botao titulo="Entrar" carregando={carregando} aoPressionar={enviar} />
        <Botao titulo="Esqueci minha senha" variante="texto" aoPressionar={aoRecuperar} />
      </Cartao>
      <Botao titulo="Criar conta" variante="contorno" aoPressionar={aoCadastrar} />
    </View>
  );
}
