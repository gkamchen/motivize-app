/**
 * Mapa no celular (Android/iOS) usando react-native-maps com os estilos
 * do Mapbox por cima (ver estilo.ts). Funciona no Expo Go.
 * Sem token do Mapbox, usa o mapa nativo (Apple Maps / Google Maps).
 * Na web, o Metro usa MapaPercurso.web.tsx no lugar deste arquivo.
 */
import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { useTema } from '../ui/tema';
import { useFonteMapa } from './estilo';
import { corDoMarcador, type PropsMapa } from './tipos';

const DELTA_PADRAO = 0.01;

/** Converte nível de zoom (estilo web) em "delta" de região. */
const deltaDoZoom = (zoom: number) => 360 / 2 ** zoom;

export function MapaPercurso({
  percurso,
  marcadores,
  posicao,
  trajeto,
  seguirPosicao,
  zoomSeguir = 16,
}: PropsMapa) {
  const t = useTema();
  const mapa = useRef<MapView>(null);
  const fonte = useFonteMapa(t.escuro);
  const usaMapbox = fonte.mapbox;

  const pontos = [
    ...percurso,
    ...(trajeto ?? []),
    ...marcadores.map((m) => m.ponto),
    ...(posicao ? [posicao] : []),
  ];

  useEffect(() => {
    if (!mapa.current) return;
    if (seguirPosicao && posicao) {
      mapa.current.animateToRegion(
        {
          latitude: posicao.latitude,
          longitude: posicao.longitude,
          latitudeDelta: deltaDoZoom(zoomSeguir),
          longitudeDelta: deltaDoZoom(zoomSeguir),
        },
        400,
      );
      return;
    }
    if (pontos.length > 1) {
      mapa.current.fitToCoordinates(pontos, {
        edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
        animated: true,
      });
    }
    // Reenquadra quando a quantidade de pontos muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pontos.length, seguirPosicao, seguirPosicao ? posicao?.em : 0]);

  const inicial = pontos[0] ?? posicao;

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={mapa}
        style={StyleSheet.absoluteFill}
        showsUserLocation
        showsMyLocationButton
        // No Android, esconde o Google Maps por baixo das camadas do Mapbox.
        mapType={usaMapbox && Platform.OS === 'android' ? 'none' : 'standard'}
        userInterfaceStyle={t.escuro ? 'dark' : 'light'}
        initialRegion={
          inicial
            ? {
                latitude: inicial.latitude,
                longitude: inicial.longitude,
                latitudeDelta: DELTA_PADRAO,
                longitudeDelta: DELTA_PADRAO,
              }
            : undefined
        }
      >
        {usaMapbox ? (
          <UrlTile
            key={fonte.url}
            urlTemplate={fonte.url}
            maximumZ={fonte.zoomMaximo}
            tileSize={256}
            shouldReplaceMapContent
            zIndex={-1}
          />
        ) : null}
        {trajeto && trajeto.length > 1 ? (
          <Polyline
            coordinates={trajeto}
            strokeColor={t.rota}
            strokeWidth={7}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}
        {percurso.length > 1 ? (
          <Polyline
            coordinates={percurso}
            strokeColor={t.trecho.deslocamento}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}
        {marcadores.map((m) => (
          <Marker
            key={m.id}
            coordinate={m.ponto}
            title={m.titulo}
            description={m.descricao}
          >
            <View
              style={[
                estilos.pino,
                {
                  backgroundColor: corDoMarcador(t, m.tipo),
                  borderColor: '#FFFFFF',
                },
              ]}
            >
              <Text style={estilos.rotulo}>{m.rotulo ?? ''}</Text>
            </View>
          </Marker>
        ))}
      </MapView>
      {usaMapbox ? (
        <View style={estilos.atribuicao} pointerEvents="none">
          <Text style={estilos.atribuicaoTexto}>{fonte.atribuicao}</Text>
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  pino: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  rotulo: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  atribuicao: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  atribuicaoTexto: { fontSize: 10, color: '#333333' },
});
