import { spawnSync } from 'node:child_process';

import { createOutputDirectory, isFile, npxPackagePath } from './file-system.js';
import { colorLog } from './prompts.js';

function containsJavascriptSyntaxErrors(jsInput) {
  const nodeProcess = spawnSync(`"${process.execPath}"`, ['--check', jsInput], {
    stdio: [null, null, null],
    shell: true,
    encoding: 'utf-8',
  });
  if (nodeProcess.status === 0) {
    return false;
  }
  colorLog(
    'standard',
    `${nodeProcess.stderr.split('\nSyntaxError: Invalid or unexpected token\n')[0]}\n`,
  );
  colorLog('error', `SyntaxError: Invalid or unexpected token`);
  colorLog('error', `Error: "${jsInput}" contains JS Errors`);
  return true;
}

function isTypeScriptInstalled() {
  const result = spawnSync('npx', ['tsc', '--version'], {
    stdio: [null, null, null],
    shell: true,
    encoding: 'utf-8',
  });

  if (result.status === 0) {
    return true;
  }
  colorLog('error', 'TypeScript is not installed.');
  colorLog('error', 'Please run "npm install typescript"');
  return false;
}

function containsTypeScriptSyntaxErrors(tsInput, tsconfigPath) {
  if (isTypeScriptInstalled()) {
    const includeFasEdgeTypes =
      process.env.NODE_ENV === 'test'
        ? []
        : ['--types', './node_modules/@gcoredev/fastedge-sdk-js'];

    const defaultTscBuildFlags = [
      '--noEmit',
      '--skipLibCheck',
      '--strict',
      '--target',
      'esnext',
      ...includeFasEdgeTypes,
      tsInput,
    ];

    const tscBuildFlags = tsconfigPath ? ['--project', tsconfigPath] : defaultTscBuildFlags;

    const nodeProcess = spawnSync('npx', ['tsc', ...tscBuildFlags], {
      stdio: [null, null, null],
      shell: true,
      encoding: 'utf-8',
    });
    if (nodeProcess.status === 0) {
      return false;
    }

    colorLog('error', `SyntaxError: Fix typescript errors`);
    return true;
  }
  return true; // TypeScript is not installed
}

function containsSyntaxErrors(jsInput, tsconfigPath) {
  if (jsInput.slice(-3) === '.js') {
    return containsJavascriptSyntaxErrors(jsInput);
  }
  if (jsInput.slice(-3) === '.ts') {
    return containsTypeScriptSyntaxErrors(jsInput, tsconfigPath);
  }
  colorLog('error', `Error: "${jsInput}" is not a valid file type - must be ".js" or ".ts"`);
  return true;
}

async function validateFilePaths(input, output, tsconfigPath) {
  if (!(await isFile(input))) {
    colorLog('error', `Error: Input "${input}" is not a file`);
    process.exit(1);
  }
  if (output.slice(-5) !== '.wasm') {
    colorLog('error', `Error: Output ${output} must be a .wasm file path`);
    process.exit(1);
  }
  if (!(await isFile(output))) {
    createOutputDirectory(output);
    if (!(await isFile(output, /* AllowNonexistent */ true))) {
      colorLog('error', `Error: "${output}" path does not exist`);
      process.exit(1);
    }
  }
  if (containsSyntaxErrors(input, tsconfigPath)) {
    process.exit(1);
  }
}

async function validateWasmEngineExists(
  wasmEngine = npxPackagePath('./lib/fastedge-runtime.wasm'),
) {
  if (!(await isFile(wasmEngine))) {
    colorLog('error', `Error: "${wasmEngine}" is not a file`);
    process.exit(1);
  }
}

export { containsSyntaxErrors, validateFilePaths, validateWasmEngineExists };
