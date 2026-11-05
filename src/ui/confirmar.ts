import { Alert, Platform } from 'react-native';

/** Pergunta sim/não que funciona no celular e na web. */
export function confirmar(
  titulo: string,
  mensagem: string,
  textoConfirmar = 'Confirmar',
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${titulo}\n\n${mensagem}`));
  }
  return new Promise((resolver) =>
    Alert.alert(titulo, mensagem, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolver(false) },
      { text: textoConfirmar, style: 'destructive', onPress: () => resolver(true) },
    ]),
  );
}
