# Contributing to Ripple.js

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/Adityazzzzz/Ripple-JS.git
cd Ripple-JS

# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Build the library
npm run build

# Type check
npm run typecheck

# Run benchmarks
npm run bench
```

## Project Structure

```
src/
├── core/           # Core reactive engine
│   ├── signal.ts       # signal() — writable reactive values
│   ├── computed.ts      # computed() — lazy derived values
│   ├── effect.ts        # effect() — auto-tracking side effects
│   ├── batch.ts         # batch() — coalesce updates
│   ├── untrack.ts       # untrack() — opt out of tracking
│   ├── scope.ts         # createScope() — lifecycle management
│   ├── graph.ts         # Push-pull reactive graph engine
│   ├── constants.ts     # CLEAN / CHECK_DIRTY / DIRTY flags
│   ├── types.ts         # TypeScript interfaces
│   ├── link.ts          # Link interface for graph edges
│   ├── is.ts            # isSignal, isComputed, isReactive
│   └── readonly.ts      # readonly() wrapper
├── utils/          # Higher-level utilities
│   ├── watch.ts         # Vue-style watcher
│   ├── derive.ts        # Multiple computed values at once
│   ├── subscribe.ts     # Simple change listener
│   ├── previous.ts      # Track previous values
│   ├── memo.ts          # Alias for computed
│   ├── on.ts            # Explicit dependency tracking
│   ├── toJSON.ts        # Serialize reactive state
│   ├── debounced.ts     # Debounced effects/signals
│   ├── throttled.ts     # Throttled effects
│   ├── catchError.ts    # Error boundaries
│   ├── fromPromise.ts   # Promise → reactive signals
│   ├── effectScope.ts   # Convenience scope wrapper
│   ├── collections.ts   # reactiveMap, reactiveArray
│   ├── history.ts       # Undo/redo
│   ├── store.ts         # Zustand/Pinia-style store
│   ├── storage.ts       # localStorage persistence
│   └── resource.ts      # Async data loading
├── adapters/       # Framework integrations
│   ├── react.ts         # React hooks (useSignal, useComputed, etc.)
│   ├── vue.ts           # Vue 3 refs/watchers
│   └── svelte.ts        # Svelte stores
├── dev/            # Development tools
│   └── debug.ts         # Graph inspection utilities
└── index.ts        # Barrel export (40+ APIs)
tests/              # Vitest test suites (14 files, 102 tests)
benchmarks/         # Performance benchmarks vs Preact/Vue
```

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(scope): description` — New features
- `fix(scope): description` — Bug fixes
- `test(scope): description` — Adding/updating tests
- `docs: description` — Documentation changes
- `chore: description` — Build, tooling, or maintenance
- `refactor(scope): description` — Code refactoring
- `perf(scope): description` — Performance improvements

## Guidelines

1. **Write tests** for every new feature or bug fix
2. **Keep bundle size small** — every byte counts at ~3.5KB gzipped
3. **Zero dependencies** — don't add external packages to the core
4. **TypeScript first** — all source must be TypeScript with strict mode
5. **Document public APIs** — every exported function needs JSDoc
6. **Memory safety** — register computed/effects with scopes; ensure disposal works
7. **Prefix internal properties** with `_` — these get mangled by Terser

## Pull Request Process

1. Fork the repo and create a feature branch from `master`
2. Write your code with tests
3. Run `npm test` and `npm run build` to ensure everything passes
4. Submit a PR with a clear description of what and why

## Reporting Issues

Use [GitHub Issues](https://github.com/Adityazzzzz/Ripple-JS/issues). Please include:
- What you expected to happen
- What actually happened
- Minimal reproduction code
- Your environment (Node version, browser, etc.)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
