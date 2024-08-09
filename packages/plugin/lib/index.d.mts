import { Compiler, Stats } from 'webpack';

interface BetterInfoOptions {
    complete?: string;
    incomplete?: string;
    colors?: any;
    width?: number;
    total?: number;
    clearLog?: boolean;
}
declare class WebpackPluginBetterInfo {
    shouldClearConsole: boolean;
    bar: any;
    isDev: boolean;
    constructor(options: BetterInfoOptions);
    apply(compiler: Compiler): void;
    clearConsole(): void;
    getStatsCompileTime(stats: Stats): number;
    getGradientContent(content: string, colors: [string, string]): string;
    displaySuccess(stats: Stats): void;
    displayError(stats: Stats): void;
    displayWarning(stats: Stats): void;
    displayStatsAssets(stats: Stats, path: string): void;
}

export { type BetterInfoOptions, WebpackPluginBetterInfo as default };
