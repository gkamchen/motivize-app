# Motivize

Controle de jornada para quem trabalha em campo: deslocamento,
atendimentos, intervalos, o percurso do dia no mapa e o planejamento da
rota com navegação passo a passo, tudo via Mapbox.

Funciona no **iPhone e no Android pelo Expo Go** (sem precisar de Mac nem
de build) e também no navegador.

## O que o app faz

| Área | O que tem |
|---|---|
| **Jornada** | Iniciar/finalizar dia, atendimento (com cliente e observação) e intervalo. Cronômetro ao vivo, gráfico de rosca e percentuais por tipo. |
| **Rota** | Busca de clientes e endereços (Mapbox Search), lista de paradas, **melhorar rota** (Mapbox Optimization: melhor ordem) e **traçar** o caminho pelas ruas (Mapbox Directions), com distância e tempo. |
| **Navegação** | Próxima manobra em português, distância até ela, tempo restante e horário de chegada, voz (liga/desliga), **recálculo automático** ao sair da rota e botão **Cheguei** que já inicia o atendimento com o nome da parada. |
| **Mapa** | Percurso do dia registrado pelo GPS, atendimentos e intervalos marcados no local onde aconteceram. |
| **Histórico** | Dias encerrados com totais, km rodados, mapa e linha do tempo. |
| **Perfil** | Nome, conta, envio de pendentes ao servidor e sair. |

Detalhes que importam:

- Os tempos vêm do horário de início e fim de cada trecho, então fechar o
  app ou recarregar a página não perde nada.
- O GPS descarta leituras imprecisas, oscilações de quem está parado e
  saltos impossíveis (acima de ~200 km/h).
- Sem localização liberada, os tempos continuam sendo contados. O app tenta
  de novo quando você volta para ele.
- Tema claro e escuro automáticos.

## Como rodar

Pré-requisitos: Node 20 ou mais novo.

```bash
npm install
cp .env.exemplo .env   # e preencha (veja abaixo)
npm start
```

- **iPhone:** instale o *Expo Go* pela App Store e aponte a câmera para o
  QR code que aparece no terminal.
- **Android:** instale o *Expo Go* pela Play Store e escaneie o QR code
  pelo próprio app.
- **Navegador:** `npm run web`.

O celular e o computador precisam estar na mesma rede Wi-Fi. Se a rede
bloquear, use `npx expo start --tunnel`.

## Configuração (`.env`)

O arquivo `.env` não vai para o git. Modelo em `.env.exemplo`.

| Variável | Para quê | Obrigatória? |
|---|---|---|
| `EXPO_PUBLIC_MAPBOX_TOKEN` | Mapas, busca, rota e navegação | Para rota/navegação, sim |
| `EXPO_PUBLIC_PARSE_APP_ID` / `EXPO_PUBLIC_PARSE_CLIENT_KEY` | Login e envio das jornadas para um servidor Parse (ex.: Back4App) | Não |
| `EXPO_PUBLIC_PARSE_SERVER_URL` | Endereço do Parse (padrão: Back4App) | Não |
| `GOOGLE_MAPS_API_KEY` | Só para gerar o build Android de loja | Não |

### Mapbox

1. Crie um token público (`pk.…`) em
   <https://account.mapbox.com/access-tokens/>, com os escopos padrão.
2. Restrinja o token pelas URLs/apps que vão usá-lo.
3. Coloque-o em `EXPO_PUBLIC_MAPBOX_TOKEN` e reinicie o `npm start`.

Sem token, ou com token recusado pelo Mapbox, os mapas usam o
OpenStreetMap e a aba Rota avisa que precisa do token.

Serviços usados: Static Tiles (estilos *Streets* e *Dark*), Search
Geocoding v6, Optimization v1 (até 11 paradas por otimização) e
Directions v5 (até 24 paradas por traçado).

### Servidor (opcional)

Sem as variáveis do Parse o app roda em **modo local**: pede só o nome e
guarda tudo no aparelho. Com elas, há cadastro, login, recuperação de
senha, e cada dia encerrado é enviado para a classe `Jornada`, com ACL só
do próprio usuário. Se estiver sem internet, o envio fica pendente e é
refeito depois.

No Back4App, use a **Client key** (nunca a Master key) e restrinja as
permissões da classe `Jornada` (CLP) para usuários autenticados.

## Desenvolvimento

```bash
npm test           # testes (regras de jornada, tempo, percurso, rota e navegação)
npm run typecheck  # TypeScript
npm run lint       # ESLint
```

Estrutura:

```
src/
  domain/      regras puras: jornada, tempos, percurso, rota e navegação
  estado/      contextos React: sessão, jornada (GPS), rota
  mapbox/      cliente das APIs do Mapbox
  mapa/        mapa do celular (react-native-maps) e da web (Leaflet)
  servidor/    integração opcional com Parse/Back4App
  storage/     persistência local (AsyncStorage)
  telas/       telas do app
  navegacao/   rotas tipadas (React Navigation 7)
  ui/          tema, componentes e gráfico
```

## Limitações conhecidas

- O GPS acompanha o percurso com o app **aberto**. Rastreamento em segundo
  plano exige um build próprio (*development build*), não o Expo Go.
- A navegação guiada usa o Mapbox Directions dentro do app. O SDK nativo
  de navegação do Mapbox (mapa 3D, faixas) também exige build próprio.

## Histórico

A versão 1 (2021, React Native 0.61 + UI Kitten) está preservada na tag
`v1-legado`. A versão 2 foi reescrita do zero em Expo, reaproveitando a
ideia, o fluxo de trabalho e a estrutura de rotas tipadas.
