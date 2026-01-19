// SmartRecorder Service Worker v1.0.2 [FINALIZE]
// 이 로그가 보인다면 최신 버전이 로드된 것입니다.
console.error('--- SmartRecorder SW v1.0.2 Booted ---');

// 상태 관리 (localStorage 기반)
async function getRecordingState() {
    try {
        const data = await chrome.storage.local.get('isRecording');
        console.log('[SW] Current State:', !!data.isRecording);
        return !!data.isRecording;
    } catch (e) {
        console.error('[SW] State Load Error:', e);
        return false;
    }
}

async function setRecordingState(state) {
    try {
        await chrome.storage.local.set({ isRecording: state });
        console.log('[SW] State Saved:', state);
    } catch (e) {
        console.error('[SW] State Save Error:', e);
    }
}

// 오프스크린 준비
async function ensureOffscreen() {
    try {
        if (await chrome.offscreen.hasDocument()) return true;
        console.log('[SW] Creating Offscreen...');
        await chrome.offscreen.createDocument({
            url: 'src/offscreen/offscreen.html',
            reasons: ['USER_MEDIA'],
            justification: 'Background screen recording'
        });
        return true;
    } catch (e) {
        console.error('[SW] Offscreen Setup Fail:', e);
        return false;
    }
}

// 메시지 전송 (오프스크린 전용)
async function dispatchToOffscreen(message) {
    const ready = await ensureOffscreen();
    if (!ready) {
        console.error('[SW] Cannot dispatch: Offscreen not ready');
        return;
    }
    
    // 메시지 릴레이 (응답 대기 없음)
    chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
            console.warn('[SW] Message relay warning (normal if no active listener):', chrome.runtime.lastError.message);
        } else {
            console.log('[SW] Relay Success:', message.type);
        }
    });
}

// 캡처 흐름 시작
async function initiateCapture() {
    try {
        console.error('[SW] Initiating Capture Flow...');
        const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        const currentTab = tabs[0];

        chrome.desktopCapture.chooseDesktopMedia(['tab', 'screen', 'window'], currentTab, async (streamId) => {
            if (!streamId) {
                console.error('[SW] Capture Access Denied or Cancelled');
                return;
            }
            
            console.error('[SW] StreamID Received:', streamId);
            await setRecordingState(true);
            await dispatchToOffscreen({ 
                type: 'START_RECORDING', 
                streamId: streamId,
                delay: 2000 
            });
        });
    } catch (e) {
        console.error('[SW] Critical Capture Error:', e);
    }
}

// [1] 명령(단축키) 리스너 - 동기 리스너 패턴
chrome.commands.onCommand.addListener((command) => {
    console.error('[SW] Command Recv:', command);
    if (command === 'toggle-record') {
        processToggle();
    }
});

async function processToggle() {
    const active = await getRecordingState();
    if (!active) {
        await initiateCapture();
    } else {
        console.error('[SW] Stopping Recording...');
        await dispatchToOffscreen({ type: 'STOP_RECORDING' });
        await setRecordingState(false);
    }
}

// [2] 메시지(내부) 리스너 - 비동기 채널 유지 패턴
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[SW] Internal Sync Message:', message.type);
    
    if (message.type === 'START_RECORDING') {
        getRecordingState().then(active => {
            if (!active) initiateCapture();
        });
        sendResponse({ ack: true });
    } else if (message.type === 'STOP_RECORDING') {
        dispatchToOffscreen({ type: 'STOP_RECORDING' });
        setRecordingState(false);
        sendResponse({ ack: true });
    }
    return true; // Keep channel open for async
});
