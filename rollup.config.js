import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const sharedPlugins = [
  terser({
    compress: {
      passes: 2,
      pure_getters: true,
      unsafe_comps: true,
    },
    mangle: {
      properties: {
        regex: /^_/,  // Only mangle private properties (prefixed with _)
      },
    },
  }),
];

// Main library build
const mainBuild = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/ripple.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    {
      file: 'dist/ripple.cjs.js',
      format: 'cjs',
      sourcemap: true,
    },
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist/types',
    }),
    ...sharedPlugins,
  ],
};

// React adapter build
const reactBuild = {
  input: 'src/adapters/react.ts',
  output: {
    file: 'dist/adapters/react.js',
    format: 'esm',
    sourcemap: true,
  },
  external: ['react', /^\.\.\/core/],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist/types',
      compilerOptions: {
        noUnusedLocals: false,
        noUnusedParameters: false,
      },
    }),
    ...sharedPlugins,
  ],
};

// Vue adapter build
const vueBuild = {
  input: 'src/adapters/vue.ts',
  output: {
    file: 'dist/adapters/vue.js',
    format: 'esm',
    sourcemap: true,
  },
  external: ['vue', /^\.\.\/core/],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist/types',
      compilerOptions: {
        noUnusedLocals: false,
        noUnusedParameters: false,
      },
    }),
    ...sharedPlugins,
  ],
};

// Svelte adapter build
const svelteBuild = {
  input: 'src/adapters/svelte.ts',
  output: {
    file: 'dist/adapters/svelte.js',
    format: 'esm',
    sourcemap: true,
  },
  external: ['svelte', 'svelte/store', /^\.\.\/core/],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist/types',
      compilerOptions: {
        noUnusedLocals: false,
        noUnusedParameters: false,
      },
    }),
    ...sharedPlugins,
  ],
};

export default [mainBuild, reactBuild, vueBuild, svelteBuild];
