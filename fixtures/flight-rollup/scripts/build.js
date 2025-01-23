import {rollup} from 'rollup';

import rscConfig from './rsc-rollup.config.mjs';

/** @type {(config: import('rollup').RollupOptions) => Promise<void>} */
async function buildRollup(config) {
  const bundle = await rollup(config);
  if (!config.output) {
    throw new Error('No output specified');
  }

  const outputConfigs = Array.isArray(config.output)
    ? config.output
    : [config.output];

  for (const outputConfig of outputConfigs) {
    await bundle.write(outputConfig);
  }
}

async function main() {
  await buildRollup(rscConfig);
}

main();
