// Content script to bridge the web page and extension
const channel = new BroadcastChannel('smart-recorder-sync');

channel.onmessage = (e) => {
  if (e.data.type === 'START_RECORDING' || e.data.type === 'STOP_RECORDING') {
    chrome.runtime.sendMessage(e.data);
  }
};

let currentBar = null;

// [Visual Feedback] 화면에 Chrome Native Bar 스타일의 영구 컨트롤 바 표시
function showRecordingBar() {
    if (currentBar) return; // 이미 있으면 무시

    const bar = document.createElement('div');
    bar.id = 'sr-native-bar';
    // Chrome Native Bar와 유사한 스타일 (흰색, 둥근 모서리, 미묘한 그림자)
    bar.style.cssText = `
        position: fixed;
        top: 0px;
        left: 50%;
        transform: translateX(-50%) translateY(-100%);
        background-color: #ffffff;
        color: #3c4043;
        padding: 0px 16px;
        height: 48px;
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
        z-index: 2147483647;
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        font-weight: 400;
        box-shadow: 0 4px 8px rgba(60,64,67,0.15);
        display: flex;
        align-items: center;
        gap: 16px;
        transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        border: 1px solid #dadce0;
        border-top: none;
        pointer-events: auto;
    `;

    // 텍스트 & 아이콘
    const textSpan = document.createElement('div');
    textSpan.style.display = 'flex';
    textSpan.style.alignItems = 'center';
    textSpan.innerHTML = `
        <div style="width:20px; height:20px; margin-right:12px; display:flex; align-items:center; justify-content:center;">
             <svg focusable="false" viewBox="0 0 24 24" aria-hidden="true" style="fill:#1a73e8; width:20px; height:20px;"><path d="M9 16h6.5a2.5 2.5 0 0 0 2.5-2.5V3h-11v10.5A2.5 2.5 0 0 0 9 16m0-11h6.5v8.5H9V5m-7 8v2h2v4h16v-4h2v-2H2m4 6v-4h12v4H6"></path></svg>
        </div>
        <span>Sharing this tab to SmartRecorder</span>
    `;

    // 버튼: [Stop sharing] (Blue Style)
    const stopBtn = document.createElement('button');
    stopBtn.innerText = 'Stop sharing';
    stopBtn.style.cssText = `
        background-color: #1a73e8;
        color: white;
        border: none;
        padding: 8px 24px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
        margin-left: 8px;
    `;
    stopBtn.onmouseover = () => stopBtn.style.backgroundColor = '#1557b0';
    stopBtn.onmouseout = () => stopBtn.style.backgroundColor = '#1a73e8';
    
    // 동작: 클릭 시 STOP 전송
    stopBtn.onclick = () => {
        chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
        stopBtn.innerText = 'Stopping...';
        stopBtn.style.backgroundColor = '#5f6368';
        // 애니메이션은 service worker 응답 후 처리
    };

    bar.appendChild(textSpan);
    bar.appendChild(stopBtn);
        
    document.body.appendChild(bar);
    currentBar = bar;

    // Slide Down Animation
    requestAnimationFrame(() => {
        bar.style.transform = 'translateX(-50%) translateY(0)';
    });
}

function hideRecordingBar() {
    if (currentBar) {
        currentBar.style.transform = 'translateX(-50%) translateY(-100%)';
        const el = currentBar;
        currentBar = null;
        setTimeout(() => {
            if (document.body.contains(el)) document.body.removeChild(el);
        }, 300);
    }
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SHOW_TOAST') {
        // 메시지 텍스트에 따라 UI 제어
        if (message.text.includes('Recording in')) {
            showRecordingBar();
        } else if (message.text.includes('STOP') || message.text.includes('Saved')) {
            hideRecordingBar();
        }
    }
});
