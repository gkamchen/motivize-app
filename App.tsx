import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { JornadaProvider } from './src/estado/JornadaContext';
import { RotaProvider } from './src/estado/RotaContext';
import { SessaoProvider } from './src/estado/SessaoContext';
import { Navegacao } from './src/navegacao/Navegacao';

export default function App() {
  return (
    <SafeAreaProvider>
      <SessaoProvider>
        <JornadaProvider>
          <RotaProvider>
            <Navegacao />
            <StatusBar style="auto" />
          </RotaProvider>
        </JornadaProvider>
      </SessaoProvider>
    </SafeAreaProvider>
  );
}
