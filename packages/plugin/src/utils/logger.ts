import chalk from 'chalk';
import readline from 'readline';

class Logger {
  clear() {
    const blank = '\n'.repeat(process.stdout.rows);
    console.log(blank);
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
  }

  event(message: string) {
    console.log(`${chalk.magenta('event')} - ${message}`);
  }

  ready(message: string) {
    console.log(`${chalk.green('ready')} - ${message}`);
  }

  info(message: string) {
    console.log(`${chalk.cyan('info')}  - ${message}`);
  }

  error(message: string) {
    console.log(`${chalk.red('error')} - ${message}`);
  }

  warn(message: string) {
    console.log(`${chalk.yellow('warn')}  - ${message}`);
  }
}

export default new Logger();
