import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import type { ReactNode } from 'react';
import { useTema } from './tema';

export interface Fatia {
  valor: number;
  cor: string;
}

/** Gráfico de rosca simples, com um conteúdo livre no centro. */
export function GraficoRosca({
  fatias,
  tamanho = 200,
  espessura = 22,
  centro,
}: {
  fatias: Fatia[];
  tamanho?: number;
  espessura?: number;
  centro?: ReactNode;
}) {
  const t = useTema();
  const raio = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const total = fatias.reduce((a, f) => a + f.valor, 0);
  const visiveis = fatias.filter((f) => f.valor > 0);
  // Pequena folga entre fatias para separá-las visualmente.
  const folga = visiveis.length > 1 ? 3 : 0;

  let acumulado = 0;
  return (
    <View
      style={{ width: tamanho, height: tamanho, alignSelf: 'center' }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={tamanho} height={tamanho}>
        <G>
          <Circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={raio}
            stroke={t.superficieAlta}
            strokeWidth={espessura}
            fill="none"
          />
          {total > 0 &&
            visiveis.map((f, i) => {
              const comprimento = (f.valor / total) * circunferencia;
              const traco = Math.max(0, comprimento - folga);
              // O traço do círculo começa às 3 h; somar 1/4 da volta faz a
              // primeira fatia começar às 12 h (sem rotacionar o SVG, que
              // gera aviso na web). O padrão tem período igual à volta,
              // então a fatia "dá a volta" corretamente.
              const deslocamento = circunferencia / 4 - acumulado;
              acumulado += comprimento;
              return (
                <Circle
                  key={i}
                  cx={tamanho / 2}
                  cy={tamanho / 2}
                  r={raio}
                  stroke={f.cor}
                  strokeWidth={espessura}
                  strokeDasharray={`${traco} ${circunferencia - traco}`}
                  strokeDashoffset={deslocamento}
                  fill="none"
                />
              );
            })}
        </G>
      </Svg>
      {centro ? (
        <View
          style={{
            position: 'absolute',
            inset: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {centro}
        </View>
      ) : null}
    </View>
  );
}
