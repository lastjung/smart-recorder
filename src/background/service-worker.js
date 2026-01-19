// SmartRecorder Service Worker v1.0.4 [STABLE]
console.log('--- SmartRecorder SW v1.0.4 Booted ---');

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
        console.log('[SW] State Saved:', state);
    } catch (e) {
        console.error('[SW] State Save Error:', e);
    }
}

// 오프스크린 준비
async function ensureOffscreen() {
    try {
        if (await chrome.offscreen.hasDocument()) return true;
        
        console.log('[SW] Creating Offscreen Document...');
        await chrome.offscreen.createDocument({
            url: 'src/offscreen/offscreen.html',
            reasons: ['USER_MEDIA'],
            justification: 'Background screen recording'
        });
        
        // 오프스크린 스크립트 로드 대기
        await new Promise(r => setTimeout(r, 700));
        return true;
    } catch (e) {
        if (e.message.includes('Only a single offscreen document may be created')) {
            return true;
        }
        console.error('[SW] Offscreen Setup Fail:', e);
        return false;
    }
}

// 메시지 전송 (안전한 릴레이 및 재시도)
async function dispatchToOffscreen(message, retries = 3) {
    const ready = await ensureOffscreen();
    if (!ready) {
        console.error('[SW] Dispatch Fail: Offscreen not ready');
        return;
    }
    
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                console.warn('[SW] Relay attempt failed:', chrome.runtime.lastError.message);
                if (retries > 0) {
                    setTimeout(() => resolve(dispatchToOffscreen(message, retries - 1)), 500);
                } else {
                    resolve(false);
                }
            } else {
                console.log('[SW] Message Relayed:', message.type);
                resolve(true);
            }
        });
    });
}

// 캡처 흐름
async function initiateCapture() {
    try {
        console.log('[SW] Requesting Capture Tab...');
        const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (!tabs[0]) {
            console.error('[SW] No active tab found');
            return;
        }

        chrome.desktopCapture.chooseDesktopMedia(['tab', 'screen', 'window'], tabs[0], async (streamId) => {
            if (!streamId) {
                console.log('[SW] User cancelled capture');
                return;
            }
            
            console.log('[SW] StreamID obtained. Starting Offscreen...');
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

async function handleToggle() {
    const active = await getRecordingState();
    console.log('[SW] Toggle request. current state:', active);
    
    if (!active) {
        await initiateCapture();
    } else {
        console.log('[SW] Stopping recording...');
        await dispatchToOffscreen({ type: 'STOP_RECORDING' });
        await setRecordingState(false);
    }
}

// 리스너
chrome.commands.onCommand.addListener((command) => {
    console.log('[SW] Command:', command);
    if (command === 'toggle-record') {
        handleToggle();
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // STATUS_UPDATE 등 무시할 메시지 필터링
    if (message.type === 'STATUS_UPDATE') return false;

    console.log('[SW] Internal message:', message.type);
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
