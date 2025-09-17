import arg from 'arg';

import { printHelp, printVersion } from './print-info.ts';

import type { AssetCacheConfig } from '~static-assets/asset-manifest/types.ts';

import { createStaticAssetsManifest } from '~static-assets/asset-manifest/create-manifest.ts';
import { colorLog } from '~utils/color-log.ts';
import { loadConfig } from '~utils/config-helpers.ts';
import { isDirectory, isFile } from '~utils/file-system.ts';

/**
 * Represents the parsed arguments from the CLI.
 */
interface ParsedArgs {
  _: string[];
  '--version'?: boolean;
  '--help'?: boolean;
  '--input'?: string;
  '--output'?: string;
  '--config'?: string;
}

let inputFolder = '';
let outputFileName = '';
let configFile: string = '';
let args: ParsedArgs;

try {
  args = arg(
    {
      // Types
      '--version': Boolean,
      '--help': Boolean,
      '--input': String,
      '--output': String,
      '--config': String,

      // Aliases
      '-v': '--version',
      '-h': '--help',
      '-i': '--input',
      '-o': '--output',
      '-c': '--config',
    },
    {
      permissive: true,
    },
  ) as ParsedArgs;
} catch {
  printHelp();
  process.exit(0);
}

if (args['--help']) {
  printHelp();
  process.exit(0);
}

if (args['--version']) {
  await printVersion();
  process.exit(0);
}

if (args['--input']) {
  inputFolder = args['--input'];
}

if (args['--output']) {
  outputFileName = args['--output'];
}

if (args._.length === 2) {
  [inputFolder, outputFileName] = args._;
}

let configFromFile = {};
let hasConfigFilePath = false;

if (args['--config']) {
  configFile = args['--config'];
  hasConfigFilePath = configFile.trim().length > 0;
  if (hasConfigFilePath) {
    configFromFile = (await loadConfig<AssetCacheConfig>(configFile)) ?? {};
  }
}

if (inputFolder.trim().length === 0) {
  inputFolder = (configFromFile as Partial<AssetCacheConfig>).publicDir ?? '';
}

if (outputFileName.trim().length === 0) {
  outputFileName = (configFromFile as Partial<AssetCacheConfig>).assetManifestPath ?? '';
}

console.log('Farq: hasConfigFilePath', hasConfigFilePath);

const inputIsADirectory = await isDirectory(inputFolder, true);
console.log('Farq: inputIsADirectory', inputIsADirectory);
const outputIsAFile = await isFile(outputFileName, true);
console.log('Farq: outputIsAFile', outputIsAFile);
const hasValidInput = inputIsADirectory && outputIsAFile;
console.log('Farq: hasValidInput', hasValidInput);

if (hasValidInput) {
  const config = {
    ...configFromFile,
    publicDir: inputFolder,
    assetManifestPath: outputFileName,
  };
  await createStaticAssetsManifest(config);
  colorLog('info', `Generated Static Asset Manifest at: "${outputFileName}"`);
  process.exit(0);
}

printHelp();
process.exit(1);
