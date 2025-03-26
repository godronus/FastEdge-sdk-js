import { componentize } from 'src/componentize/index.js';

import { validateFilePaths } from '~utils/input-path-verification.js';

async function buildWasm({ input, output, tsconfigPath }) {
  await validateFilePaths(input, output, tsconfigPath);
  if (process.env.NODE_ENV !== 'test') {
    await componentize(input, output);
  }
}

export { buildWasm };
