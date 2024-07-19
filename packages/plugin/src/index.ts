import webpack, { Compiler, Stats } from 'webpack';
import chalk from 'chalk';
import { gradient } from './utils/utils';
import ProgressBar from './utils/progress';
import logger from './utils/logger';

interface BetterInfoOptions {
  complete?: string;
  incomplete?: string;
  colors?: any;
  width?: number;
  total?: number;
  clearLog?: boolean;
}

class WebpackPluginBetterInfo {
  shouldClearConsole: boolean;
  bar: any;
  isDev: boolean;
  constructor(options: BetterInfoOptions) {
    this.shouldClearConsole = options.clearLog || false;

    this.bar = new ProgressBar(`● ${chalk.whiteBright.bold('web')} :bar (:percent) :eta`, {
      complete: options.complete,
      incomplete: options.incomplete,
      width: options.width,
      total: options.total,
      colors: options.colors,
    });
  }

  apply(compiler: Compiler) {
    const plugin = { name: 'WebpackPluginBetterInfo' };
    this.isDev = compiler.options.mode === 'development';

    const processPlugin = new webpack.ProgressPlugin((percentage, message, ...args) => {
      if (!this.bar || this.isDev) return;
      if (message === 'done') {
        this.bar.update(1);
        this.bar = null;
      } else {
        this.bar.update(percentage);
      }
    });
    processPlugin.apply(compiler);

    compiler.hooks.afterPlugins.tap(plugin, () => {
      this.clearConsole();
      compiler.options.stats = 'none';
      if (this.isDev) {
        logger.event('Compiling...');
      } else {
        const content = this.getGradientContent('Start Packing...', ['#94FFEB', '#00A97B']);
        logger.event(content);
      }
    });

    compiler.hooks.invalid.tap(plugin, () => {
      logger.event('Compiling...');
    });

    compiler.hooks.done.tap(plugin, (stats: Stats) => {
      const hasErrors = stats.hasErrors();
      const hasWarnings = stats.hasWarnings();
      if (!hasErrors && !hasWarnings) {
        this.displaySuccess(stats);
        this.displayStatsAssets(stats, compiler.options.output.path);
        return;
      }
      if (hasErrors) {
        this.displayError(stats);
      }
    });
  }

  clearConsole() {
    if (this.shouldClearConsole) {
      logger.clear();
    }
  }

  // 获取编译时间
  getStatsCompileTime(stats: Stats) {
    return stats.endTime - stats.startTime;
  }

  // 获取渐变内容
  getGradientContent(content: string, colors: [string, string]) {
    const colorMap = gradient(colors[0], colors[1], content.trim().length);
    return content
      .split('')
      .map((c, index) => {
        if (c !== ' ') {
          return colorMap[index](c);
        }
        return c;
      })
      .join('');
  }

  // 输出成功信息
  displaySuccess(stats: Stats) {
    const compileTime = this.getStatsCompileTime(stats);
    logger.ready(`Compiled in ${chalk.whiteBright.bold(compileTime)} ms`);
  }

  // 输出错误信息
  displayError(stats: Stats) {
    const errors = stats.toJson().errors;
    errors.forEach((error) => {
      logger.error(`in ${error.moduleName}`);
      logger.error(
        error.message
          .replace(/^Module build failed.*:\s/, '')
          .replace('Error:', '')
          .trim(),
      );
      // console.log(error.details);
    });
  }

  // 输出最终产物
  displayStatsAssets(stats: Stats, path: string) {
    if (this.isDev) return;
    const outputPath = path?.replace(`${process.cwd()}`, '').replace(/\\|\//g, '') || '/';
    const assets = stats.toJson().assets;
    const sortAssets = assets?.map((asset) => ({ name: asset.name, size: asset.size })) || [];
    sortAssets?.sort((a, b) => a.size - b.size);
    logger.info('Production file sizes for web:\n');
    logger.assets(sortAssets, outputPath);
  }
}

export default WebpackPluginBetterInfo;
