import { useState } from 'react';
import { useSessao } from '../../estado/SessaoContext';
import { Aviso, Botao, Campo, Cartao, Tela, Texto } from '../../ui/componentes';
import { Cabecalho } from './Cabecalho';
import { erroEmail } from './validacao';

export function RecuperarSenhaTela() {
  const { recuperarSenha } = useSessao();
  const [email, setEmail] = useState('');
  const [tentou, setTentou] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<
    { tipo: 'erro' | 'sucesso'; texto: string } | null
  >(null);

  const enviar = async () => {
    setTentou(true);
    if (erroEmail(email)) return;
    setCarregando(true);
    setResultado(null);
    try {
      await recuperarSenha(email);
      setResultado({
        tipo: 'sucesso',
        texto: 'Se existir uma conta com este e-mail, você vai receber um link para criar uma nova senha.',
      });
    } catch (e) {
      setResultado({
        tipo: 'erro',
        texto: e instanceof Error ? e.message : 'Não foi possível enviar.',
      });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Tela bordas={[]}>
      <Cabecalho subtitulo="Esqueceu a senha? A gente te ajuda." />
      <Cartao>
        <Texto suave>Informe o e-mail da sua conta.</Texto>
        <Campo
          rotulo="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onSubmitEditing={enviar}
          erro={tentou ? erroEmail(email) : undefined}
        />
        {resultado ? <Aviso tipo={resultado.tipo}>{resultado.texto}</Aviso> : null}
        <Botao titulo="Enviar link" carregando={carregando} aoPressionar={enviar} />
      </Cartao>
    </Tela>
  );
}
