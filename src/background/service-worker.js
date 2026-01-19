// 서비스 워커(Service Worker) - 녹화 세션 및 시그널 관리
let isRecording = false;

// 오프스크린 문서 생성 및 준비
async function setupOffscreen() {
    if (await chrome.offscreen.hasDocument()) return;
    await chrome.offscreen.createDocument({
        url: 'src/offscreen/offscreen.html',
        reasons: ['USER_MEDIA'],
        justification: 'Recording screen in background'
    });
}

// 사용자에게 탭/화면 선택창을 띄우고 스트림 ID를 가져옴
async function startCaptureFlow() {
    await setupOffscreen();
    
    // 현재 활성화된 탭에서 캡처 창 띄우기
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    
    chrome.desktopCapture.chooseDesktopMedia(['tab', 'screen', 'window'], tab, (streamId) => {
        if (!streamId) {
            console.log('Capture cancelled by user');
            return;
        }
        
        console.log('Stream ID obtained:', streamId);
        isRecording = true;
        // 오프스크린으로 캡처 시작 명령 전송
        chrome.runtime.sendMessage({ 
            type: 'START_RECORDING', 
            streamId: streamId,
            delay: 2000 // 무흔적을 위한 2초 지연
        });
    });
}

// 단축키 핸들러
chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'toggle-record') {
        if (!isRecording) {
            await startCaptureFlow();
        } else {
            chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
            isRecording = false;
        }
    }
});

// 외부 메시지 릴레이 (팝업 또는 컨텐츠 스크립트로부터)
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'START_RECORDING') {
        if (!isRecording) await startCaptureFlow();
    } else if (message.type === 'STOP_RECORDING') {
        chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
        isRecording = false;
    }
});
