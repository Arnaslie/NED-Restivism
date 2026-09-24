// Renders QR text as an SVG. Paths and presentation attributes only (no style attributes,
// CSP style-src 'self'); size it with CSS, e.g. `.qr { width: min(80vw, 22rem); }`.

import { QrCode } from '../vendor/qrcodegen.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const QUIET_ZONE = 4; // modules of light border required by the QR spec

// Pure part, testable without a DOM: -> { size, d } where size includes the quiet zone
// and d is one path of 1x1 squares, one per dark module.
export function qrPath(text) {
  const qr = QrCode.encodeText(text, QrCode.Ecc.MEDIUM);
  let d = '';
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.getModule(x, y)) d += `M${x + QUIET_ZONE},${y + QUIET_ZONE}h1v1h-1z`;
    }
  }
  return { size: qr.size + QUIET_ZONE * 2, d, version: qr.version };
}

export function renderQR(text) {
  const { size, d } = qrPath(text);
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('class', 'qr');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'QR code');
  svg.setAttribute('shape-rendering', 'crispEdges');

  // Always black on white, whatever the colour scheme: scanners need the contrast.
  const bg = document.createElementNS(SVG_NS, 'path');
  bg.setAttribute('d', `M0,0h${size}v${size}h-${size}z`);
  bg.setAttribute('fill', '#fff');
  const fg = document.createElementNS(SVG_NS, 'path');
  fg.setAttribute('d', d);
  fg.setAttribute('fill', '#000');

  svg.append(bg, fg);
  return svg;
}
