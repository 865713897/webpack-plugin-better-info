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
    displayError(stats: Stats): Promise<void>;
    displayStatsAssets(stats: Stats, path: string): void;
    extractErrorsFromStats(stats: Stats, type: 'errors' | 'warnings'): any[];
}

export { WebpackPluginBetterInfo as default };
