import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { formatarDuracaoRota, pendentes } from '../domain/rota';
import { formatarDistancia } from '../domain/percurso';
import { useJornada } from '../estado/JornadaContext';
import { useRota } from '../estado/RotaContext';
import { MapaPercurso } from '../mapa/MapaPercurso';
import { marcadoresDaRota } from '../mapa/marcadoresRota';
import { buscarLugares, type Lugar } from '../mapbox/api';
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
import { espaco, raio, useTema } from '../ui/tema';

export function RotaTela() {
  const t = useTema();
  const nav = useNavigation();
  const j = useJornada();
  const r = useRota();
  const [ocupado, setOcupado] = useState<null | 'otimizar' | 'tracar'>(null);
  const [erro, setErro] = useState<string | null>(null);

  const faltam = pendentes(r.rota);
  const trajeto = r.trajetoEmDia ? r.rota.trajeto : undefined;

  const executar = async (
    qual: 'otimizar' | 'tracar',
    acao: () => Promise<void>,
  ) => {
    setOcupado(qual);
    setErro(null);
    try {
      if (j.permissao !== 'concedida') await j.pedirPermissao();
      await acao();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível calcular.');
    } finally {
      setOcupado(null);
    }
  };

  return (
    <Tela>
      <Titulo>Rota do dia</Titulo>

      {!r.mapboxDisponivel ? (
        <Aviso tipo="erro">
          O planejamento de rota usa o Mapbox. Defina EXPO_PUBLIC_MAPBOX_TOKEN
          no arquivo .env e reinicie o app.
        </Aviso>
      ) : null}

      {r.rota.paradas.length > 0 ? (
        <View style={[estilos.mapa, { borderColor: t.borda }]}>
          <MapaPercurso
            percurso={[]}
            marcadores={marcadoresDaRota(r.rota)}
            posicao={j.posicao}
            trajeto={trajeto?.geometria}
          />
        </View>
      ) : null}

      <Busca />

      {r.rota.paradas.length === 0 ? (
        <Cartao>
          <Texto forte>Monte sua rota</Texto>
          <Texto suave>
            Busque os clientes ou endereços que você vai visitar. Depois toque
            em “Melhorar rota” para o Mapbox encontrar a melhor ordem e traçar
            o caminho pelas ruas.
          </Texto>
        </Cartao>
      ) : (
        <Cartao estilo={{ gap: espaco.s }}>
          <View style={estilos.linha}>
            <Texto forte>
              {r.rota.paradas.length}{' '}
              {r.rota.paradas.length === 1 ? 'parada' : 'paradas'}
            </Texto>
            {trajeto ? (
              <Texto suave tamanho={13}>
                {formatarDistancia(trajeto.distanciaM)} ·{' '}
                {formatarDuracaoRota(trajeto.duracaoS)}
              </Texto>
            ) : (
              <Texto suave tamanho={13}>
                caminho não traçado
              </Texto>
            )}
          </View>
          {r.rota.paradas.map((p, i) => {
            const visitada = Boolean(p.visitadaEm);
            const numero =
              r.rota.paradas.slice(0, i + 1).filter((x) => !x.visitadaEm)
                .length;
            return (
              <View
                key={p.id}
                style={[estilos.parada, { borderTopColor: t.borda }]}
              >
                <View
                  style={[
                    estilos.numero,
                    { backgroundColor: visitada ? t.textoSuave : t.marca },
                  ]}
                >
                  <Texto forte tamanho={13} cor="#FFFFFF">
                    {visitada ? '✓' : String(numero)}
                  </Texto>
                </View>
                <View style={{ flex: 1 }}>
                  <Texto forte={!visitada} suave={visitada}>
                    {p.nome}
                  </Texto>
                  {p.endereco ? (
                    <Texto suave tamanho={12}>
                      {p.endereco}
                    </Texto>
                  ) : null}
                </View>
                {!visitada ? (
                  <View style={estilos.acoes}>
                    <Icone
                      nome="chevron-up"
                      rotulo={`Subir ${p.nome}`}
                      aoPressionar={() => r.mover(p.id, -1)}
                      desabilitado={i === 0}
                    />
                    <Icone
                      nome="chevron-down"
                      rotulo={`Descer ${p.nome}`}
                      aoPressionar={() => r.mover(p.id, 1)}
                      desabilitado={i === r.rota.paradas.length - 1}
                    />
                  </View>
                ) : null}
                <Icone
                  nome="close"
                  rotulo={`Remover ${p.nome}`}
                  aoPressionar={() => r.remover(p.id)}
                />
              </View>
            );
          })}
        </Cartao>
      )}

      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}

      {faltam.length > 0 ? (
        <View style={{ gap: espaco.m }}>
          {trajeto ? (
            <Botao
              titulo="Iniciar navegação"
              cor={t.rota}
              aoPressionar={() => nav.navigate('Navegacao')}
            />
          ) : null}
          <Botao
            titulo={faltam.length > 1 ? 'Melhorar rota (otimizar ordem)' : 'Traçar caminho'}
            variante={trajeto ? 'contorno' : 'primario'}
            cor={trajeto ? t.rota : undefined}
            carregando={ocupado === 'otimizar'}
            desabilitado={!r.mapboxDisponivel || ocupado !== null}
            aoPressionar={() => executar('otimizar', r.otimizar)}
          />
          {faltam.length > 1 ? (
            <Botao
              titulo="Traçar na ordem da lista"
              variante="texto"
              cor={t.rota}
              carregando={ocupado === 'tracar'}
              desabilitado={!r.mapboxDisponivel || ocupado !== null}
              aoPressionar={() => executar('tracar', r.tracar)}
            />
          ) : null}
        </View>
      ) : null}

      {r.rota.paradas.length > 0 ? (
        <Botao
          titulo="Limpar rota"
          variante="texto"
          cor={t.perigo}
          aoPressionar={async () => {
            if (
              await confirmar(
                'Limpar a rota?',
                'Todas as paradas serão removidas.',
                'Limpar',
              )
            ) {
              r.limpar();
            }
          }}
        />
      ) : null}
    </Tela>
  );
}

function Busca() {
  const t = useTema();
  const j = useJornada();
  const r = useRota();
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<Lugar[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Busca com atraso, para não chamar o Mapbox a cada letra.
  useEffect(() => {
    const q = texto.trim();
    if (q.length < 3 || !r.mapboxDisponivel) return;
    let cancelado = false;
    const id = setTimeout(async () => {
      setBuscando(true);
      setErro(null);
      try {
        const lista = await buscarLugares(q, j.posicao);
        if (!cancelado) setResultados(lista);
      } catch (e) {
        if (!cancelado) {
          setErro(e instanceof Error ? e.message : 'Falha na busca.');
        }
      } finally {
        if (!cancelado) setBuscando(false);
      }
    }, 450);
    return () => {
      cancelado = true;
      clearTimeout(id);
    };
  }, [texto, j.posicao, r.mapboxDisponivel]);

  const curto = texto.trim().length < 3;

  return (
    <View style={{ gap: espaco.s }}>
      <Campo
        rotulo="Adicionar parada"
        placeholder="Cliente, endereço ou lugar"
        value={texto}
        onChangeText={setTexto}
        editable={r.mapboxDisponivel}
        returnKeyType="search"
      />
      {buscando ? <ActivityIndicator color={t.marca} /> : null}
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
      {!curto && resultados.length > 0 ? (
        <Cartao estilo={{ gap: 0, paddingVertical: espaco.xs }}>
          {resultados.map((l) => (
            <Pressable
              key={l.id}
              accessibilityRole="button"
              accessibilityLabel={`Adicionar ${l.nome}`}
              onPress={() => {
                r.adicionar(l);
                setTexto('');
                setResultados([]);
              }}
              style={({ pressed }) => [
                estilos.resultado,
                pressed && { backgroundColor: t.superficieAlta },
              ]}
            >
              <Ionicons name="add-circle" size={22} color={t.marca} />
              <View style={{ flex: 1 }}>
                <Texto forte>{l.nome}</Texto>
                <Texto suave tamanho={12}>
                  {l.endereco}
                </Texto>
              </View>
            </Pressable>
          ))}
        </Cartao>
      ) : null}
      {!curto && !buscando && resultados.length === 0 && !erro && r.mapboxDisponivel ? (
        <Texto suave tamanho={13}>
          Nenhum lugar encontrado.
        </Texto>
      ) : null}
      {j.posicao ? (
        <Botao
          titulo="Adicionar minha localização atual"
          variante="texto"
          aoPressionar={() =>
            void r.adicionarAqui(texto || 'Local marcado').then(() => setTexto(''))
          }
        />
      ) : null}
    </View>
  );
}

function Icone({
  nome,
  rotulo,
  aoPressionar,
  desabilitado,
}: {
  nome: keyof typeof Ionicons.glyphMap;
  rotulo: string;
  aoPressionar: () => void;
  desabilitado?: boolean;
}) {
  const t = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      disabled={desabilitado}
      onPress={aoPressionar}
      hitSlop={6}
      style={({ pressed }) => [
        estilos.icone,
        { opacity: desabilitado ? 0.3 : pressed ? 0.6 : 1 },
      ]}
    >
      <Ionicons name={nome} size={20} color={t.textoSuave} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  mapa: {
    height: 260,
    borderRadius: raio.l,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: espaco.s,
  },
  parada: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.s,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: espaco.s,
  },
  numero: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acoes: { flexDirection: 'row' },
  icone: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    paddingVertical: espaco.s,
    paddingHorizontal: espaco.xs,
    borderRadius: raio.s,
  },
});
