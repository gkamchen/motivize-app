import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { espaco, raio, useTema } from './tema';

export function Tela({
  children,
  rolar = true,
  bordas = ['top'],
}: {
  children: ReactNode;
  rolar?: boolean;
  bordas?: ('top' | 'bottom')[];
}) {
  const t = useTema();
  return (
    <SafeAreaView
      edges={bordas}
      style={{ flex: 1, backgroundColor: t.fundo }}
    >
      {rolar ? (
        <ScrollView
          contentContainerStyle={estilos.conteudo}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

export function Titulo({ children }: { children: ReactNode }) {
  const t = useTema();
  return (
    <Text style={[estilos.titulo, { color: t.texto }]} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function Texto({
  children,
  suave,
  forte,
  tamanho = 15,
  cor,
  centro,
}: {
  children: ReactNode;
  suave?: boolean;
  forte?: boolean;
  tamanho?: number;
  cor?: string;
  centro?: boolean;
}) {
  const t = useTema();
  return (
    <Text
      style={{
        color: cor ?? (suave ? t.textoSuave : t.texto),
        fontSize: tamanho,
        fontWeight: forte ? '700' : '400',
        textAlign: centro ? 'center' : undefined,
        lineHeight: Math.round(tamanho * 1.4),
      }}
    >
      {children}
    </Text>
  );
}

export function Cartao({
  children,
  estilo,
}: {
  children: ReactNode;
  estilo?: StyleProp<ViewStyle>;
}) {
  const t = useTema();
  return (
    <View
      style={[
        estilos.cartao,
        { backgroundColor: t.superficie, borderColor: t.borda },
        estilo,
      ]}
    >
      {children}
    </View>
  );
}

type Variante = 'primario' | 'contorno' | 'perigo' | 'texto';

export function Botao({
  titulo,
  aoPressionar,
  variante = 'primario',
  desabilitado,
  carregando,
  cor,
}: {
  titulo: string;
  aoPressionar: () => void;
  variante?: Variante;
  desabilitado?: boolean;
  carregando?: boolean;
  /** Cor de destaque (substitui a cor da marca). */
  cor?: string;
}) {
  const t = useTema();
  const destaque = cor ?? (variante === 'perigo' ? t.perigo : t.marca);
  const cheio = variante === 'primario' || variante === 'perigo';
  const inativo = desabilitado || carregando;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo, busy: carregando }}
      disabled={inativo}
      onPress={aoPressionar}
      style={({ pressed }) => [
        estilos.botao,
        variante === 'texto' && estilos.botaoTexto,
        cheio && { backgroundColor: destaque },
        variante === 'contorno' && {
          borderColor: destaque,
          borderWidth: 2,
        },
        inativo && { opacity: 0.45 },
        pressed && { opacity: 0.8 },
      ]}
    >
      {carregando ? (
        <ActivityIndicator
          color={cheio ? (t.escuro ? '#141111' : '#FFFFFF') : destaque}
        />
      ) : (
        <Text
          style={[
            estilos.botaoRotulo,
            {
              // No tema escuro as cores de destaque são claras: texto escuro.
              color: cheio
                ? cor
                  ? t.escuro
                    ? '#141111'
                    : '#FFFFFF'
                  : t.marcaTexto
                : destaque,
            },
            variante === 'texto' && { fontSize: 15, fontWeight: '600' },
          ]}
        >
          {titulo}
        </Text>
      )}
    </Pressable>
  );
}

export function Campo({
  rotulo,
  erro,
  ...props
}: TextInputProps & { rotulo: string; erro?: string }) {
  const t = useTema();
  return (
    <View style={{ gap: espaco.xs }}>
      <Text style={{ color: t.textoSuave, fontSize: 13, fontWeight: '600' }}>
        {rotulo}
      </Text>
      <TextInput
        placeholderTextColor={t.textoSuave}
        accessibilityLabel={rotulo}
        {...props}
        style={[
          estilos.campo,
          {
            color: t.texto,
            backgroundColor: t.superficie,
            borderColor: erro ? t.perigo : t.borda,
          },
        ]}
      />
      {erro ? (
        <Text style={{ color: t.perigo, fontSize: 13 }}>{erro}</Text>
      ) : null}
    </View>
  );
}

export function Aviso({
  children,
  tipo = 'info',
}: {
  children: ReactNode;
  tipo?: 'info' | 'erro' | 'sucesso';
}) {
  const t = useTema();
  const cor =
    tipo === 'erro' ? t.perigo : tipo === 'sucesso' ? t.sucesso : t.textoSuave;
  return (
    <View
      accessibilityRole="alert"
      style={[estilos.aviso, { borderColor: cor, backgroundColor: t.superficieAlta }]}
    >
      <Text style={{ color: tipo === 'info' ? t.texto : cor, fontSize: 14 }}>
        {children}
      </Text>
    </View>
  );
}

export function Pilula({ cor, texto }: { cor: string; texto: string }) {
  return (
    <View style={[estilos.pilula, { borderColor: cor }]}>
      <View style={[estilos.ponto, { backgroundColor: cor }]} />
      <Text style={{ color: cor, fontSize: 13, fontWeight: '700' }}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  conteudo: {
    padding: espaco.l,
    gap: espaco.l,
    paddingBottom: espaco.xxl,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  titulo: { fontSize: 26, fontWeight: '800' },
  cartao: {
    borderRadius: raio.l,
    borderWidth: StyleSheet.hairlineWidth,
    padding: espaco.l,
    gap: espaco.m,
  },
  botao: {
    minHeight: 54,
    borderRadius: raio.m,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espaco.l,
  },
  botaoTexto: { minHeight: 44 },
  botaoRotulo: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  campo: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: raio.m,
    paddingHorizontal: espaco.m,
    fontSize: 16,
  },
  aviso: {
    borderLeftWidth: 4,
    borderRadius: raio.s,
    padding: espaco.m,
  },
  pilula: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  ponto: { width: 8, height: 8, borderRadius: 4 },
});
