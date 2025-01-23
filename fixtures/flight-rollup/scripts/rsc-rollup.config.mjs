import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'url';

import {transformAsync} from '@babel/core';
import {defineConfig} from 'rollup';
// import babel from '@rollup/plugin-babel';
// import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
// import json from '@rollup/plugin-json';
import nodeExternals from 'rollup-plugin-node-externals';

import {
  resolve as reactResolve,
  load as reactLoad,
} from 'react-server-dom-webpack/node-loader';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
/** @type {(...args: string[]) => string} */
const p = (...args) => path.join(__dirname, ...args);

/** @type {() => import('rollup').Plugin} */
function babelPlugin() {
  return {
    name: 'rsc-babel',
    async transform(inputCode, filename) {
      const result = await transformAsync(inputCode, {
        plugins: [
          '@babel/plugin-syntax-import-meta',
          '@babel/plugin-transform-react-jsx',
          ['@babel/plugin-transform-runtime', {useESModules: true}],
        ],
      });

      if (!result || !result.code) {
        throw new Error(`Babel transform failed on ${filename}`);
      }

      return {
        code: result.code,
        map: result.map,
      };
    },
  };
}

/** @type {() => import('rollup').Plugin} */
function rscPlugin() {
  let resolverSetup = false;

  return {
    name: 'rsc-transform',
    async resolveId(id, importer, options) {
      if (resolverSetup) {
        return null;
      }

      /** @typedef {{ conditions: string[]; parentURL: string | undefined }} ResolveContext */
      /** @type {ResolveContext} */
      const context = {
        conditions: ['react-server', 'default', 'module', 'import', 'require'],
        parentURL: importer,
      };

      /** @typedef {(specifier: string, context: ResolveContext, defaultResolve: ResolveFunction) => Promise<{ url: string}>} ResolveFunction */
      /** @type {ResolveFunction} */
      const defaultResolve = async (id, context, defaultResolve) => {
        const parent = context.parentURL?.startsWith('file://')
          ? fileURLToPath(context.parentURL)
          : context.parentURL;

        const resolvedId = await this.resolve(id, parent);
        if (!resolvedId) {
          throw new Error(`Could not resolve ${id} from ${parent}`);
        }

        return {url: resolvedId.id};
      };

      resolverSetup = true;

      await reactResolve(id, context, defaultResolve);
      return this.resolve(id, importer, options);
    },
    async transform(input, id) {
      // Transform modules into client/server references
      const url = pathToFileURL(id).href;

      /** @typedef {{ conditions: string[]; format?: string | null | undefined; importAssertions: Record<string, any>; }} LoadContext */
      /** @type {LoadContext} */
      const context = {
        conditions: ['react-server'],
        format: 'module',
        importAssertions: {},
      };

      /**
       * @typedef {{ format: string, shortCircuit?: boolean, source: string }} LoadResult
       * @typedef {(url: string, context: LoadContext, defaultLoad: LoadFunction) => Promise<LoadResult>} LoadFunction
       * @type {LoadFunction}
       */
      const defaultLoad = async (url, context, defaultLoad) => {
        const idToLoad = url.startsWith('file://') ? fileURLToPath(url) : url;

        if (id === idToLoad) {
          return {format: 'module', source: input};
        } else {
          const loadResult = await this.load({id: idToLoad});
          if (!loadResult.code) throw new Error(`Could not load ${idToLoad}`);
          return {format: 'module', source: loadResult.code};
        }
      };

      /** @type {LoadResult} */
      let {source} = await reactLoad(url, context, defaultLoad);
      return source;
    },
  };
}

export default defineConfig({
  input: [p('../server/rsc-server.js')],
  output: {
    dir: p('../build-rsc'),
    format: 'es',
    compact: false,
    entryFileNames: `[name].js`,
    chunkFileNames: `[name]-[hash].js`,
  },
  watch: {
    clearScreen: false,
  },
  plugins: [
    nodeExternals({
      builtins: true,
      builtinsPrefix: 'add',
      deps: true,
      devDeps: true,
      peerDeps: true,
      optDeps: true,
    }),
    // json(),
    // babel({
    //   babelHelpers: 'runtime',
    //   exclude: /node_modules/,
    // }),
    babelPlugin(),
    rscPlugin(),
    commonjs(),
    // replace({
    //   preventAssignment: true,
    //   values: {
    //     'process.env.NODE_ENV': JSON.stringify(environment),
    //   },
    // }),
    nodeResolve({
      // Only necessary if bundling node_modules, which we aren't.
      // exportConditions: [
      //   'react-server',
      //   'default',
      //   'module',
      //   'import',
      //   'require',
      // ],
      extensions: ['.mjs', '.js', '.jsx', '.json', '.node'],
    }),
    // visualizer({
    //   filename: path.join(outputDir, 'bundleStats.html'),
    //   title: `${title} - Bundle Stats`,
    // }),
  ],
});
