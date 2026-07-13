# Project Structure

```
transient/
├── src/
│   └── app/              # Expo Router file-based routes (production code)
│       ├── _layout.tsx   # Root layout (Stack navigator)
│       └── index.tsx     # Home screen
├── assets/
│   └── images/           # App icons, splash screens, tab icons
├── app.json              # Expo app configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript config with path aliases
└── pyproject.toml        # Python tooling config (utility scripts)
```

## Conventions

- **App code lives in `src/`** — all new routes go in `src/app/`, components in `src/components/`, etc.
- **File-based routing** — each file in `src/app/` becomes a route. Layouts use `_layout.tsx`.
- **Path aliases** — use `@/` to reference `src/` and `@/assets/` for assets. Never use deep relative paths.
- **Styling** — use `StyleSheet.create()` for component styles, defined at the bottom of each file.
- **Theme tokens** — reference `example/src/constants/theme.ts` for the color, font, and spacing system.
- **Platform-specific code** — use `Platform.select()` for platform branching where needed.
- **Exports** — use default exports for route/screen components (required by Expo Router).
