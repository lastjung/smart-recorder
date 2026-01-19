// Content script to bridge the web page and extension
const channel = new BroadcastChannel('smart-recorder-sync');

channel.onmessage = (e) => {
  if (e.data.type === 'START_RECORDING' || e.data.type === 'STOP_RECORDING') {
    chrome.runtime.sendMessage(e.data);
  }
};

// [Overlay UI Logic]
let overlayElement = null;

function createOverlay() {
  if (overlayElement) return;

  const div = document.createElement('div');
  div.id = 'smart-recorder-overlay';
  div.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 40px;
    background: #ef4444;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2147483647;
    font-family: system-ui, sans-serif;
    font-weight: bold;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    pointer-events: auto;
  `;

  div.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px;">
        <span style="display:inline-block; width:10px; height:10px; background:white; border-radius:50%; animation: pulse 1.5s infinite;"></span>
        <span>Recording...</span>
        <button id="sr-stop-btn" style="
            margin-left: 15px;
            background: white;
            color: #ef4444;
            border: none;
            padding: 4px 12px;
            border-radius: 4px;
            font-weight: 800;
            cursor: pointer;
            text-transform: uppercase;
            font-size: 12px;
        ">Stop & Save (Cmd+Shift+U)</button>
    </div>
    <style>
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
    </style>
  `;

  document.body.appendChild(div);
  overlayElement = div;

  document.getElementById('sr-stop-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
  });
}

function removeOverlay() {
  if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
  }
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SHOW_OVERLAY') {
        createOverlay();
    } else if (message.type === 'HIDE_OVERLAY') {
        removeOverlay();
    }
});
