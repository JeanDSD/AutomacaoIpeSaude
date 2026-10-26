# Impostor 🕵️

Jogo de festa para celular (React Native + Expo + TypeScript): todos recebem a mesma palavra secreta, menos o(s) impostor(es). Passe o celular de mão em mão, revele seu papel, dê dicas e descubra quem está blefando.

## Funcionalidades

- **Jogadores ilimitados**, com **arrastar e soltar** para reordenar a roda (alça ≡ ou toque longo), renomear, embaralhar e placar. Tudo salvo no aparelho (AsyncStorage).
- **Impostores configuráveis** por rodada (com limites para manter o jogo equilibrado).
- **35 temas** embutidos com **5.200+ palavras** (Animais, Profissões, Filmes, Comidas, Países, Marcas, Personagens, Videogames, Futebol…).
- **Importação de temas**: digite o nome e cole a lista (vírgula, ponto e vírgula ou uma por linha). Duplicadas são removidas; repetir o nome soma palavras ao tema existente.
- **Histórico sem repetição**: toda palavra sorteada é registrada por tema e não volta mais, até você liberá-la na tela *Histórico* (palavra a palavra ou o tema inteiro).
- **22 modos de jogo**: Clássico, Quem da Roda, Impostor com Dica, Infiltrado, Impostores Cegos, Mímica, Pergunta e Resposta, Relâmpago, Primeira Letra, Conta Letras, Lista de Suspeitas, Vidente, Cúmplice, Bobo da Corte, Caos Total, Tema Oculto, Sábio Solitário, Desenho Coletivo, História em Cadeia, Só Sons, Contra o Relógio e Mestre do Jogo.
- **UI escura** com arte vetorial (SVG), ícones, fonte Poppins, transições e animações com **Reanimated** (cartão 3D, passagem de celular, cronômetro, confete).
- **Áudio** com `expo-audio` (sucessor oficial do `expo-av`, que foi descontinuado e não tem versão para o SDK 58): clique, revelação, suspense do impostor, vitória, derrota, whoosh, tique e alarme. Os sons são sintetizados por `scripts/gen-sounds.py`.
- Vibração (expo-haptics), cronômetro de discussão, "última chance" do impostor e placar.

## Estrutura

```
src/
  App.tsx                 # fontes, hidratação da store, navegação
  navigation/Navigator.tsx# pilha de telas com transições Reanimated
  screens/                # Home, Players, Setup, Modes, Themes, Import, History, Reveal, Discussion, Result…
  components/             # Button, FlipCard, DraggableList, TimerRing, Logo (SVG), Confetti…
  logic/                  # roundBuilder (papéis por modo), wordPicker (sorteio sem repetição), startRound
  data/                   # gameModes, themes/*, questions
  store/useAppStore.ts    # Zustand + persistência em AsyncStorage
  audio/sounds.ts         # efeitos sonoros (expo-audio)
assets/sounds/            # WAVs gerados
plugins/withNdkVersion.js # config plugin opcional para fixar o NDK
```

## Rodando

```bash
npm install
npm run typecheck
npm run check:logic       # testa sorteio, parser e os 22 modos
npx expo run:android      # build de desenvolvimento num aparelho/emulador
```

## Gerando o APK

**Gradle local** (precisa de Android SDK, JDK 17 e acesso ao Google Maven):

```bash
npm run build:apk:gradle  # gera ./impostor.apk
```

Se a máquina só tiver uma versão específica do NDK, exporte `IMPOSTOR_NDK_VERSION=<versão>` antes do prebuild.

**EAS local** (perfil `preview` em `eas.json` gera APK em vez de AAB; exige login no Expo):

```bash
npx eas-cli@latest build --platform android --local --profile preview --output ./impostor.apk
```

**GitHub Actions**: o workflow `.github/workflows/android-apk.yml` compila o APK a cada push que altere `impostor/`, publica como artefato `impostor-apk` e salva `impostor/impostor.apk` na própria branch.

O APK de release é assinado com a keystore de debug, para instalar direto no celular. Para publicar na Play Store, gere uma keystore própria.
