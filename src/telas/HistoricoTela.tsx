import { useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, View } from 'react-native';
import { atendimentos, type Jornada } from '../domain/jornada';
import { distanciaTotalM, formatarDistancia } from '../domain/percurso';
import {
  formatarDia,
  formatarDuracaoCurta,
  formatarHora,
  totais,
} from '../domain/tempo';
import { useJornada } from '../estado/JornadaContext';
import { useSessao } from '../estado/SessaoContext';
import { Cartao, Tela, Texto, Titulo } from '../ui/componentes';
import { espaco, useTema } from '../ui/tema';

export function HistoricoTela() {
  const { historico } = useJornada();

  return (
    <Tela>
      <Titulo>Histórico</Titulo>
      {historico.length === 0 ? (
        <Cartao>
          <Texto forte>Nenhum dia encerrado ainda</Texto>
          <Texto suave>
            Quando você finalizar um dia, ele aparece aqui com os tempos, o
            percurso e os atendimentos.
          </Texto>
        </Cartao>
      ) : (
        historico.map((j) => <ItemDia key={j.id} jornada={j} />)
      )}
    </Tela>
  );
}

function ItemDia({ jornada }: { jornada: Jornada }) {
  const t = useTema();
  const nav = useNavigation();
  const { sessao } = useSessao();
  const soma = totais(jornada, jornada.fim ?? jornada.inicio);
  const qtd = atendimentos(jornada).length;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${formatarDia(jornada.dia)}`}
      onPress={() => nav.navigate('DetalheJornada', { id: jornada.id })}
      style={({ pressed }) => pressed && { opacity: 0.75 }}
    >
      <Cartao estilo={{ gap: espaco.s }}>
        <View style={estilos.linha}>
          <Texto forte>{formatarDia(jornada.dia)}</Texto>
          <Texto suave tamanho={13}>
            {formatarHora(jornada.inicio)}–
            {jornada.fim ? formatarHora(jornada.fim) : '…'}
          </Texto>
        </View>
        <Barra jornada={jornada} />
        <View style={estilos.linha}>
          <Texto suave tamanho={13}>
            {formatarDuracaoCurta(soma.total)} · {qtd}{' '}
            {qtd === 1 ? 'atendimento' : 'atendimentos'} ·{' '}
            {formatarDistancia(distanciaTotalM(jornada.percurso))}
          </Texto>
          {sessao?.modo === 'servidor' ? (
            <Texto
              tamanho={12}
              cor={jornada.sincronizadaEm ? t.sucesso : t.textoSuave}
            >
              {jornada.sincronizadaEm ? 'Enviado' : 'Pendente'}
            </Texto>
          ) : null}
        </View>
      </Cartao>
    </Pressable>
  );
}

/** Barra horizontal com a proporção de cada tipo de trecho. */
export function Barra({ jornada }: { jornada: Jornada }) {
  const t = useTema();
  const soma = totais(jornada, jornada.fim ?? jornada.inicio);
  const tipos = ['deslocamento', 'atendimento', 'intervalo'] as const;
  return (
    <View style={[estilos.barra, { backgroundColor: t.superficieAlta }]}>
      {soma.total > 0
        ? tipos.map((k) =>
            soma[k] > 0 ? (
              <View
                key={k}
                style={{ flex: soma[k], backgroundColor: t.trecho[k] }}
              />
            ) : null,
          )
        : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: espaco.s,
    flexWrap: 'wrap',
  },
  barra: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    gap: 2,
  },
});
