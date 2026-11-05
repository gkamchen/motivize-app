import Ionicons from '@expo/vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { distanciaM, formatarDistancia } from '../domain/percurso';
import {
  RAIO_CHEGADA_M,
  formatarDuracaoRota,
  paradaAlcancada,
  pendentes,
  progresso,
  type Passo,
} from '../domain/rota';
import { formatarHora } from '../domain/tempo';
import { useJornada } from '../estado/JornadaContext';
import { useRota } from '../estado/RotaContext';
import { MapaPercurso } from '../mapa/MapaPercurso';
import { marcadoresDaRota } from '../mapa/marcadoresRota';
import type { RotasApp } from '../navegacao/rotas';
import { Aviso, Botao, Cartao, Texto } from '../ui/componentes';
import { espaco, raio, useTema } from '../ui/tema';

type Props = NativeStackScreenProps<RotasApp, 'Navegacao'>;
type NomeIcone = keyof typeof Ionicons.glyphMap;

/** Ícone da manobra a partir do tipo/direção do Mapbox. */
export function iconeDaManobra(passo?: Passo): NomeIcone {
  if (!passo) return 'navigate';
  if (passo.tipo === 'arrive') return 'flag';
  if (passo.tipo === 'depart') return 'navigate';
  if (passo.tipo.includes('roundabout') || passo.tipo === 'rotary') {
    return 'refresh';
  }
  const m = passo.modificador ?? '';
  if (m === 'uturn') return 'arrow-undo';
  if (m.includes('left')) return 'arrow-back';
  if (m.includes('right')) return 'arrow-forward';
  return 'arrow-up';
}

/** Fundo do banner de manobra: escuro o bastante para texto branco. */
const COR_BANNER = '#4338CA';

/** Leituras seguidas fora da rota antes de recalcular. */
const LEITURAS_PARA_RECALCULAR = 3;
const INTERVALO_MIN_RECALCULO_MS = 20_000;

export function NavegacaoTela({ navigation }: Props) {
  const t = useTema();
  const j = useJornada();
  const r = useRota();
  const [voz, setVoz] = useState(true);
  const [recalculando, setRecalculando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const foraSeguidas = useRef(0);
  const ultimoRecalculo = useRef(0);
  const ultimoFalado = useRef<string>('');

  const { setNavegando } = j;
  useEffect(() => {
    setNavegando(true);
    return () => {
      setNavegando(false);
      Speech.stop();
    };
  }, [setNavegando]);

  const trajeto = r.trajetoEmDia ? r.rota.trajeto : undefined;
  const prox = trajeto && j.posicao ? progresso(trajeto, j.posicao) : undefined;
  const passo = trajeto?.passos[prox?.proximoPasso ?? 0];
  const destino = pendentes(r.rota)[0];
  const chegou = j.posicao ? paradaAlcancada(r.rota, j.posicao) : undefined;
  const distDestino =
    destino && j.posicao ? distanciaM(j.posicao, destino.coord) : undefined;

  // Fala a instrução quando a próxima manobra muda.
  useEffect(() => {
    if (!voz || !passo) return;
    const chave = `${trajeto?.calculadoEm}-${prox?.proximoPasso}`;
    if (chave === ultimoFalado.current) return;
    ultimoFalado.current = chave;
    Speech.stop();
    Speech.speak(passo.instrucao, { language: 'pt-BR' });
  }, [voz, passo, prox?.proximoPasso, trajeto?.calculadoEm]);

  // Saiu da rota? Depois de algumas leituras seguidas, recalcula.
  const foraDaRota = prox?.foraDaRota ?? false;
  const { tracar } = r;
  useEffect(() => {
    if (!j.posicao) return;
    foraSeguidas.current = foraDaRota ? foraSeguidas.current + 1 : 0;
    const agora = Date.now();
    if (
      foraSeguidas.current >= LEITURAS_PARA_RECALCULAR &&
      agora - ultimoRecalculo.current > INTERVALO_MIN_RECALCULO_MS &&
      !recalculando
    ) {
      ultimoRecalculo.current = agora;
      foraSeguidas.current = 0;
      setRecalculando(true);
      if (voz) Speech.speak('Recalculando a rota.', { language: 'pt-BR' });
      tracar()
        .catch((e) =>
          setErro(e instanceof Error ? e.message : 'Falha ao recalcular.'),
        )
        .finally(() => setRecalculando(false));
    }
    // Reage a cada nova leitura de GPS.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [j.posicao?.em]);

  const cheguei = async () => {
    if (!destino) return;
    setErro(null);
    try {
      if (j.status === 'atendimento') {
        throw new Error('Finalize o atendimento atual antes de iniciar outro.');
      }
      // Chegar ao cliente encerra o intervalo; sem dia aberto, abre o dia.
      if (j.status === 'intervalo') await j.finalizarIntervalo();
      if (j.status === 'parado') await j.iniciarDia();
      await j.iniciarAtendimento(destino.nome);
      r.marcarVisitada(destino.id);
      Speech.stop();
      // popTo volta para as abas (navigate empilharia outra cópia).
      navigation.popTo('Abas', { screen: 'Jornada' });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível registrar.');
    }
  };

  if (!destino) {
    return (
      <SafeAreaView style={[estilos.vazio, { backgroundColor: t.fundo }]}>
        <Texto forte tamanho={20}>
          Todas as paradas foram visitadas 🎉
        </Texto>
        <Botao titulo="Voltar" aoPressionar={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  // Horário estimado de chegada a partir da última leitura do GPS.
  const chegada =
    prox && j.posicao ? j.posicao.em + prox.restanteS * 1000 : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: t.fundo }}>
      <MapaPercurso
        percurso={[]}
        marcadores={marcadoresDaRota(r.rota)}
        posicao={j.posicao}
        trajeto={trajeto?.geometria}
        seguirPosicao={Boolean(j.posicao)}
        zoomSeguir={17}
      />

      <SafeAreaView
        edges={['top', 'bottom']}
        style={estilos.camada}
        pointerEvents="box-none"
      >
        {/* Próxima manobra */}
        <View style={[estilos.manobra, { backgroundColor: COR_BANNER }]}>
          <Ionicons name={iconeDaManobra(passo)} size={40} color="#FFFFFF" />
          <View style={{ flex: 1, gap: 2 }}>
            {prox ? (
              <Texto forte tamanho={26} cor="#FFFFFF">
                {formatarDistancia(prox.distanciaManobraM)}
              </Texto>
            ) : null}
            <Texto forte tamanho={16} cor="#FFFFFF">
              {recalculando
                ? 'Recalculando a rota…'
                : !trajeto
                  ? 'Rota desatualizada: volte e trace de novo.'
                  : !j.posicao
                    ? 'Aguardando o GPS…'
                    : (passo?.instrucao ?? 'Siga em frente')}
            </Texto>
          </View>
        </View>

        <View style={{ gap: espaco.s }}>
          {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
          {j.permissao === 'negada' ? (
            <Aviso tipo="erro">
              Sem acesso à localização a navegação não acompanha você.
            </Aviso>
          ) : null}
          <Cartao estilo={estilos.painel}>
            <View style={estilos.linha}>
              <View style={{ flex: 1 }}>
                <Texto suave tamanho={12}>
                  PRÓXIMA PARADA
                </Texto>
                <Texto forte tamanho={17}>
                  {destino.nome}
                </Texto>
                {distDestino !== undefined ? (
                  <Texto suave tamanho={13}>
                    {formatarDistancia(distDestino)} em linha reta
                  </Texto>
                ) : null}
              </View>
              <Botao
                titulo={voz ? 'Voz: sim' : 'Voz: não'}
                variante="texto"
                aoPressionar={() => {
                  if (voz) Speech.stop();
                  setVoz((v) => !v);
                }}
              />
            </View>
            {prox && chegada ? (
              <Texto suave tamanho={13}>
                Fim da rota: {formatarDistancia(prox.restanteM)} ·{' '}
                {formatarDuracaoRota(prox.restanteS)} · chegada{' '}
                {formatarHora(chegada)}
              </Texto>
            ) : null}
            <Botao
              titulo={
                chegou
                  ? `Cheguei: iniciar atendimento`
                  : 'Cheguei (iniciar atendimento)'
              }
              cor={chegou ? t.trecho.atendimento : undefined}
              variante={chegou ? 'primario' : 'contorno'}
              aoPressionar={cheguei}
            />
            {!chegou ? (
              <Texto suave tamanho={12}>
                O botão fica em destaque a menos de {RAIO_CHEGADA_M} m da
                parada.
              </Texto>
            ) : null}
            <Botao
              titulo="Encerrar navegação"
              variante="texto"
              cor={t.perigo}
              aoPressionar={() => navigation.goBack()}
            />
          </Cartao>
        </View>
      </SafeAreaView>
    </View>
  );
}

const estilos = StyleSheet.create({
  camada: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'space-between',
    padding: espaco.m,
    zIndex: 1000,
  },
  manobra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    padding: espaco.l,
    borderRadius: raio.l,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  painel: {
    gap: espaco.s,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.s },
  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.l,
    padding: espaco.xl,
  },
});
