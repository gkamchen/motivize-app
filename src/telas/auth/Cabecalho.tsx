import { Image, View } from 'react-native';
import { Texto } from '../../ui/componentes';
import { espaco, useTema } from '../../ui/tema';

export function Cabecalho({ subtitulo }: { subtitulo: string }) {
  const t = useTema();
  return (
    <View style={{ alignItems: 'center', gap: espaco.s, marginTop: espaco.xl }}>
      <Image
        source={require('../../../assets/icon.png')}
        style={{ width: 88, height: 88, borderRadius: 22 }}
        accessibilityIgnoresInvertColors
      />
      <Texto forte tamanho={30} cor={t.marca}>
        Motivize
      </Texto>
      <Texto suave centro>
        {subtitulo}
      </Texto>
    </View>
  );
}
