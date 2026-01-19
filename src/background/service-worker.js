// SmartRecorder Service Worker v1.0.3 [FINAL_STABLE]
console.error('--- SmartRecorder SW v1.0.3 Booted ---');

// 상태 관리 (localStorage 기반)
async function getRecordingState() {
    try {
        const data = await chrome.storage.local.get('isRecording');
        return !!data.isRecording;
    } catch (e) {
        return false;
    }
}

async function setRecordingState(state) {
    try {
        await chrome.storage.local.set({ isRecording: state });
        console.error('[SW] State Saved:', state);
    } catch (e) {
        console.error('[SW] State Save Error:', e);
    }
}

// 오프스크린 준비 (지연 로직 추가)
async function ensureOffscreen() {
    try {
        if (await chrome.offscreen.hasDocument()) return true;
        
        console.error('[SW] Creating Offscreen Document...');
        await chrome.offscreen.createDocument({
            url: 'src/offscreen/offscreen.html',
            reasons: ['USER_MEDIA'],
            justification: 'Background screen recording'
        });
        
        // 중요: 오프스크린 스크립트가 로드될 시간을 충분히 줌
        await new Promise(r => setTimeout(r, 700));
        return true;
    } catch (e) {
        console.error('[SW] Offscreen Setup Fail:', e);
        return false;
    }
}

// 메시지 전송 (안전한 릴레이)
async function dispatchToOffscreen(message) {
    const ready = await ensureOffscreen();
    if (!ready) {
        console.error('[SW] Message Dispatch Failed: Offscreen not ready');
        return;
    }
    
    chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
            console.error('[SW] Offscreen relay notice:', chrome.runtime.lastError.message);
        } else {
            console.error('[SW] Message Relayed:', message.type);
        }
    });
}

// 캡처 흐름
async function initiateCapture() {
    try {
        console.error('[SW] Requesting Capture Tab (YouTube Mode)...');
        const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (!tabs[0]) {
            console.error('[SW] No active tab found');
            return;
        }

        chrome.desktopCapture.chooseDesktopMedia(['tab', 'screen', 'window'], tabs[0], async (streamId) => {
            if (!streamId) {
                console.error('[SW] User cancelled capture');
                return;
            }
            
            console.error('[SW] StreamID obtained. Starting Offscreen Recording...');
            await setRecordingState(true);
            await dispatchToOffscreen({ 
                type: 'START_RECORDING', 
                streamId: streamId,
                delay: 2000 
            });
        });
    } catch (e) {
        console.error('[SW] Capture Initiation Error:', e);
    }
}

// 명령 처리 통합
async function handleToggle() {
    const active = await getRecordingState();
    console.error('[SW] Toggle request. Current status:', active);
    
    if (!active) {
        await initiateCapture();
    } else {
        console.error('[SW] Stopping recording session...');
        await dispatchToOffscreen({ type: 'STOP_RECORDING' });
        await setRecordingState(false);
    }
}

// 리스너 등록
chrome.commands.onCommand.addListener((command) => {
    console.error('[SW] Command received:', command);
    if (command === 'toggle-record') {
        handleToggle();
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.error('[SW] Internal message:', message.type);
    
    if (message.type === 'START_RECORDING') {
        getRecordingState().then(active => {
            if (!active) initiateCapture();
        });
    } else if (message.type === 'STOP_RECORDING') {
        dispatchToOffscreen({ type: 'STOP_RECORDING' });
        setRecordingState(false);
    }
    
    sendResponse({ ack: true });
    return true;
});
