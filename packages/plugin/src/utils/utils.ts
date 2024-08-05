import path from 'path';
import { readFile } from 'fs';
import zlib from 'zlib';
import chalk, { Chalk } from 'chalk';

interface RGB {
  r: number;
  g: number;
  b: number;
}

// 获取大小
export const getSize = (byte: number) => {
  if (byte < 1024) {
    return `${byte} B`;
  } else if (byte < 1024 * 1024) {
    return `${(byte / 1024).toFixed(2)} KB`;
  } else if (byte < 1024 * 1024 * 1024) {
    return `${(byte / 1024 / 1024).toFixed(2)} MB`;
  }
  return '';
};

// 计算压缩大小
export const getCompressSize = (filePath: string): Promise<number> => {
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

const parseHexColor = (hex: string): RGB => {
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  const result = hex
    .slice(1)
    .match(/.{1,2}/g)!
    .map((c) => parseInt(c, 16));
  return { r: result[0], g: result[1], b: result[2] };
};

const parseRgbColor = (rgb: string): RGB => {
  const result = rgb.match(/\d+/g)!.map(Number);
  return { r: result[0], g: result[1], b: result[2] };
};

const colorToHex = (color: RGB): string => {
  return `#${Object.values(color)
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`;
};

const interpolateColor = (start: RGB, end: RGB, factor: number): RGB => {
  const result: RGB = { r: 0, g: 0, b: 0 };
  ['r', 'g', 'b'].forEach((channel) => {
    result[channel as keyof RGB] = Math.round(
      start[channel as keyof RGB] +
        (end[channel as keyof RGB] - start[channel as keyof RGB]) * factor,
    );
  });
  return result;
};

const parseColor = (color: string): RGB => {
  if (color.startsWith('#')) {
    return parseHexColor(color);
  } else if (color.startsWith('rgb')) {
    return parseRgbColor(color);
  }
  throw new Error('Invalid color format');
};

export const gradient = (startColor: string, endColor: string, steps: number): Chalk[] => {
  const start = parseColor(startColor);
  const end = parseColor(endColor);

  return Array.from({ length: steps }, (_, i) => {
    const factor = i / (steps - 1);
    const interpolatedColor = interpolateColor(start, end, factor);
    return chalk.hex(colorToHex(interpolatedColor));
  });
};

export const uniqueBy = (arr: any[], callback: (item: any) => any) => {
  const seen = {};
  return arr.filter((item) => {
    const value = callback(item);
    return !(value in seen) && (seen[value] = 1);
  });
};
