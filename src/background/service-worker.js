// SmartRecorder Service Worker v1.0.1 - Robust Edition
console.log('SmartRecorder Service Worker Loaded [v1.0.1]');

let isRecording = false;

// 오프스크린 문서 생성 및 준비
async function setupOffscreen() {
    try {
        if (await chrome.offscreen.hasDocument()) return;
        console.log('Creating offscreen document...');
        await chrome.offscreen.createDocument({
            url: 'src/offscreen/offscreen.html',
            reasons: ['USER_MEDIA'],
            justification: 'Recording screen in background'
        });
    } catch (e) {
        console.error('Failed to setup offscreen:', e);
    }
}

// 오프스크린에 메시지를 안전하게 보내는 함수
async function sendToOffscreen(message) {
    try {
        await setupOffscreen();
        // 메시지 전송 (응답 대기 없음)
        await chrome.runtime.sendMessage(message);
        console.log('Message sent to offscreen:', message.type);
    } catch (e) {
        console.warn('Offscreen message failed (likely not ready), retrying in 500ms...');
        await new Promise(r => setTimeout(r, 500));
        try {
            await chrome.runtime.sendMessage(message);
        } catch (retryError) {
            console.error('Final attempt to send message failed:', retryError);
        }
    }
}

// 사용자에게 탭/화면 선택창을 띄우고 스트림 ID를 가져옴
async function startCaptureFlow() {
    try {
        // 활성화된 탭 정보 가져오기 (없을 경우 대비)
        const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        const targetTab = tabs.length > 0 ? tabs[0] : null;
        
        console.log('Requesting desktop capture...');
        chrome.desktopCapture.chooseDesktopMedia(['tab', 'screen', 'window'], targetTab, async (streamId) => {
            if (!streamId) {
                console.log('Capture cancelled or failed');
                return;
            }
            
            console.log('Stream ID obtained:', streamId);
            isRecording = true;
            await sendToOffscreen({ 
                type: 'START_RECORDING', 
                streamId: streamId,
                delay: 2000 
            });
        });
    } catch (e) {
        console.error('Error in capture flow:', e);
    }
}

// 단축키 핸들러
chrome.commands.onCommand.addListener(async (command) => {
    console.log('Command Triggered:', command);
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
chrome.runtime.onMessage.addListener((message) => {
    console.log('Internal Message:', message.type);
    if (message.type === 'START_RECORDING') {
        if (!isRecording) startCaptureFlow();
    } else if (message.type === 'STOP_RECORDING') {
        sendToOffscreen({ type: 'STOP_RECORDING' });
        isRecording = false;
    }
    return true;
});
