import * as Location from 'expo-location';
import type { Ponto } from '../domain/jornada';

export type PermissaoLocal = 'pendente' | 'concedida' | 'negada';

function paraPonto(p: Location.LocationObject): Ponto {
  return {
    latitude: p.coords.latitude,
    longitude: p.coords.longitude,
    precisao: p.coords.accuracy ?? undefined,
    em: p.timestamp,
  };
}

export async function pedirPermissao(): Promise<PermissaoLocal> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted' ? 'concedida' : 'negada';
  } catch {
    return 'negada';
  }
}

/** Lê a posição atual; devolve undefined se o GPS não responder a tempo. */
export async function posicaoAtual(
  limiteMs = 8000,
): Promise<Ponto | undefined> {
  const leitura = Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  })
    .then(paraPonto)
    .catch(() => undefined);
  const tempoEsgotado = new Promise<undefined>((r) =>
    setTimeout(() => r(undefined), limiteMs),
  );
  return Promise.race([leitura, tempoEsgotado]);
}

/** Acompanha a posição enquanto o app está aberto. Devolve o "parar". */
export async function acompanhar(
  aoMover: (p: Ponto) => void,
): Promise<() => void> {
  const assinatura = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      distanceInterval: 10,
      timeInterval: 10_000,
    },
    (p) => aoMover(paraPonto(p)),
  );
  return () => assinatura.remove();
}
