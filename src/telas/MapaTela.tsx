import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { atendimentos } from '../domain/jornada';
import { distanciaTotalM, formatarDistancia } from '../domain/percurso';
import { useAgora, useJornada } from '../estado/JornadaContext';
import { MapaPercurso } from '../mapa/MapaPercurso';
import { marcadoresDa } from '../mapa/marcadores';
import { Botao, Cartao, Tela, Texto } from '../ui/componentes';
import { espaco, useTema } from '../ui/tema';

export function MapaTela() {
  const t = useTema();
  const j = useJornada();
  const agora = useAgora(j.status !== 'parado', 15_000);
  const [seguir, setSeguir] = useState(false);

  const jornada = j.jornada;
  const percurso = jornada?.percurso ?? [];
  const marcadores = jornada ? marcadoresDa(jornada, agora) : [];
  const qtd = jornada ? atendimentos(jornada).length : 0;

  return (
    <Tela rolar={false}>
      <View style={{ flex: 1 }}>
        <MapaPercurso
          percurso={percurso}
          marcadores={marcadores}
          posicao={j.posicao}
          seguirPosicao={seguir}
        />
        <View style={estilos.sobreposicao} pointerEvents="box-none">
          <Cartao estilo={estilos.painel}>
            {jornada ? (
              <>
                <Texto forte>Percurso de hoje</Texto>
                <Texto suave tamanho={13}>
                  {formatarDistancia(distanciaTotalM(percurso))} ·{' '}
                  {qtd} {qtd === 1 ? 'atendimento' : 'atendimentos'} ·{' '}
                  {percurso.length} pontos de GPS
                </Texto>
                <View style={estilos.legenda}>
                  <Legenda cor={t.trecho.deslocamento} texto="Trajeto" />
                  <Legenda cor={t.trecho.atendimento} texto="Atendimento" />
                  <Legenda cor={t.trecho.intervalo} texto="Intervalo" />
                </View>
              </>
            ) : (
              <>
                <Texto forte>Nenhum dia em andamento</Texto>
                <Texto suave tamanho={13}>
                  Ao iniciar o dia, o trajeto e os atendimentos aparecem aqui.
                  Dias anteriores ficam no Histórico.
                </Texto>
                {j.permissao !== 'concedida' ? (
                  <Botao
                    titulo="Mostrar minha localização"
                    variante="contorno"
                    aoPressionar={() => void j.pedirPermissao()}
                  />
                ) : null}
              </>
            )}
          </Cartao>
          {j.posicao ? (
            <View style={estilos.acoes}>
              <Botao
                titulo={seguir ? 'Ver percurso inteiro' : 'Centralizar em mim'}
                variante="primario"
                aoPressionar={() => setSeguir((s) => !s)}
              />
            </View>
          ) : null}
        </View>
      </View>
    </Tela>
  );
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View
        style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cor }}
      />
      <Texto suave tamanho={12}>
        {texto}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  sobreposicao: {
    position: 'absolute',
    top: espaco.m,
    left: espaco.m,
    right: espaco.m,
    bottom: espaco.m,
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  painel: {
    gap: espaco.xs,
    maxWidth: 520,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  legenda: { flexDirection: 'row', gap: espaco.m, marginTop: espaco.xs },
  acoes: { alignSelf: 'center' },
});
