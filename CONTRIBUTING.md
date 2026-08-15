# Contributing to Ripple.js

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/your-username/ripple-js.git
cd ripple-js

# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build the library
npm run build

# Type check
npm run typecheck
```

## Project Structure

```
src/
├── core/       # Core reactive engine (signal, computed, effect, graph)
├── utils/      # Higher-level utilities (watch, store, history, etc.)
├── dev/        # Development/debugging tools
└── index.ts    # Barrel export
tests/          # Vitest test suites
```

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(scope): description` — New features
- `fix(scope): description` — Bug fixes
- `test(scope): description` — Adding/updating tests
- `docs: description` — Documentation changes
- `chore: description` — Build, tooling, or maintenance
- `refactor(scope): description` — Code refactoring

## Guidelines

1. **Write tests** for every new feature or bug fix
2. **Keep bundle size small** — every byte counts at < 2KB
3. **Zero dependencies** — don't add external packages
4. **TypeScript first** — all source must be TypeScript with strict mode
5. **Document public APIs** — every exported function needs JSDoc

## Pull Request Process

1. Fork the repo and create a feature branch
2. Write your code with tests
3. Run `npm test` and `npm run build` to ensure everything passes
4. Submit a PR with a clear description of what and why

## Reporting Issues

Use GitHub Issues. Please include:
- What you expected to happen
- What actually happened
- Minimal reproduction code
- Your environment (Node version, browser, etc.)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
