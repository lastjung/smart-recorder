// 서비스 워커(Service Worker) - 녹화 세션 및 시그널 관리
let isRecording = false;
let offscreenReady = false;

// 오프스크린 문서 생성 및 준비
async function setupOffscreen() {
    if (await chrome.offscreen.hasDocument()) return;
    
    console.log('Creating offscreen document...');
    await chrome.offscreen.createDocument({
        url: 'src/offscreen/offscreen.html',
        reasons: ['USER_MEDIA'],
        justification: 'Recording screen in background'
    });
}

// 오프스크린에 메시지를 안전하게 보내는 함수 (준비될 때까지 재시도)
async function sendToOffscreen(message) {
    await setupOffscreen();
    
    // 오프스크린이 메시지를 받을 준비가 되었는지 루프로 확인
    let attempts = 0;
    while (attempts < 10) {
        try {
            await chrome.runtime.sendMessage(message);
            console.log('Message sent successfully:', message.type);
            return;
        } catch (e) {
            console.warn('Offscreen not ready, retrying...', attempts);
            await new Promise(r => setTimeout(r, 200));
            attempts++;
        }
    }
    console.error('Failed to send message to offscreen after 10 attempts');
}

// 사용자에게 탭/화면 선택창을 띄우고 스트림 ID를 가져옴
async function startCaptureFlow() {
    // 현재 활성화된 탭에서 캡처 창 띄우기
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    
    chrome.desktopCapture.chooseDesktopMedia(['tab', 'screen', 'window'], tab, async (streamId) => {
        if (!streamId) {
            console.log('Capture cancelled by user');
            return;
        }
        
        console.log('Stream ID obtained:', streamId);
        isRecording = true;
        // 오프스크린으로 캡처 시작 명령 전송
        await sendToOffscreen({ 
            type: 'START_RECORDING', 
            streamId: streamId,
            delay: 2000 
        });
    });
}

// 단축키 핸들러
chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'toggle-record') {
        if (!isRecording) {
            await startCaptureFlow();
        } else {
            await sendToOffscreen({ type: 'STOP_RECORDING' });
            isRecording = false;
        }
    }
});

// 외부 메시지 릴레이
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'START_RECORDING') {
        if (!isRecording) await startCaptureFlow();
    } else if (message.type === 'STOP_RECORDING') {
        await sendToOffscreen({ type: 'STOP_RECORDING' });
        isRecording = false;
    }
});
