# Vendored code

Third-party code copied into the repo, reviewed and pinned (decision 0005). Do not edit these files by hand; re-vendor instead.

## qrcodegen.js: QR Code generator library by Project Nayuki

| | |
|---|---|
| Source | https://github.com/nayuki/QR-Code-generator, file `typescript-javascript/qrcodegen.ts` |
| Version | v1.8.0, commit `720f62bddb7226106071d4728c292cb1df519ceb` |
| License | MIT (header kept at the top of the file) |
| Upstream file SHA-256 | `c4749095a91bf9696e3a303998b9905e467094f53041e64393e65e6d887737fd` (`qrcodegen.ts`, 41025 bytes) |
| Vendored file SHA-256 | `522632fc1375202181c886f09dc37161e287c9f301afd2b7582ccdda1c2ccf4a` (`qrcodegen.js`, 33021 bytes) |

Why this one: encoder only (no decoder, no DOM, no network), no dependencies, widely used and carefully written, ~33 KB unminified.

### How it was converted
Upstream ships TypeScript only. The ES module was produced with Node 24.19.0's built-in transform (no npm packages), then wrapped. Other Node versions may format the output differently; the logic is the same:

```sh
curl -sSfLO https://raw.githubusercontent.com/nayuki/QR-Code-generator/720f62bddb7226106071d4728c292cb1df519ceb/typescript-javascript/qrcodegen.ts
node -e "const m=require('node:module'),fs=require('fs');fs.writeFileSync('out.js',m.stripTypeScriptTypes(fs.readFileSync('qrcodegen.ts','utf8'),{mode:'transform'}))"
# qrcodegen.js = upstream license header (lines 1-22) + a provenance comment + out.js
#              + `export const QrCode = qrcodegen.QrCode; export const QrSegment = qrcodegen.QrSegment;`
```

The transform removes types and comments and turns TypeScript namespaces into plain objects. It does not change any logic. Check any update by re-running these steps and comparing SHA-256 hashes. `test/share.test.js` checks the matrix output. Output was also decoded with macOS CoreImage at versions 7, 11 and 31.

## jsQR.js: jsQR, QR code reader by Cosmo Wolfe and contributors

Used by `src/share/scan.js` only when the browser has no `BarcodeDetector` for QR codes. Loaded with a dynamic `import()` so phones with a native detector never parse it (it is still precached for offline use).

| | |
|---|---|
| Source | npm package `jsqr@1.4.0`, file `dist/jsQR.js` (https://github.com/cozmo/jsQR, git head `49a9633931fb8030ac2fc9cecc121d6e5a19f9a3`) |
| Tarball | https://registry.npmjs.org/jsqr/-/jsqr-1.4.0.tgz, integrity `sha512-dxLob7q65Xg2DvstYkRpkYtmKm2sPJ9oFhrhmudT1dZvNFFTlroai3AWSpLey/w5vMcLBXRgOJsbXpdN9HzU/A==` (verified) |
| License | Apache-2.0, full text in `jsQR.LICENSE.txt` (the package's `LICENSE`, SHA-256 `c6596eb7be8581c18be736c846fb9173b69eccf6ef94c5135893ec56bd92ba08`) |
| Upstream file SHA-256 | `bc40c8a15196236b2314db0856f72ca0b49980cd5413b8c852a7349f5fee0859` (`dist/jsQR.js`, 256885 bytes) |
| Vendored file SHA-256 | `859999c6c8b71c9bc2f269c760943b5465b0d1c117e5d474163db051a5361fc1` (`jsQR.js`, 257430 bytes, ~57 KB gzipped) |

Reviewed for CSP and privacy: no `eval`/`Function`, no network, storage or DOM access. It is a pure function over RGBA pixels.

### How it was converted
The upstream file is copied byte for byte between a header and footer. The webpack UMD wrapper then finds a CommonJS `module` and exports through it:

```js
/* license/provenance comment */
const umd = { exports: {} };
(function (module, exports, define) {
// ... dist/jsQR.js, unmodified ...
}).call(undefined, umd, umd.exports, undefined);

export default umd.exports;
```

Known upstream quirk: `jsQR()` writes the options it is given into its shared defaults. `scan.js` always passes the same options, so this has no effect here.
