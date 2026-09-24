// Camera QR scanning. Uses the browser's BarcodeDetector when it supports QR codes,
// otherwise draws frames to an offscreen canvas and decodes them with vendored jsQR.

const POLL_MS = 200; // ~5 attempts per second
const MAX_FRAME_PX = 640; // downscale frames for jsQR so low-end phones keep up

export async function isScanSupported() {
  return Boolean(globalThis.navigator?.mediaDevices?.getUserMedia);
}

async function nativeDetectorSupported() {
  if (!('BarcodeDetector' in globalThis)) return false;
  try {
    return (await BarcodeDetector.getSupportedFormats()).includes('qr_code');
  } catch {
    return false;
  }
}

// -> async (video) => text | null
async function makeDetector() {
  if (await nativeDetectorSupported()) {
    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    return async (video) => (await detector.detect(video)).find((c) => c.rawValue)?.rawValue || null;
  }
  const { default: jsQR } = await import('../vendor/jsQR.js');
  const canvas = document.createElement('canvas'); // never attached to the page
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  return async (video) => {
    const scale = Math.min(1, MAX_FRAME_PX / Math.max(video.videoWidth, video.videoHeight));
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    if (!w || !h) return null;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);
    // Our QR codes are always dark on light, so skip the inverted pass (halves the work).
    return jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' })?.data || null;
  };
}

// -> { result: Promise<string>, stop() }. `result` resolves with the first QR text seen,
// or rejects (camera denied, or Error('Scan stopped') if stop() is called first).
// The camera is released when a code is found, on error, and on stop().
export function startScan(video) {
  let stopped = false;
  let stream = null;
  let timer = null;
  let rejectResult = () => {};

  function release() {
    clearTimeout(timer);
    if (stream) stream.getTracks().forEach((track) => track.stop());
    stream = null;
    video.pause();
    video.srcObject = null;
  }

  const result = new Promise((resolve, reject) => {
    rejectResult = reject;

    async function run() {
      const detect = await makeDetector();
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      stream = s;
      if (stopped) return release();
      video.setAttribute('playsinline', '');
      video.muted = true;
      video.srcObject = s;
      await video.play();

      async function poll() {
        if (stopped) return;
        try {
          const text = video.readyState >= 2 ? await detect(video) : null;
          if (text && !stopped) {
            stopped = true;
            release();
            resolve(text);
            return;
          }
        } catch {
          // A single failed frame is not fatal; try the next one.
        }
        if (!stopped) timer = setTimeout(poll, POLL_MS);
      }
      poll();
    }

    run().catch((err) => {
      if (stopped) return;
      stopped = true;
      release();
      reject(err);
    });
  });
  result.catch(() => {}); // callers that never await `result` should not see an unhandled rejection

  return {
    result,
    stop() {
      if (stopped) return;
      stopped = true;
      release();
      rejectResult(new Error('Scan stopped'));
    },
  };
}
