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
