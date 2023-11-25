/**
 * @remix-run/dev v1.16.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var path = require('node:path');
var stream = require('node:stream');
var fse = require('fs-extra');
var prettyMs = require('pretty-ms');
var execa = require('execa');
var express = require('express');
var channel = require('../channel.js');
require('path');
require('module');
require('esbuild');
require('esbuild-plugin-polyfill-node');
require('fs');
require('url');
require('postcss-load-config');
require('postcss');
require('node:child_process');
require('node:url');
require('get-port');
require('@npmcli/package-json');
require('semver');
require('minimatch');
require('node:fs');
var detectPackageManager = require('../cli/detectPackageManager.js');
var warnOnce = require('../warnOnce.js');
require('remark-mdx-frontmatter');
require('tsconfig-paths');
require('postcss-modules');
require('../compiler/plugins/cssSideEffectImports.js');
require('../compiler/plugins/vanillaExtract.js');
require('postcss-discard-duplicates');
require('cacache');
require('crypto');
require('@babel/core');
require('assert');
require('@babel/plugin-syntax-jsx');
require('@babel/plugin-syntax-typescript');
require('recast');
require('jsesc');
var watch = require('../compiler/watch.js');
var env = require('./env.js');
var socket = require('./socket.js');
var hmr = require('./hmr.js');
var hdr = require('./hdr.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var path__namespace = /*#__PURE__*/_interopNamespace(path);
var stream__namespace = /*#__PURE__*/_interopNamespace(stream);
var fse__default = /*#__PURE__*/_interopDefaultLegacy(fse);
var prettyMs__default = /*#__PURE__*/_interopDefaultLegacy(prettyMs);
var execa__default = /*#__PURE__*/_interopDefaultLegacy(execa);
var express__default = /*#__PURE__*/_interopDefaultLegacy(express);

let stringifyOrigin = o => `${o.scheme}://${o.host}:${o.port}`;
let detectBin = async () => {
  let pkgManager = detectPackageManager.detectPackageManager() ?? "npm";
  if (pkgManager === "npm") {
    // npm v9 removed the `bin` command, so have to use `prefix`
    let {
      stdout
    } = await execa__default["default"](pkgManager, ["prefix"]);
    return path__namespace.join(stdout.trim(), "node_modules", ".bin");
  }
  let {
    stdout
  } = await execa__default["default"](pkgManager, ["bin"]);
  return stdout.trim();
};
let serve = async (initialConfig, options) => {
  await env.loadEnv(initialConfig.rootDirectory);
  let websocket = socket.serve({
    port: options.webSocketPort
  });
  let httpOrigin = {
    scheme: options.httpScheme,
    host: options.httpHost,
    port: options.httpPort
  };
  let state = {};
  let bin = await detectBin();
  let startAppServer = command => {
    console.log(`> ${command}`);
    let newAppServer = execa__default["default"].command(command, {
      stdio: "pipe",
      env: {
        NODE_ENV: "development",
        PATH: bin + (process.platform === "win32" ? ";" : ":") + process.env.PATH,
        REMIX_DEV_HTTP_ORIGIN: stringifyOrigin(httpOrigin)
      },
      // https://github.com/sindresorhus/execa/issues/433
      windowsHide: false
    });
    if (newAppServer.stdin) process.stdin.pipe(newAppServer.stdin, {
      end: true
    });
    if (newAppServer.stderr) newAppServer.stderr.pipe(process.stderr, {
      end: false
    });
    if (newAppServer.stdout) {
      newAppServer.stdout.pipe(new stream__namespace.PassThrough({
        transform(chunk, _, callback) {
          let str = chunk.toString();
          let matches = str && str.matchAll(/\[REMIX DEV\] ([A-f0-9]+) ready/g);
          if (matches) {
            for (let match of matches) {
              var _state$manifest;
              let buildHash = match[1];
              if (buildHash === ((_state$manifest = state.manifest) === null || _state$manifest === void 0 ? void 0 : _state$manifest.version)) {
                var _state$appReady;
                (_state$appReady = state.appReady) === null || _state$appReady === void 0 ? void 0 : _state$appReady.ok();
              }
            }
          }
          callback(null, chunk);
        }
      })).pipe(process.stdout, {
        end: false
      });
    }
    return newAppServer;
  };
  let dispose = await watch.watch({
    config: initialConfig,
    options: {
      mode: "development",
      sourcemap: true,
      onWarning: warnOnce.warnOnce,
      devHttpOrigin: httpOrigin,
      devWebSocketPort: options.webSocketPort
    }
  }, {
    onBuildStart: async ctx => {
      var _state$appReady2;
      (_state$appReady2 = state.appReady) === null || _state$appReady2 === void 0 ? void 0 : _state$appReady2.err();
      clean(ctx.config);
      websocket.log(state.prevManifest ? "Rebuilding..." : "Building...");
      state.hdr = hdr.detectLoaderChanges(ctx);
    },
    onBuildManifest: manifest => {
      state.manifest = manifest;
    },
    onBuildFinish: async (ctx, durationMs, succeeded) => {
      var _state$manifest2;
      if (!succeeded) return;
      websocket.log((state.prevManifest ? "Rebuilt" : "Built") + ` in ${prettyMs__default["default"](durationMs)}`);
      state.appReady = channel.create();
      let start = Date.now();
      console.log(`Waiting for app server (${(_state$manifest2 = state.manifest) === null || _state$manifest2 === void 0 ? void 0 : _state$manifest2.version})`);
      if (options.command && (state.appServer === undefined || options.restart)) {
        await kill(state.appServer);
        state.appServer = startAppServer(options.command);
      }
      let {
        ok
      } = await state.appReady.result;
      // result not ok -> new build started before this one finished. do not process outdated manifest
      let loaderHashes = await state.hdr;
      if (ok) {
        console.log(`App server took ${prettyMs__default["default"](Date.now() - start)}`);
        if (state.manifest && loaderHashes && state.prevManifest) {
          let updates = hmr.updates(ctx.config, state.manifest, state.prevManifest, loaderHashes, state.prevLoaderHashes);
          websocket.hmr(state.manifest, updates);
          let hdr = updates.some(u => u.revalidate);
          console.log("> HMR" + (hdr ? " + HDR" : ""));
        } else if (state.prevManifest !== undefined) {
          websocket.reload();
          console.log("> Live reload");
        }
      }
      state.prevManifest = state.manifest;
      state.prevLoaderHashes = loaderHashes;
    },
    onFileCreated: file => websocket.log(`File created: ${relativePath(file)}`),
    onFileChanged: file => websocket.log(`File changed: ${relativePath(file)}`),
    onFileDeleted: file => websocket.log(`File deleted: ${relativePath(file)}`)
  });
  let httpServer = express__default["default"]()
  // handle `broadcastDevReady` messages
  .use(express__default["default"].json()).post("/ping", (req, res) => {
    var _state$manifest3;
    let {
      buildHash
    } = req.body;
    if (typeof buildHash !== "string") {
      console.warn(`Unrecognized payload: ${req.body}`);
      res.sendStatus(400);
    }
    if (buildHash === ((_state$manifest3 = state.manifest) === null || _state$manifest3 === void 0 ? void 0 : _state$manifest3.version)) {
      var _state$appReady3;
      (_state$appReady3 = state.appReady) === null || _state$appReady3 === void 0 ? void 0 : _state$appReady3.ok();
    }
    res.sendStatus(200);
  }).listen(httpOrigin.port, () => {
    console.log("Remix dev server ready");
  });
  return new Promise(() => {}).finally(async () => {
    await kill(state.appServer);
    websocket.close();
    httpServer.close();
    await dispose();
  });
};
let clean = config => {
  try {
    fse__default["default"].emptyDirSync(config.relativeAssetsBuildDirectory);
  } catch {}
};
let relativePath = file => path__namespace.relative(process.cwd(), file);
let kill = async p => {
  if (p === undefined) return;
  let channel$1 = channel.create();
  p.on("exit", channel$1.ok);

  // https://github.com/nodejs/node/issues/12378
  if (process.platform === "win32") {
    await execa__default["default"]("taskkill", ["/pid", String(p.pid), "/f", "/t"]);
  } else {
    p.kill("SIGTERM", {
      forceKillAfterTimeout: 1_000
    });
  }
  await channel$1.result;
};

exports.serve = serve;
