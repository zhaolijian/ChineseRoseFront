#!/usr/bin/env node
// Patches vue-tsc to support TypeScript 5.9's tsc shim structure.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const target = resolve(__dirname, '../../node_modules/vue-tsc/bin/vue-tsc.js')

let source
try {
  source = readFileSync(target, 'utf8')
} catch (error) {
  console.warn('[patch] vue-tsc not found, skip shim patch')
  process.exit(0)
}

const insertRealPath = "const tscPath = require.resolve('typescript/lib/tsc');\nconst realTscPath = tryResolve('typescript/lib/_tsc');\nconst proxyApiPath = require.resolve('../out/index');"
source = source.replace(
  "const tscPath = require.resolve('typescript/lib/tsc');\nconst proxyApiPath = require.resolve('../out/index');",
  insertRealPath
)

const helper = "const { state } = require('../out/shared');\n\nfunction tryResolve(id) {\n\ttry {\n\t\treturn require.resolve(id);\n\t}\n\tcatch (_error) {\n\t\treturn undefined;\n\t}\n}\n"
source = source.replace(
  "const { state } = require('../out/shared');\n",
  helper
)

const patchedReadFile =
"fs.readFileSync = (...args) => {\n\tconst filename = args[0];\n\tif (filename === tscPath || (realTscPath && filename === realTscPath)) {\n\t\tlet tsc = readFileSync(...args);\n\t\tif (!tsc.includes('supportedTSExtensions')) {\n\t\t\treturn tsc;\n\t\t}\n\n\t\t// add *.vue files to allow extensions"

source = source.replace(
  "fs.readFileSync = (...args) => {\n\tif (args[0] === tscPath) {\n\t\tlet tsc = readFileSync(...args);\n\n\t\t// add *.vue files to allow extensions",
  patchedReadFile
)

if (!source.includes('{ optional: true }')) {
  const blockRegex = /\t\t\/\/ patches logic for checking root file extension in build program for incremental builds[\s\S]+?\t\tif \(semver\.gte\(tsPkg\.version, '5\.0\.4'\)\) {\n\t\t\ttryReplace\([\s\S]+?\n\t\t}\n/
  const patchedBlock =
    "\t\t// patches logic for checking root file extension in build program for incremental builds\n" +
    "\t\tif (semver.gt(tsPkg.version, '5.0.0')) {\n" +
    "\t\t\ttryReplace(\n" +
    "\t\t\t\t`for (const existingRoot of buildInfoVersionMap.roots) {`,\n" +
    "\t\t\t\t`for (const existingRoot of buildInfoVersionMap.roots\n" +
    "\t\t\t\t\t.filter(file => !file.toLowerCase().includes('__vls_'))\n" +
    "\t\t\t\t\t.map(file => file.replace(/\\.vue\\.(j|t)sx?$/i, '.vue'))\n" +
    "\t\t\t\t) {`,\n" +
    "\t\t\t\t{ optional: true }\n" +
    "\t\t\t);\n" +
    "\t\t\ttryReplace(\n" +
    "\t\t\t\t`return [toFileId(key), toFileIdListId(state.exportedModulesMap.getValues(key))];`, \n" +
    "\t\t\t\t`return [toFileId(key), toFileIdListId(new Set(arrayFrom(state.exportedModulesMap.getValues(key)).filter(file => file !== void 0)))];`,\n" +
    "\t\t\t\t{ optional: true }\n" +
    "\t\t\t);\n" +
    "\t\t}\n" +
    "\t\tif (semver.gte(tsPkg.version, '5.0.4')) {\n" +
    "\t\t\ttryReplace(\n" +
    "\t\t\t\t`return createBuilderProgramUsingProgramBuildInfo(buildInfo, buildInfoPath, host);`,\n" +
    "\t\t\t\ts => `buildInfo.program.fileNames = buildInfo.program.fileNames\n" +
    "\t\t\t\t\t.filter(file => !file.toLowerCase().includes('__vls_'))\n" +
    "\t\t\t\t\t.map(file => file.replace(/\\.vue\\.(j|t)sx?$/i, '.vue'));\n" +
    "\t\t\t\t` + s,\n" +
    "\t\t\t\t{ optional: true }\n" +
    "\t\t\t);\n" +
    "\t\t}\n"
  source = source.replace(blockRegex, patchedBlock)
}

if (!source.includes('options = {}')) {
  const originalTryReplace = "\t\tfunction tryReplace(search, replace) {\n\t\t\tconst before = tsc;\n\t\t\ttsc = tsc.replace(search, replace);\n\t\t\tconst after = tsc;\n\t\t\tif (after === before) {\n\t\t\t\tthrow 'Search string not found: ' + JSON.stringify(search.toString());\n\t\t\t}\n\t\t}\n"
  const patchedTryReplace = "\t\tfunction tryReplace(search, replace, options = {}) {\n\t\t\tconst before = tsc;\n\t\t\ttsc = tsc.replace(search, replace);\n\t\t\tconst after = tsc;\n\t\t\tif (after === before) {\n\t\t\t\tif (options.optional) {\n\t\t\t\t\treturn;\n\t\t\t\t}\n\t\t\t\tthrow 'Search string not found: ' + JSON.stringify(search.toString());\n\t\t\t}\n\t\t}\n"
  source = source.replace(originalTryReplace, patchedTryReplace)
}

writeFileSync(target, source, 'utf8')
console.info('[patch] Patched vue-tsc shim detection for TypeScript 5.9')
