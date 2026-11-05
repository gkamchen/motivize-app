import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useJornada } from '../estado/JornadaContext';
import { useSessao } from '../estado/SessaoContext';
import { CadastroTela } from '../telas/auth/CadastroTela';
import { EntrarTela } from '../telas/auth/EntrarTela';
import { RecuperarSenhaTela } from '../telas/auth/RecuperarSenhaTela';
import { DetalheJornadaTela } from '../telas/DetalheJornadaTela';
import { HistoricoTela } from '../telas/HistoricoTela';
import { JornadaTela } from '../telas/JornadaTela';
import { MapaTela } from '../telas/MapaTela';
import { NavegacaoTela } from '../telas/NavegacaoTela';
import { PerfilTela } from '../telas/PerfilTela';
import { RotaTela } from '../telas/RotaTela';
import { useTema } from '../ui/tema';
import type { RotasAbas, RotasApp, RotasAuth } from './rotas';

const PilhaAuth = createNativeStackNavigator<RotasAuth>();
const PilhaApp = createNativeStackNavigator<RotasApp>();
const Abas = createBottomTabNavigator<RotasAbas>();

type NomeIcone = keyof typeof Ionicons.glyphMap;
const ICONES: Record<keyof RotasAbas, [NomeIcone, NomeIcone]> = {
  Jornada: ['timer', 'timer-outline'],
  Rota: ['git-branch', 'git-branch-outline'],
  Mapa: ['map', 'map-outline'],
  Historico: ['calendar', 'calendar-outline'],
  Perfil: ['person-circle', 'person-circle-outline'],
};

function AbasPrincipais() {
  const t = useTema();
  const { status } = useJornada();
  return (
    <Abas.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: t.marca,
        tabBarInactiveTintColor: t.textoSuave,
        tabBarStyle: { backgroundColor: t.superficie, borderTopColor: t.borda },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={ICONES[route.name][focused ? 0 : 1]}
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Abas.Screen
        name="Jornada"
        component={JornadaTela}
        options={{
          title: 'Jornada',
          // Um ponto na aba lembra que o dia está em andamento.
          tabBarBadge: status !== 'parado' ? '' : undefined,
          tabBarBadgeStyle: {
            backgroundColor: status === 'parado' ? undefined : t.trecho[status],
            minWidth: 10,
            maxHeight: 10,
            borderRadius: 5,
          },
        }}
      />
      <Abas.Screen name="Rota" component={RotaTela} options={{ title: 'Rota' }} />
      <Abas.Screen name="Mapa" component={MapaTela} options={{ title: 'Mapa' }} />
      <Abas.Screen
        name="Historico"
        component={HistoricoTela}
        options={{ title: 'Histórico' }}
      />
      <Abas.Screen name="Perfil" component={PerfilTela} options={{ title: 'Perfil' }} />
    </Abas.Navigator>
  );
}

export function Navegacao() {
  const t = useTema();
  const { carregando, sessao } = useSessao();
  const { carregando: carregandoJornada } = useJornada();

  const base = t.escuro ? DarkTheme : DefaultTheme;
  const tema: Theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: t.marca,
      background: t.fundo,
      card: t.superficie,
      text: t.texto,
      border: t.borda,
    },
  };

  if (carregando || carregandoJornada) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.fundo,
        }}
      >
        <ActivityIndicator color={t.marca} size="large" />
      </View>
    );
  }

  const cabecalho = {
    headerStyle: { backgroundColor: t.superficie },
    headerTintColor: t.texto,
    headerBackButtonDisplayMode: 'minimal' as const,
  };

  return (
    <NavigationContainer
      theme={tema}
      documentTitle={{ formatter: (o, r) => `${o?.title ?? r?.name ?? ''} · Motivize` }}
    >
      {/* Fluxo de autenticação por estado: sem sessão não existe a área
          logada, então o "voltar" nunca leva para o login. */}
      {sessao ? (
        <PilhaApp.Navigator screenOptions={cabecalho}>
          <PilhaApp.Screen
            name="Abas"
            component={AbasPrincipais}
            options={{ headerShown: false }}
          />
          <PilhaApp.Screen
            name="DetalheJornada"
            component={DetalheJornadaTela}
            options={{ title: 'Detalhe do dia' }}
          />
          <PilhaApp.Screen
            name="Navegacao"
            component={NavegacaoTela}
            options={{ headerShown: false, title: 'Navegação' }}
          />
        </PilhaApp.Navigator>
      ) : (
        <PilhaAuth.Navigator screenOptions={cabecalho}>
          <PilhaAuth.Screen
            name="Entrar"
            component={EntrarTela}
            options={{ headerShown: false, title: 'Entrar' }}
          />
          <PilhaAuth.Screen
            name="Cadastro"
            component={CadastroTela}
            options={{ title: 'Criar conta' }}
          />
          <PilhaAuth.Screen
            name="RecuperarSenha"
            component={RecuperarSenhaTela}
            options={{ title: 'Recuperar senha' }}
          />
        </PilhaAuth.Navigator>
      )}
    </NavigationContainer>
  );
}
