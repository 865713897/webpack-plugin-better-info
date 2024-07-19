import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/index.ts'],
  outDir: 'lib',
  declaration: true,
  externals: ["webpack"],
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
  },
});
