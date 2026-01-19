// Content script to bridge the web page and extension
const channel = new BroadcastChannel('smart-recorder-sync');

channel.onmessage = (e) => {
  if (e.data.type === 'START_RECORDING' || e.data.type === 'STOP_RECORDING') {
    chrome.runtime.sendMessage(e.data);
  }
};

// [Visual Feedback] 화면에 잠시 나타났다 사라지는 토스트 메시지
function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 2147483647;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 16px;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        pointer-events: none;
        transition: opacity 0.3s ease;
        text-align: center;
        min-width: 300px;
        border: 1px solid rgba(255,255,255,0.2);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    // 등장 애니메이션
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, duration);
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SHOW_TOAST') {
        showToast(message.text);
    }
});
