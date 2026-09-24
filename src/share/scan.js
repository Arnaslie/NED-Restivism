// Camera QR scanning with the browser's built-in BarcodeDetector. No fallback here:
// where it is missing, the UI offers paste-the-code instead.

const POLL_MS = 200; // ~5 detections per second

export async function isScanSupported() {
  if (!('BarcodeDetector' in globalThis) || !navigator.mediaDevices?.getUserMedia) return false;
  try {
    const formats = await BarcodeDetector.getSupportedFormats();
    return formats.includes('qr_code');
  } catch {
    return false;
  }
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
    const detector = new BarcodeDetector({ formats: ['qr_code'] });

    async function poll() {
      if (stopped) return;
      try {
        if (video.readyState >= 2) {
          const codes = await detector.detect(video);
          const text = codes.find((c) => c.rawValue)?.rawValue;
          if (text && !stopped) {
            stopped = true;
            release();
            resolve(text);
            return;
          }
        }
      } catch {
        // A single failed frame is not fatal; try the next one.
      }
      if (!stopped) timer = setTimeout(poll, POLL_MS);
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(async (s) => {
        stream = s;
        if (stopped) return release();
        video.setAttribute('playsinline', '');
        video.muted = true;
        video.srcObject = s;
        await video.play();
        poll();
      })
      .catch((err) => {
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
