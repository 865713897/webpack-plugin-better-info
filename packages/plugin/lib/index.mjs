import webpack from 'webpack';
import chalk from 'chalk';
import path from 'path';
import { readFile } from 'fs';
import zlib from 'zlib';
import readline from 'readline';

const getSize = (byte) => {
  if (byte < 1024) {
    return `${byte} B`;
  } else if (byte < 1024 * 1024) {
    return `${(byte / 1024).toFixed(2)} KB`;
  } else if (byte < 1024 * 1024 * 1024) {
    return `${(byte / 1024 / 1024).toFixed(2)} MB`;
  }
  return "";
};
const getCompressSize = (filePath) => {
  return new Promise((resolve, reject) => {
    const _path = path.resolve(process.cwd(), filePath);
    readFile(_path, (error, content) => {
      if (error) {
        return reject(error);
      }
      zlib.gzip(content, (err, compressedData) => {
        if (err) {
          return reject(err);
        }
        resolve(compressedData.length);
      });
    });
  });
};
const parseHexColor = (hex) => {
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  const result = hex.slice(1).match(/.{1,2}/g).map((c) => parseInt(c, 16));
  return { r: result[0], g: result[1], b: result[2] };
};
const parseRgbColor = (rgb) => {
  const result = rgb.match(/\d+/g).map(Number);
  return { r: result[0], g: result[1], b: result[2] };
};
const colorToHex = (color) => {
  return `#${Object.values(color).map((c) => c.toString(16).padStart(2, "0")).join("")}`;
};
const interpolateColor = (start, end, factor) => {
  const result = { r: 0, g: 0, b: 0 };
  ["r", "g", "b"].forEach((channel) => {
    result[channel] = Math.round(
      start[channel] + (end[channel] - start[channel]) * factor
    );
  });
  return result;
};
const parseColor = (color) => {
  if (color.startsWith("#")) {
    return parseHexColor(color);
  } else if (color.startsWith("rgb")) {
    return parseRgbColor(color);
  }
  throw new Error("Invalid color format");
};
const gradient = (startColor, endColor, steps) => {
  const start = parseColor(startColor);
  const end = parseColor(endColor);
  return Array.from({ length: steps }, (_, i) => {
    const factor = i / (steps - 1);
    const interpolatedColor = interpolateColor(start, end, factor);
    return chalk.hex(colorToHex(interpolatedColor));
  });
};

const isModuleBuildError = (error) => {
  return error.stack?.includes("ModuleBuildError") || error.stack?.includes("ModuleNotFoundError");
};
const cleanErrorMessage = (message) => {
  return message.replace(/^Module build failed.*:\s/, "").replace(/^SyntaxError:.*:\s/, "").replace(/^\s*at\s.*:\d+:\d+\)?[\s]*$/gm, "").replace(/^Module not found:\s/, "").replace(/Error:|Caused by:|Syntax Error/g, "").trim();
};
const cleanErrorModuleName = (moduleName) => {
  return moduleName.replace(/^.*(?=\.\/src)/, "").replace(/\?.*/, "");
};
const transformBuildErrors = (error) => {
  if (isModuleBuildError(error)) {
    error.message = cleanErrorMessage(error.message);
    error.moduleName = cleanErrorModuleName(error.moduleName);
  }
  return error;
};
const transformErrors = (errors) => {
  return errors.map(transformBuildErrors);
};

function ansiRegex({onlyFirst = false} = {}) {
	const pattern = [
	    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
		'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
	].join('|');

	return new RegExp(pattern, onlyFirst ? undefined : 'g');
}

const regex = ansiRegex();

function stripAnsi(string) {
	if (typeof string !== 'string') {
		throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
	}

	// Even though the regex is global, we don't need to reset the `.lastIndex`
	// because unlike `.exec()` and `.test()`, `.replace()` does it automatically
	// and doing it manually has a performance penalty.
	return string.replace(regex, '');
}

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => {
  __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class Progress {
  constructor(fmt, options) {
    __publicField$1(this, "stream");
    __publicField$1(this, "fmt");
    __publicField$1(this, "current");
    __publicField$1(this, "total");
    __publicField$1(this, "width");
    __publicField$1(this, "clear");
    __publicField$1(this, "chars");
    __publicField$1(this, "renderThrottle");
    __publicField$1(this, "lastRender");
    __publicField$1(this, "callback");
    __publicField$1(this, "tokens");
    __publicField$1(this, "lastDraw");
    __publicField$1(this, "start");
    __publicField$1(this, "colors");
    this.stream = options.stream || process.stderr;
    this.fmt = fmt;
    this.current = options.current || 0;
    this.total = options.total || 100;
    this.width = options.width || 30;
    this.clear = options.clear || false;
    this.chars = {
      complete: options.complete || "\u2501",
      incomplete: options.incomplete || " ",
      head: options.head || options.complete || "\u2501"
    };
    this.renderThrottle = options.renderThrottle !== 0 ? options.renderThrottle || 16 : 0;
    this.lastRender = -Infinity;
    this.callback = options.callback || (() => {
    });
    this.tokens = {};
    this.lastDraw = "";
    this.setColors(options.colors);
  }
  getFormattedString(percent, elapsed, eta, rate, force) {
    return this.fmt.replace(":current", this.current + "").replace(":total", this.total + "").replace(":elapsed", isNaN(elapsed) ? "0.0" : (elapsed / 1e3).toFixed(1) + "").replace(
      ":eta",
      force ? chalk.gray("emitting after emit") : isNaN(eta) || !isFinite(eta) ? "0.0s" : (eta / 1e3).toFixed(1) + "s"
    ).replace(":percent", percent.toFixed(0) + "%").replace(":rate", Math.round(rate) + "");
  }
  calculateETA(elapsed) {
    return this.current === 0 ? 0 : elapsed * (this.total / this.current - 1);
  }
  calculateRate(elapsed) {
    return this.current / (elapsed / 1e3);
  }
  setColors(colors) {
    let newColors = [];
    if (typeof colors === "string") {
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
      this.colors = gradient("#6018DC", "#EEAD92", this.width + 1);
    }
  }
  tick(len, tokens) {
    if (len !== 0) {
      len = len || 1;
    }
    if (typeof len === "object") {
      tokens = len;
      len = 1;
    }
    if (tokens) {
      this.tokens = tokens;
    }
    if (this.current === 0) {
      this.start = (/* @__PURE__ */ new Date()).getTime();
    }
    this.current += len;
    this.render();
    if (this.current >= this.total) {
      this.render(void 0, true);
      this.terminate();
      this.callback(this);
      return;
    }
  }
  render(tokens = {}, force = false) {
    force = force !== void 0 ? force : false;
    if (tokens) {
      this.tokens = tokens;
    }
    if (!this.stream.isTTY)
      return;
    const now = Date.now();
    const delta = now - this.lastRender;
    if (!force && delta < this.renderThrottle) {
      return;
    } else {
      this.lastRender = now;
    }
    const ratio = Math.min(Math.max(this.current / this.total, 0), 1);
    const percent = Math.floor(ratio * 100);
    const elapsed = (/* @__PURE__ */ new Date()).getTime() - this.start;
    const eta = this.calculateETA(elapsed);
    const rate = this.calculateRate(elapsed);
    let formatted = this.getFormattedString(percent, elapsed, eta, rate, force);
    let availableSpace = Math.max(
      0,
      this.stream.columns - stripAnsi(formatted.replace(":bar", "")).length
    );
    if (availableSpace && process.platform === "win32") {
      availableSpace -= 1;
    }
    const width = Math.min(this.width, availableSpace);
    const completeLength = Math.round(width * ratio);
    const complete = Array(Math.max(0, completeLength + 1)).fill("").map(
      (_, index) => this.colors?.length ? this.colors[index](this.chars.complete) : this.chars.complete
    ).join("");
    const incomplete = Array(Math.max(0, width - completeLength + 1)).join(this.chars.incomplete);
    formatted = formatted.replace(":bar", complete + incomplete);
    for (const key in this.tokens) {
      formatted = formatted.replace(":" + key, this.tokens[key]);
    }
    if (this.lastDraw !== formatted) {
      this.stream.cursorTo(0);
      this.stream.write(formatted);
      this.stream.clearLine(1);
      this.lastDraw = formatted;
    }
  }
  update(ratio, tokens) {
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
      this.stream.write("\n");
    }
  }
}

class Logger {
  clear() {
    const blank = "\n".repeat(process.stdout.rows);
    console.log(blank);
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
  }
  event(message) {
    console.log(`${chalk.magenta("event")} - ${message}`);
  }
  ready(message) {
    console.log(`${chalk.green("ready")} - ${message}`);
  }
  info(message) {
    console.log(`${chalk.cyan("info")}  - ${message}`);
  }
  error(message) {
    console.log(`${chalk.red("error")} - ${message}`);
  }
  warn(message) {
    console.log(`${chalk.yellow("warn")}  - ${message}`);
  }
}
const logger = new Logger();

function getColorFileName(name) {
  if (name.includes(".html")) {
    return chalk.green(name);
  } else if (name.includes(".js")) {
    return chalk.yellow(name);
  } else if (name.includes(".css")) {
    return chalk.blue(name);
  }
}
async function displayAssets(assets, outputPath) {
  const assetPromises = assets.map(async (asset) => {
    const { name, size } = asset;
    const lastSlashIndex = name.lastIndexOf("/");
    const filePath = name.substring(0, lastSlashIndex);
    const fileName = name.substring(lastSlashIndex + 1);
    const path = `${outputPath}/${filePath ? filePath + "/" : ""}`;
    const newName = `${chalk.gray(path)}${getColorFileName(fileName)}`;
    const zipSize = await getCompressSize(`${path}/${fileName}`);
    return { name: newName, size, zipSize };
  });
  const resolvedAssets = await Promise.all(assetPromises);
  const { newAssets, totalSize, totalZipSize, maxNameLen, maxSizeLen } = resolvedAssets.reduce(
    (acc, { name, size, zipSize }) => {
      const fullSize = getSize(size);
      const fullZipSize = getSize(zipSize);
      acc.newAssets.push({ name, size: fullSize, zipSize: fullZipSize });
      acc.maxNameLen = Math.max(acc.maxNameLen, stripAnsi(name).length);
      acc.maxSizeLen = Math.max(acc.maxSizeLen, fullSize.length);
      acc.totalSize += size;
      acc.totalZipSize += zipSize;
      return acc;
    },
    {
      newAssets: [],
      totalSize: 0,
      totalZipSize: 0,
      maxNameLen: 0,
      maxSizeLen: 0
    }
  );
  const fileTitle = chalk.blue.bold("File");
  const sizeTitle = chalk.blue.bold("Size");
  const zipSizeTitle = chalk.blue.bold("Gzipped");
  console.log(
    `  ${fileTitle}${"".padStart(
      maxNameLen - stripAnsi(fileTitle).length
    )}    ${sizeTitle}${"".padStart(maxSizeLen - stripAnsi(sizeTitle).length)}    ${zipSizeTitle}`
  );
  newAssets.forEach(({ name, size, zipSize }) => {
    console.log(
      `  ${name}${"".padStart(maxNameLen - stripAnsi(name).length)}    ${size}${"".padStart(
        maxSizeLen - stripAnsi(size).length
      )}    ${chalk.green(zipSize)}`
    );
  });
  console.log(`
  ${chalk.blue.bold("Total size:")}  ${getSize(totalSize)}`);
  console.log(`  ${chalk.blue.bold("Gzipped size:")}  ${getSize(totalZipSize)}`);
  process.exit(0);
}

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class WebpackPluginBetterInfo {
  constructor(options) {
    __publicField(this, "shouldClearConsole");
    __publicField(this, "bar");
    __publicField(this, "isDev");
    this.shouldClearConsole = options.clearLog || false;
    this.bar = new Progress(`\u25CF ${chalk.whiteBright.bold("web")} :bar (:percent) :eta`, {
      complete: options.complete,
      incomplete: options.incomplete,
      width: options.width,
      total: options.total,
      colors: options.colors
    });
  }
  apply(compiler) {
    const plugin = { name: "WebpackPluginBetterInfo" };
    this.isDev = compiler.options.mode === "development";
    const processPlugin = new webpack.ProgressPlugin((percentage, message, ...args) => {
      if (!this.bar || this.isDev)
        return;
      if (message === "done") {
        this.bar.update(1);
        this.bar = null;
      } else {
        this.bar.update(percentage);
      }
    });
    processPlugin.apply(compiler);
    compiler.hooks.afterPlugins.tap(plugin, () => {
      this.clearConsole();
      compiler.options.stats = "none";
      if (this.isDev) {
        logger.event("Compiling...");
      } else {
        const content = this.getGradientContent("Start Packing...", ["#94FFEB", "#00A97B"]);
        logger.event(content);
      }
    });
    compiler.hooks.invalid.tap(plugin, () => {
      logger.event("Compiling...");
    });
    compiler.hooks.done.tap(plugin, (stats) => {
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
      if (hasWarnings) {
        this.displayWarning(stats);
      }
    });
  }
  clearConsole() {
    if (this.shouldClearConsole) {
      logger.clear();
    }
  }
  // 获取编译时间
  getStatsCompileTime(stats) {
    return stats.endTime - stats.startTime;
  }
  // 获取渐变内容
  getGradientContent(content, colors) {
    const colorMap = gradient(colors[0], colors[1], content.trim().length);
    return content.split("").map((c, index) => {
      if (c !== " ") {
        return colorMap[index](c);
      }
      return c;
    }).join("");
  }
  // 输出成功信息
  displaySuccess(stats) {
    const compileTime = this.getStatsCompileTime(stats);
    logger.ready(`Compiled in ${chalk.whiteBright.bold(compileTime)} ms`);
  }
  // 输出错误信息
  displayError(stats) {
    const errors = transformErrors(stats.toJson().errors);
    errors.forEach((error) => {
      logger.error(`in ${error.moduleName}`);
      logger.error(error.message);
    });
  }
  // 输出警告信息
  displayWarning(stats) {
    const warnings = stats.toJson().warnings;
    warnings.forEach((warning) => {
      logger.warn(`in ${warning.moduleName}`);
      logger.warn(warning.message);
    });
  }
  // 输出最终产物
  displayStatsAssets(stats, path) {
    if (this.isDev)
      return;
    const outputPath = path?.replace(`${process.cwd()}`, "").replace(/\\|\//g, "") || "/";
    const assets = stats.toJson().assets;
    const sortAssets = assets?.map((asset) => ({ name: asset.name, size: asset.size })) || [];
    sortAssets?.sort((a, b) => a.size - b.size);
    logger.info("Production file sizes for web:\n");
    displayAssets(sortAssets, outputPath);
  }
}

export { WebpackPluginBetterInfo as default };
