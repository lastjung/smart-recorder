// Content script to bridge the web page and extension
const channel = new BroadcastChannel('smart-recorder-sync');

channel.onmessage = (e) => {
  if (e.data.type === 'START_RECORDING' || e.data.type === 'STOP_RECORDING') {
    chrome.runtime.sendMessage(e.data);
  }
};

let currentToast = null;

// [Visual Feedback] 화면에 Chrome Native Bar 스타일의 영구 컨트롤 바 표시
function showRecordingBar() {
    if (currentToast) return; // 이미 있으면 무시

    const bar = document.createElement('div');
    bar.id = 'sr-native-bar';
    // Chrome Native Bar와 유사한 스타일 (흰색, 둥근 모서리, 미묘한 그림자)
    bar.style.cssText = `
        position: fixed;
        top: 12px;
        left: 50%;
        transform: translateX(-50%) translateY(-150%);
        background-color: #ffffff;
        color: #3c4043;
        padding: 8px 16px;
        border-radius: 999px;
        z-index: 2147483647;
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 1px 3px rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        border: 1px solid #dadce0;
        pointer-events: auto;
    `;

    // 텍스트: "Recording this tab..."
    const textSpan = document.createElement('span');
    textSpan.innerHTML = `
        <span style="display:inline-block; width:8px; height:8px; background:#ef4444; border-radius:50%; margin-right:6px; vertical-align:middle; animation:sr-pulse 1.5s infinite;"></span>
        Sharing this tab to SmartRecorder
    `;

    // 버튼: [Stop sharing] (Blue Style)
    const stopBtn = document.createElement('button');
    stopBtn.innerText = 'Stop sharing';
    stopBtn.style.cssText = `
        background-color: #1a73e8;
        color: white;
        border: none;
        padding: 6px 16px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s;
    `;
    stopBtn.onmouseover = () => stopBtn.style.backgroundColor = '#1557b0';
    stopBtn.onmouseout = () => stopBtn.style.backgroundColor = '#1a73e8';
    
    // 동작: 클릭 시 STOP 전송
    stopBtn.onclick = () => {
        chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
        hideRecordingBar(); // 즉시 숨김
    };

    bar.appendChild(textSpan);
    bar.appendChild(stopBtn);
        
    // 애니메이션 스타일 주입
    const style = document.createElement('style');
    style.textContent = `
        @keyframes sr-pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    `;
    bar.appendChild(style);

    document.body.appendChild(bar);
    currentToast = bar;

    // Slide Down Animation
    requestAnimationFrame(() => {
        bar.style.transform = 'translateX(-50%) translateY(0)';
    });
}

function hideRecordingBar() {
    if (currentToast) {
        currentToast.style.transform = 'translateX(-50%) translateY(-150%)';
        const el = currentToast;
        currentToast = null;
        setTimeout(() => {
            if (document.body.contains(el)) document.body.removeChild(el);
        }, 500);
    }
}

// 일회성 토스트 (기존 알림용)
function showToast(message) {
    // 녹화 중 바가 떠있으면 토스트는 무시하거나 하단에 표시 (여기서는 간단히 무시 or 덮어쓰기 방지)
    if (message.includes('Recording in 2s')) {
        // 준비 알림 -> 바 표시
        showRecordingBar();
    } else if (message.includes('STOP COMMAND')) {
        hideRecordingBar();
        // 종료 알림은 별도 토스트로 띄울 수도 있음
    }
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SHOW_TOAST') {
        // 메시지 내용에 따라 동작 분기
        if (message.text.includes('Recording in 2s')) {
            showRecordingBar(); // 바 생성
        } else if (message.text.includes('STOP')) {
            hideRecordingBar();
            // 필요하다면 "Saved" 토스트만 잠깐 띄움
        } else if (message.text.includes('Saved')) {
            // 저장 완료 알림은 잠깐 보여줌 (바가 없을 때)
            // ... (기존 showToast 로직 재활용 가능하나 여기선 생략하고 바 제거에 집중)
        }
    }
});
