# Tech Stack

## Core

- **Framework:** Expo SDK 57 with Expo Router (file-based routing)
- **Language:** TypeScript 6 (strict mode)
- **UI:** React 19, React Native 0.86, react-native-web 0.21
- **Animations:** react-native-reanimated 4.5, react-native-worklets
- **Navigation:** expo-router (Stack-based), react-native-screens
- **Styling:** React Native StyleSheet API
- **Image handling:** expo-image

## Experiments Enabled

- Typed routes (`experiments.typedRoutes`)
- React Compiler (`experiments.reactCompiler`)

## Python (utility)

- Python 3.13+ managed via `pyproject.toml` and `.python-version`
- No Python dependencies currently listed

## Path Aliases

Defined in `tsconfig.json`:
- `@/*` → `./src/*`
- `@/assets/*` → `./assets/*`

## Common Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npx expo start` | Start dev server (Metro) |
| `npx expo start --ios` | Start on iOS simulator |
| `npx expo start --android` | Start on Android emulator |
| `npx expo start --web` | Start web version |
| `npx expo lint` | Run ESLint |
| `npm run reset-project` | Move starter code to example dir, create blank app |

## Build & Deploy

- Uses EAS (Expo Application Services) for builds and submissions
- Web output mode: `static`
