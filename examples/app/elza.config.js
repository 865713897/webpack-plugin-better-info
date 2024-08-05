import { defineConfig } from 'elza';
import BetterInfo from 'webpack-plugin-better-info';

export default defineConfig({
  transpiler: 'swc',
  chainWebpack: (config) => {
    config.plugin('better-info').use(new BetterInfo({}));
  },
});
