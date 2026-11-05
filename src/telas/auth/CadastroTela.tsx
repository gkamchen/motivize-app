import { useState } from 'react';
import { useSessao } from '../../estado/SessaoContext';
import { Aviso, Botao, Campo, Cartao, Tela } from '../../ui/componentes';
import { Cabecalho } from './Cabecalho';
import { erroEmail, erroNome, erroSenha } from './validacao';

export function CadastroTela() {
  const { cadastrar } = useSessao();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [tentou, setTentou] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const erros = {
    nome: erroNome(nome),
    email: erroEmail(email),
    senha: erroSenha(senha),
    confirmacao:
      confirmacao !== senha ? 'As senhas não conferem.' : undefined,
  };
  const valido = Object.values(erros).every((e) => !e);

  const enviar = async () => {
    setTentou(true);
    if (!valido) return;
    setCarregando(true);
    setErro(null);
    try {
      await cadastrar(nome, email, senha);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível cadastrar.');
      setCarregando(false);
    }
  };

  return (
    <Tela bordas={[]}>
      <Cabecalho subtitulo="Crie sua conta para guardar as jornadas no servidor." />
      <Cartao>
        <Campo
          rotulo="Nome"
          value={nome}
          onChangeText={setNome}
          autoCapitalize="words"
          autoComplete="name"
          erro={tentou ? erros.nome : undefined}
        />
        <Campo
          rotulo="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          erro={tentou ? erros.email : undefined}
        />
        <Campo
          rotulo="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          autoComplete="new-password"
          erro={tentou ? erros.senha : undefined}
        />
        <Campo
          rotulo="Confirmar senha"
          value={confirmacao}
          onChangeText={setConfirmacao}
          secureTextEntry
          autoComplete="new-password"
          onSubmitEditing={enviar}
          erro={tentou ? erros.confirmacao : undefined}
        />
        {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
        <Botao titulo="Criar conta" carregando={carregando} aoPressionar={enviar} />
      </Cartao>
    </Tela>
  );
}
