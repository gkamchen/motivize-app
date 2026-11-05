import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { distanciaTotalM, formatarDistancia } from '../domain/percurso';
import {
  formatarDia,
  formatarDuracao,
  formatarDuracaoCurta,
  formatarHora,
  totais,
} from '../domain/tempo';
import { useJornada } from '../estado/JornadaContext';
import { MapaPercurso } from '../mapa/MapaPercurso';
import { marcadoresDa } from '../mapa/marcadores';
import type { RotasApp } from '../navegacao/rotas';
import { Botao, Cartao, Tela, Texto, Titulo } from '../ui/componentes';
import { confirmar } from '../ui/confirmar';
import { NOME_TRECHO, espaco, raio, useTema } from '../ui/tema';
import { Barra } from './HistoricoTela';

type Props = NativeStackScreenProps<RotasApp, 'DetalheJornada'>;

export function DetalheJornadaTela({ route, navigation }: Props) {
  const t = useTema();
  const { historico, removerDoHistorico } = useJornada();
  const jornada = historico.find((j) => j.id === route.params.id);

  if (!jornada) {
    return (
      <Tela bordas={[]}>
        <Texto>Esta jornada não existe mais.</Texto>
      </Tela>
    );
  }

  const fim = jornada.fim ?? jornada.inicio;
  const soma = totais(jornada, fim);
  const marcadores = marcadoresDa(jornada, fim);
  const temMapa = jornada.percurso.length > 0 || marcadores.length > 0;
  // Número de ordem de cada atendimento (1, 2, 3…).
  const numeros = jornada.trechos.reduce<number[]>((acc, tr) => {
    const anterior = acc.length ? acc[acc.length - 1] : 0;
    acc.push(tr.tipo === 'atendimento' ? anterior + 1 : anterior);
    return acc;
  }, []);
  // Esconde deslocamentos instantâneos (ex.: entre intervalo e atendimento).
  const visiveis = jornada.trechos
    .map((tr, i) => ({ tr, numero: numeros[i] }))
    .filter(
      ({ tr }) =>
        tr.tipo !== 'deslocamento' || (tr.fim ?? fim) - tr.inicio >= 1000,
    );

  return (
    <Tela bordas={[]}>
      <Titulo>{formatarDia(jornada.dia)}</Titulo>

      {temMapa ? (
        <View style={[estilos.mapa, { borderColor: t.borda }]}>
          <MapaPercurso percurso={jornada.percurso} marcadores={marcadores} />
        </View>
      ) : null}

      <Cartao>
        <Barra jornada={jornada} />
        {(['deslocamento', 'atendimento', 'intervalo'] as const).map((k) => (
          <View key={k} style={estilos.linha}>
            <Texto>{NOME_TRECHO[k]}</Texto>
            <Texto forte cor={t.trecho[k]}>
              {formatarDuracao(soma[k])}
            </Texto>
          </View>
        ))}
        <View style={[estilos.linha, estilos.total, { borderTopColor: t.borda }]}>
          <Texto forte>Total</Texto>
          <Texto forte>{formatarDuracao(soma.total)}</Texto>
        </View>
        <Texto suave tamanho={13}>
          {formatarDistancia(distanciaTotalM(jornada.percurso))} percorridos ·{' '}
          {formatarHora(jornada.inicio)} às {formatarHora(fim)}
        </Texto>
      </Cartao>

      <Cartao estilo={{ gap: 0 }}>
        <Texto forte>Linha do tempo</Texto>
        {visiveis.map(({ tr, numero }, i) => {
          const cor = t.trecho[tr.tipo];
          const ultimo = i === visiveis.length - 1;
          return (
            <View key={tr.id} style={estilos.evento}>
              <View style={estilos.trilho}>
                <View style={[estilos.bolinha, { backgroundColor: cor }]} />
                {!ultimo ? (
                  <View style={[estilos.fio, { backgroundColor: t.borda }]} />
                ) : null}
              </View>
              <View style={{ flex: 1, paddingBottom: espaco.m, gap: 2 }}>
                <Texto forte>
                  {tr.tipo === 'atendimento'
                    ? `${numero}. ${tr.cliente ?? 'Atendimento'}`
                    : NOME_TRECHO[tr.tipo]}
                </Texto>
                <Texto suave tamanho={13}>
                  {formatarHora(tr.inicio)}–{formatarHora(tr.fim ?? fim)} ·{' '}
                  {formatarDuracaoCurta((tr.fim ?? fim) - tr.inicio)}
                </Texto>
                {tr.observacao ? (
                  <Texto tamanho={13}>{tr.observacao}</Texto>
                ) : null}
              </View>
            </View>
          );
        })}
      </Cartao>

      <Botao
        titulo="Excluir este dia"
        variante="texto"
        cor={t.perigo}
        aoPressionar={async () => {
          const ok = await confirmar(
            'Excluir este dia?',
            'Ele será apagado deste aparelho.',
            'Excluir',
          );
          if (ok) {
            navigation.goBack();
            await removerDoHistorico(jornada.id);
          }
        }}
      />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  mapa: {
    height: 300,
    borderRadius: raio.l,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  total: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: espaco.m },
  evento: { flexDirection: 'row', gap: espaco.m, marginTop: espaco.m },
  trilho: { alignItems: 'center', width: 14 },
  bolinha: { width: 14, height: 14, borderRadius: 7, marginTop: 3 },
  fio: { width: 2, flex: 1, marginTop: 2 },
});
