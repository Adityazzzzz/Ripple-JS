import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
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
  ],
};
