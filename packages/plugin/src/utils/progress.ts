import chalk from 'chalk';
import stripAnsi from 'strip-ansi';
import { gradient } from './utils';

export interface ProgressOptions {
  stream?: any;
  current?: number;
  total: number;
  width?: number;
  clear?: boolean;
  complete?: string;
  incomplete?: string;
  head?: string;
  renderThrottle?: number;
  callback?: (value: any) => void;
  colors?: string | string[];
}

interface IChars {
  complete: string;
  incomplete: string;
  head: string;
}

class Progress {
  private stream: any;
  private fmt: string;
  private current: number;
  private total: number;
  private width: number;
  private clear: boolean;
  private chars: IChars;
  private renderThrottle: number;
  private lastRender: number;
  private callback: (value: any) => void;
  private tokens: any;
  private lastDraw: string;
  private start: number;
  private colors: any;

  constructor(fmt: string, options: ProgressOptions) {
    this.stream = options.stream || process.stderr;

    this.fmt = fmt;
    this.current = options.current || 0;
    this.total = options.total || 100;
    this.width = options.width || 30;
    this.clear = options.clear || false;
    this.chars = {
      complete: options.complete || '━',
      incomplete: options.incomplete || ' ',
      head: options.head || options.complete || '━',
    };
    this.renderThrottle = options.renderThrottle !== 0 ? options.renderThrottle || 16 : 0;
    this.lastRender = -Infinity;
    this.callback = options.callback || (() => {});
    this.tokens = {};
    this.lastDraw = '';
    this.setColors(options.colors);
  }

  private getFormattedString(
    percent: number,
    elapsed: number,
    eta: number,
    rate: number,
    force: boolean,
  ): string {
    return this.fmt
      .replace(':current', this.current + '')
      .replace(':total', this.total + '')
      .replace(':elapsed', isNaN(elapsed) ? '0.0' : (elapsed / 1000).toFixed(1) + '')
      .replace(
        ':eta',
        force
          ? chalk.gray('emitting after emit')
          : isNaN(eta) || !isFinite(eta)
          ? '0.0s'
          : (eta / 1000).toFixed(1) + 's',
      )
      .replace(':percent', percent.toFixed(0) + '%')
      .replace(':rate', Math.round(rate) + '');
  }

  private calculateETA(elapsed: number): number {
    return this.current === 0 ? 0 : elapsed * (this.total / this.current - 1);
  }

  private calculateRate(elapsed: number): number {
    return this.current / (elapsed / 1000);
  }

  setColors(colors: string | string[]) {
    let newColors = [];
    if (typeof colors === 'string') {
      newColors = [colors, colors];
    } else if (Array.isArray(colors)) {
      if (colors.length !== 2) {
        newColors = [colors[0], colors[0]];
      } else {
        newColors = colors;
      }
    }
    if (newColors.length) {
      this.colors = gradient(newColors[0], newColors[1], this.width + 1);
    } else {
      this.colors = gradient('#6018DC', '#EEAD92', this.width + 1);
    }
  }

  tick(len: number, tokens: any) {
    if (len !== 0) {
      len = len || 1;
    }

    if (typeof len === 'object') {
      tokens = len;
      len = 1;
    }
    if (tokens) {
      this.tokens = tokens;
    }

    if (this.current === 0) {
      this.start = new Date().getTime();
    }

    this.current += len;

    this.render();

    if (this.current >= this.total) {
      this.render(undefined, true);
      this.terminate();
      this.callback(this);
      return;
    }
  }

  render(tokens: any = {}, force = false) {
    force = force !== undefined ? force : false;
    if (tokens) {
      this.tokens = tokens;
    }
    if (!this.stream.isTTY) return;

    const now = Date.now();
    const delta = now - this.lastRender;
    if (!force && delta < this.renderThrottle) {
      return;
    } else {
      this.lastRender = now;
    }

    const ratio = Math.min(Math.max(this.current / this.total, 0), 1);
    const percent = Math.floor(ratio * 100);
    const elapsed = new Date().getTime() - this.start;
    const eta = this.calculateETA(elapsed);
    const rate = this.calculateRate(elapsed);

    let formatted = this.getFormattedString(percent, elapsed, eta, rate, force);
    let availableSpace = Math.max(
      0,
      this.stream.columns - stripAnsi(formatted.replace(':bar', '')).length,
    );
    if (availableSpace && process.platform === 'win32') {
      availableSpace -= 1;
    }

    const width = Math.min(this.width, availableSpace);
    const completeLength = Math.round(width * ratio);
    const complete = Array(Math.max(0, completeLength + 1))
      .fill('')
      .map((_, index) =>
        this.colors?.length ? this.colors[index](this.chars.complete) : this.chars.complete,
      )
      .join('');
    const incomplete = Array(Math.max(0, width - completeLength + 1)).join(this.chars.incomplete);

    formatted = formatted.replace(':bar', complete + incomplete);
    for (const key in this.tokens) {
      formatted = formatted.replace(':' + key, this.tokens[key]);
    }

    if (this.lastDraw !== formatted) {
      this.stream.cursorTo(0);
      this.stream.write(formatted);
      this.stream.clearLine(1);
      this.lastDraw = formatted;
    }
  }

  update(ratio: number, tokens: any) {
    const goal = Math.floor(ratio * this.total);
    const delta = goal - this.current;

    this.tick(delta, tokens);
  }

  terminate() {
    if (this.clear) {
      if (this.stream.clearLine) {
        this.stream.clearLine();
        this.stream.cursorTo(0);
      }
    } else {
      this.stream.write('\n');
    }
  }
}

export default Progress;
