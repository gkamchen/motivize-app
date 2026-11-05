import Constants from 'expo-constants';
import { useState } from 'react';
import { View } from 'react-native';
import { useJornada } from '../estado/JornadaContext';
import { useSessao } from '../estado/SessaoContext';
import {
  Aviso,
  Botao,
  Campo,
  Cartao,
  Tela,
  Texto,
  Titulo,
} from '../ui/componentes';
import { confirmar } from '../ui/confirmar';
import { espaco, useTema } from '../ui/tema';

export function PerfilTela() {
  const t = useTema();
  const { sessao, alterarNome, sair } = useSessao();
  const j = useJornada();
  const [nome, setNome] = useState(sessao?.nome ?? '');
  const [msg, setMsg] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (!sessao) return null;
  const versao = Constants.expoConfig?.version ?? '';

  return (
    <Tela>
      <Titulo>Perfil</Titulo>

      <Cartao>
        <Campo
          rotulo="Seu nome"
          value={nome}
          onChangeText={setNome}
          autoCapitalize="words"
        />
        <Botao
          titulo="Salvar nome"
          variante="contorno"
          desabilitado={!nome.trim() || nome.trim() === sessao.nome}
          aoPressionar={async () => {
            await alterarNome(nome);
            setMsg('Nome atualizado.');
          }}
        />
        {msg ? <Aviso tipo="sucesso">{msg}</Aviso> : null}
      </Cartao>

      <Cartao>
        <Texto forte>Conta</Texto>
        {sessao.modo === 'servidor' ? (
          <>
            <Texto suave>{sessao.email}</Texto>
            <Texto suave tamanho={13}>
              As jornadas encerradas são enviadas ao servidor automaticamente.
              {j.pendentesEnvio > 0
                ? ` Há ${j.pendentesEnvio} pendente(s) de envio.`
                : ' Tudo enviado.'}
            </Texto>
            {j.pendentesEnvio > 0 ? (
              <Botao
                titulo="Enviar pendentes agora"
                variante="contorno"
                carregando={enviando}
                aoPressionar={async () => {
                  setEnviando(true);
                  const n = await j.enviarPendentes();
                  setEnviando(false);
                  setMsg(
                    n > 0
                      ? `${n} dia(s) enviado(s).`
                      : 'Não foi possível enviar agora. Tente com internet.',
                  );
                }}
              />
            ) : null}
          </>
        ) : (
          <Texto suave tamanho={13}>
            Modo local: tudo fica salvo só neste aparelho, sem precisar de
            internet nem de conta.
          </Texto>
        )}
      </Cartao>

      <Cartao>
        <Texto forte>Sobre o Motivize</Texto>
        <Texto suave tamanho={13}>
          Controle de jornada em campo: deslocamento, atendimentos, intervalos
          e o percurso do dia no mapa.
        </Texto>
        <Texto suave tamanho={13}>Versão {versao}</Texto>
      </Cartao>

      <View style={{ gap: espaco.s }}>
        <Botao
          titulo="Sair"
          variante="texto"
          cor={t.perigo}
          aoPressionar={async () => {
            const aviso =
              j.status !== 'parado'
                ? 'O dia em andamento continua salvo neste aparelho.'
                : 'O histórico continua salvo neste aparelho.';
            if (await confirmar('Sair do Motivize?', aviso, 'Sair')) {
              await sair();
            }
          }}
        />
      </View>
    </Tela>
  );
}
