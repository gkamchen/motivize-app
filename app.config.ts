import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Configuração do app. Valores sensíveis vêm do ambiente (.env),
 * nunca ficam no código. Veja .env.exemplo.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Motivize',
  slug: 'motivize',
  version: '2.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'br.com.motivize.app',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'O Motivize usa sua localização para registrar o percurso do dia e o local de cada atendimento.',
    },
  },
  android: {
    package: 'br.com.motivize.app',
    adaptiveIcon: {
      backgroundColor: '#FFFFFF',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
    predictiveBackGestureEnabled: false,
    config: process.env.GOOGLE_MAPS_API_KEY
      ? { googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY } }
      : undefined,
  },
  web: {
    favicon: './assets/favicon.png',
    name: 'Motivize',
  },
  plugins: [
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'O Motivize usa sua localização para registrar o percurso do dia e o local de cada atendimento.',
      },
    ],
  ],
});
