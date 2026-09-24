const status = document.getElementById('status');

function renderStatus() {
  status.textContent = navigator.onLine ? 'Online' : 'Offline';
}

window.addEventListener('online', renderStatus);
window.addEventListener('offline', renderStatus);
renderStatus();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((err) => {
    console.error('Service worker registration failed:', err);
  });
}
