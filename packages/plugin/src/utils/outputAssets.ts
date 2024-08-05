import chalk from 'chalk';
import stripAnsi from 'strip-ansi';
import { getSize, getCompressSize } from './utils';

export async function displayAssets(assets: any[], outputPath: string) {
  const assetPromises = assets.map(async (asset) => {
    const { name, size } = asset;
    const lastSlashIndex = name.lastIndexOf('/');
    const filePath = name.substring(0, lastSlashIndex);
    const fileName = name.substring(lastSlashIndex + 1);
    const path = `${outputPath}/${filePath ? filePath + '/' : ''}`;
    const newName = `${chalk.gray(path)}${chalk.cyan(fileName)}`;
    const zipSize = (await getCompressSize(`${path}/${fileName}`)) as number;
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
      maxSizeLen: 0,
    } as {
      newAssets: { name: string; size: string; zipSize: string }[];
      totalSize: number;
      totalZipSize: number;
      maxNameLen: number;
      maxSizeLen: number;
    },
  );

  const fileTitle = chalk.blue.bold('File');
  const sizeTitle = chalk.blue.bold('Size');
  const zipSizeTitle = chalk.blue.bold('Gzipped');

  console.log(
    `  ${fileTitle}${''.padStart(
      maxNameLen - stripAnsi(fileTitle).length,
    )}    ${sizeTitle}${''.padStart(
      maxSizeLen - stripAnsi(sizeTitle).length,
    )}    ${zipSizeTitle}`,
  );

  newAssets.forEach(({ name, size, zipSize }) => {
    console.log(
      `  ${name}${''.padStart(maxNameLen - stripAnsi(name).length)}    ${size}${''.padStart(
        maxSizeLen - stripAnsi(size).length,
      )}    ${chalk.green(zipSize)}`,
    );
  });

  console.log(`\n  ${chalk.blue.bold('Total size:')}  ${getSize(totalSize)}`);
  console.log(`  ${chalk.blue.bold('Gzipped size:')}  ${getSize(totalZipSize)}`);
  process.exit(0);
}