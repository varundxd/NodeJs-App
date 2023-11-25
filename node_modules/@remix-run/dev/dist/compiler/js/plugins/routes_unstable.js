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

var fs = require('node:fs');
var path = require('node:path');
var routesConvention = require('../../../config/routesConvention.js');
var create = require('../../../transform/create.js');
var loaders = require('../../utils/loaders.js');
var hmr = require('./hmr.js');
var mdx = require('../../plugins/mdx.js');

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

var fs__namespace = /*#__PURE__*/_interopNamespace(fs);
var path__namespace = /*#__PURE__*/_interopNamespace(path);

const serverOnlyExports = new Set(["action", "loader"]);
let removeServerExports = () => create.create(({
  types: t
}) => {
  return {
    visitor: {
      ExportNamedDeclaration: path => {
        let {
          node
        } = path;
        if (node.source) {
          let specifiers = node.specifiers.filter(({
            exported
          }) => {
            let name = t.isIdentifier(exported) ? exported.name : exported.value;
            return !serverOnlyExports.has(name);
          });
          if (specifiers.length === node.specifiers.length) return;
          if (specifiers.length === 0) return path.remove();
          path.replaceWith(t.exportNamedDeclaration(node.declaration, specifiers, node.source));
        }
        if (t.isFunctionDeclaration(node.declaration)) {
          var _node$declaration$id;
          let name = (_node$declaration$id = node.declaration.id) === null || _node$declaration$id === void 0 ? void 0 : _node$declaration$id.name;
          if (!name) return;
          if (serverOnlyExports.has(name)) return path.remove();
        }
        if (t.isVariableDeclaration(node.declaration)) {
          let declarations = node.declaration.declarations.filter(d => {
            let name = t.isIdentifier(d.id) ? d.id.name : undefined;
            if (!name) return false;
            return !serverOnlyExports.has(name);
          });
          if (declarations.length === 0) return path.remove();
          if (declarations.length === node.declaration.declarations.length) return;
          path.replaceWith(t.variableDeclaration(node.declaration.kind, declarations));
        }
      }
    }
  };
});

/**
 * This plugin loads route modules for the browser build, using module shims
 * that re-export only the route module exports that are safe for the browser.
 */
function browserRouteModulesPlugin({
  config,
  options
}, routeModulePaths) {
  return {
    name: "browser-route-modules",
    async setup(build) {
      let [xdm, {
        default: remarkFrontmatter
      }] = await Promise.all([import('xdm'), import('remark-frontmatter')]);
      build.onResolve({
        filter: /.*/
      }, args => {
        // We have to map all imports from route modules back to the virtual
        // module in the graph otherwise we will be duplicating portions of
        // route modules across the build.
        let routeModulePath = routeModulePaths.get(args.path);
        if (!routeModulePath && args.resolveDir && args.path.startsWith(".")) {
          let lookup = resolvePath(path__namespace.join(args.resolveDir, args.path));
          routeModulePath = routeModulePaths.get(lookup);
        }
        if (!routeModulePath) return;
        return {
          path: routeModulePath,
          namespace: "browser-route-module"
        };
      });
      let cache = new Map();
      build.onLoad({
        filter: /.*/,
        namespace: "browser-route-module"
      }, async args => {
        let file = args.path;
        let routeFile = path__namespace.resolve(config.appDirectory, file);
        if (/\.mdx?$/.test(file)) {
          var _mdxResult$errors;
          let mdxResult = await mdx.processMDX(xdm, remarkFrontmatter, config, args.path, routeFile);
          if (!mdxResult.contents || (_mdxResult$errors = mdxResult.errors) !== null && _mdxResult$errors !== void 0 && _mdxResult$errors.length) {
            return mdxResult;
          }
          let transform = removeServerExports();
          mdxResult.contents = transform(mdxResult.contents,
          // Trick babel into allowing JSX syntax.
          args.path + ".jsx");
          return mdxResult;
        }
        let sourceCode = fs__namespace.readFileSync(routeFile, "utf8");
        let value = cache.get(file);
        if (!value || value.sourceCode !== sourceCode) {
          let transform = removeServerExports();
          let contents = transform(sourceCode, routeFile);
          if (options.mode === "development" && config.future.unstable_dev) {
            contents = await hmr.applyHMR(contents, {
              ...args,
              path: routeFile
            }, config, !!build.initialOptions.sourcemap);
          }
          value = {
            sourceCode,
            output: {
              contents,
              loader: loaders.getLoaderForFile(routeFile),
              resolveDir: path__namespace.dirname(routeFile)
            }
          };
          cache.set(file, value);
        }
        return value.output;
      });
    }
  };
}
function resolvePath(path) {
  if (fs__namespace.existsSync(path) && fs__namespace.statSync(path).isFile()) {
    return path;
  }
  for (let ext of routesConvention.routeModuleExts) {
    let withExt = path + ext;
    if (fs__namespace.existsSync(withExt) && fs__namespace.statSync(withExt).isFile()) {
      return withExt;
    }
  }
  return path;
}

exports.browserRouteModulesPlugin = browserRouteModulesPlugin;
