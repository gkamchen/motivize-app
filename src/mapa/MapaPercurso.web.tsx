/**
 * Mapa na web usando Leaflet com os estilos do Mapbox (ver estilo.ts).
 * No celular, o Metro usa MapaPercurso.tsx (react-native-maps).
 */
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import { useTema } from '../ui/tema';
import { useFonteMapa } from './estilo';
import { corDoMarcador, type PropsMapa } from './tipos';

type LatLng = [number, number];

/** Ajusta o enquadramento quando os pontos mudam. */
function Enquadrar({
  pontos,
  centro,
  zoom,
}: {
  pontos: LatLng[];
  centro?: LatLng;
  zoom: number;
}) {
  const mapa = useMap();
  const chave = pontos.length + (centro ? centro.join(',') : '');
  useEffect(() => {
    if (centro) {
      mapa.setView(centro, Math.max(mapa.getZoom(), zoom), { animate: true });
    } else if (pontos.length > 1) {
      mapa.fitBounds(L.latLngBounds(pontos), { padding: [40, 40] });
    } else if (pontos.length === 1) {
      mapa.setView(pontos[0], 16);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);
  return null;
}

function icone(cor: string, borda: string, rotulo: string) {
  return L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="width:30px;height:30px;border-radius:15px;background:${cor};
      border:3px solid ${borda};box-sizing:border-box;display:flex;
      align-items:center;justify-content:center;color:#fff;font:800 12px system-ui;
      box-shadow:0 1px 4px rgba(0,0,0,.35)">${rotulo}</div>`,
  });
}

// Centro inicial quando ainda não há nenhum ponto (Brasil).
const CENTRO_PADRAO: LatLng = [-15.78, -47.93];

export function MapaPercurso({
  percurso,
  marcadores,
  posicao,
  trajeto,
  seguirPosicao,
  zoomSeguir = 16,
}: PropsMapa) {
  const t = useTema();
  const fonte = useFonteMapa(t.escuro);
  const trilha = useMemo<LatLng[]>(
    () => percurso.map((p) => [p.latitude, p.longitude]),
    [percurso],
  );
  const caminho = useMemo<LatLng[]>(
    () => (trajeto ?? []).map((p) => [p.latitude, p.longitude]),
    [trajeto],
  );
  const todos: LatLng[] = [
    ...trilha,
    ...caminho,
    ...marcadores.map((m): LatLng => [m.ponto.latitude, m.ponto.longitude]),
    ...(posicao ? [[posicao.latitude, posicao.longitude] as LatLng] : []),
  ];
  const aqui: LatLng | undefined = posicao
    ? [posicao.latitude, posicao.longitude]
    : undefined;

  return (
    <View style={{ flex: 1 }}>
      <MapContainer
        center={todos[0] ?? CENTRO_PADRAO}
        zoom={todos.length ? 15 : 4}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          // A chave força trocar a camada quando o tema muda.
          key={fonte.url}
          attribution={fonte.atribuicaoHtml}
          url={fonte.url}
          maxZoom={fonte.zoomMaximo}
        />
        {caminho.length > 1 ? (
          <Polyline
            positions={caminho}
            pathOptions={{ color: t.rota, weight: 7, opacity: 0.9 }}
          />
        ) : null}
        {trilha.length > 1 ? (
          <Polyline
            positions={trilha}
            pathOptions={{ color: t.trecho.deslocamento, weight: 4 }}
          />
        ) : null}
        {marcadores.map((m) => (
          <Marker
            key={m.id}
            position={[m.ponto.latitude, m.ponto.longitude]}
            icon={icone(corDoMarcador(t, m.tipo), '#FFFFFF', m.rotulo ?? '')}
          >
            <Popup>
              <strong>{m.titulo}</strong>
              {m.descricao ? <div>{m.descricao}</div> : null}
            </Popup>
          </Marker>
        ))}
        {aqui ? (
          <CircleMarker
            center={aqui}
            radius={8}
            pathOptions={{
              color: '#FFFFFF',
              weight: 3,
              fillColor: '#2563EB',
              fillOpacity: 1,
            }}
          />
        ) : null}
        <Enquadrar
          pontos={todos}
          centro={seguirPosicao ? aqui : undefined}
          zoom={zoomSeguir}
        />
      </MapContainer>
    </View>
  );
}
