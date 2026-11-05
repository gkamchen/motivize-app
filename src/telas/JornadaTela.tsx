import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { trechoAberto, atendimentos, type TipoTrecho } from '../domain/jornada';
import { distanciaTotalM, formatarDistancia } from '../domain/percurso';
import {
  formatarDuracao,
  formatarDia,
  formatarHora,
  percentuais,
  totais,
} from '../domain/tempo';
import { useAgora, useJornada } from '../estado/JornadaContext';
import { useSessao } from '../estado/SessaoContext';
import {
  Aviso,
  Botao,
  Campo,
  Cartao,
  Pilula,
  Tela,
  Texto,
  Titulo,
} from '../ui/componentes';
import { confirmar } from '../ui/confirmar';
import { GraficoRosca } from '../ui/GraficoRosca';
import { NOME_STATUS, NOME_TRECHO, espaco, useTema } from '../ui/tema';

const ORDEM: TipoTrecho[] = ['deslocamento', 'atendimento', 'intervalo'];

function saudacao(agora: number): string {
  const h = new Date(agora).getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function JornadaTela() {
  const t = useTema();
  const { sessao } = useSessao();
  const j = useJornada();
  const agora = useAgora(j.status !== 'parado');
  const [cliente, setCliente] = useState('');
  const [observacao, setObservacao] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const executar = async (acao: () => Promise<void>) => {
    setOcupado(true);
    setErro(null);
    try {
      await acao();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Algo deu errado.');
    } finally {
      setOcupado(false);
    }
  };

  const soma = totais(j.jornada, agora);
  const aberto = trechoAberto(j.jornada);
  const pct = percentuais(ORDEM.map((k) => soma[k]));
  const corStatus = j.status === 'parado' ? t.textoSuave : t.trecho[j.status];
  const qtdAtendimentos = j.jornada ? atendimentos(j.jornada).length : 0;
  const distancia = j.jornada ? distanciaTotalM(j.jornada.percurso) : 0;

  return (
    <Tela>
      <View style={{ gap: espaco.xs }}>
        <Texto suave>
          {saudacao(agora)}, {sessao?.nome.split(' ')[0]}
        </Texto>
        <Titulo>
          {j.jornada ? formatarDia(j.jornada.dia) : 'Pronto para começar?'}
        </Titulo>
      </View>

      {j.permissao === 'negada' && j.status !== 'parado' ? (
        <View style={{ gap: espaco.s }}>
          <Aviso tipo="erro">
            Sem acesso à localização: os tempos continuam sendo contados, mas
            o percurso e o local dos atendimentos não serão registrados.
            Libere a localização nas configurações do aparelho.
          </Aviso>
          <Botao
            titulo="Tentar de novo"
            variante="texto"
            aoPressionar={() => void j.pedirPermissao()}
          />
        </View>
      ) : null}

      <Cartao>
        <View style={estilos.linhaTopo}>
          <Pilula cor={corStatus} texto={NOME_STATUS[j.status]} />
          {j.jornada ? (
            <Texto suave tamanho={13}>
              desde {formatarHora(j.jornada.inicio)}
            </Texto>
          ) : null}
        </View>

        <GraficoRosca
          fatias={ORDEM.map((k) => ({ valor: soma[k], cor: t.trecho[k] }))}
          centro={
            <View style={{ alignItems: 'center' }}>
              <Texto suave tamanho={12}>
                {aberto ? NOME_TRECHO[aberto.tipo].toUpperCase() : 'TOTAL'}
              </Texto>
              <Texto forte tamanho={28}>
                {formatarDuracao(aberto ? agora - aberto.inicio : soma.total)}
              </Texto>
              {aberto?.cliente ? (
                <Texto suave tamanho={12}>
                  {aberto.cliente}
                </Texto>
              ) : null}
            </View>
          }
        />

        <View style={{ gap: espaco.s }}>
          {ORDEM.map((k, i) => (
            <View key={k} style={estilos.legenda}>
              <View style={[estilos.cor, { backgroundColor: t.trecho[k] }]} />
              <View style={{ flex: 1 }}>
                <Texto>{NOME_TRECHO[k]}</Texto>
              </View>
              <Texto suave tamanho={13}>
                {pct[i]}%
              </Texto>
              <View style={{ width: 84, alignItems: 'flex-end' }}>
                <Texto forte>{formatarDuracao(soma[k])}</Texto>
              </View>
            </View>
          ))}
        </View>

        {j.jornada ? (
          <View style={[estilos.resumo, { borderTopColor: t.borda }]}>
            <Texto suave tamanho={13}>
              {qtdAtendimentos}{' '}
              {qtdAtendimentos === 1 ? 'atendimento' : 'atendimentos'}
            </Texto>
            <Texto suave tamanho={13}>
              {formatarDistancia(distancia)} percorridos
            </Texto>
          </View>
        ) : null}
      </Cartao>

      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}

      {j.status === 'parado' ? (
        <Botao
          titulo="Iniciar dia"
          carregando={ocupado}
          aoPressionar={() => executar(j.iniciarDia)}
        />
      ) : null}

      {j.status === 'deslocamento' ? (
        <View style={{ gap: espaco.m }}>
          <Campo
            rotulo="Cliente ou local do próximo atendimento (opcional)"
            placeholder="Ex.: Posto Central"
            value={cliente}
            onChangeText={setCliente}
            returnKeyType="done"
          />
          <Botao
            titulo="Iniciar atendimento"
            cor={t.trecho.atendimento}
            carregando={ocupado}
            aoPressionar={() =>
              executar(async () => {
                await j.iniciarAtendimento(cliente);
                setCliente('');
              })
            }
          />
          <Botao
            titulo="Iniciar intervalo"
            variante="contorno"
            cor={t.trecho.intervalo}
            desabilitado={ocupado}
            aoPressionar={() => executar(j.iniciarIntervalo)}
          />
          <Botao
            titulo="Finalizar dia"
            variante="texto"
            cor={t.perigo}
            desabilitado={ocupado}
            aoPressionar={() =>
              executar(async () => {
                const ok = await confirmar(
                  'Finalizar o dia?',
                  'A jornada vai para o histórico e não poderá ser retomada.',
                  'Finalizar',
                );
                if (ok) await j.finalizarDia();
              })
            }
          />
        </View>
      ) : null}

      {j.status === 'atendimento' ? (
        <View style={{ gap: espaco.m }}>
          <Campo
            rotulo="Observação do atendimento (opcional)"
            placeholder="Ex.: pedido fechado, voltar na sexta"
            value={observacao}
            onChangeText={setObservacao}
            multiline
          />
          <Botao
            titulo="Finalizar atendimento"
            cor={t.trecho.atendimento}
            carregando={ocupado}
            aoPressionar={() =>
              executar(async () => {
                await j.finalizarAtendimento(observacao);
                setObservacao('');
              })
            }
          />
        </View>
      ) : null}

      {j.status === 'intervalo' ? (
        <Botao
          titulo="Finalizar intervalo"
          cor={t.trecho.intervalo}
          carregando={ocupado}
          aoPressionar={() => executar(j.finalizarIntervalo)}
        />
      ) : null}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  linhaTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legenda: { flexDirection: 'row', alignItems: 'center', gap: espaco.s },
  cor: { width: 12, height: 12, borderRadius: 3 },
  resumo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: espaco.m,
  },
});
