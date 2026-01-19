// SmartRecorder Service Worker v1.0.5 [ULTRA_STABLE]
console.log('--- SmartRecorder SW v1.0.5 Booted ---');

// 상태 관리 (sessionStorage 기반 - 브라우저 닫히면 초기화되므로 녹화 상태에 최적)
async function getRecordingState() {
    try {
        const data = await chrome.storage.session.get('isRecording');
        return !!data.isRecording;
    } catch (e) {
        return false;
    }
}

async function setRecordingState(state) {
    try {
        await chrome.storage.session.set({ isRecording: state });
        console.log('[SW] State Sync:', state);
    } catch (e) {
        console.error('[SW] State Sync Error:', e);
    }
}

// 오프스크린 준비
async function ensureOffscreen() {
    try {
        if (await chrome.offscreen.hasDocument()) return true;
        
        console.log('[SW] Initializing Offscreen...');
        await chrome.offscreen.createDocument({
            url: 'src/offscreen/offscreen.html',
            reasons: ['USER_MEDIA'],
            justification: 'Background screen recording'
        });
        
        await new Promise(r => setTimeout(r, 800));
        return true;
    } catch (e) {
        if (e.message.includes('Only a single offscreen document may be created')) return true;
        console.error('[SW] Offscreen Fail:', e);
        return false;
    }
}

// 메시지 전송
async function dispatchToOffscreen(message, retries = 3) {
    const ready = await ensureOffscreen();
    if (!ready) return false;
    
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                if (retries > 0) {
                    setTimeout(() => resolve(dispatchToOffscreen(message, retries - 1)), 500);
                } else {
                    resolve(false);
                }
            } else {
                resolve(true);
            }
        });
    });
}

// 캡처 시작
async function initiateCapture() {
    try {
        const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (!tabs[0]) return;

        chrome.desktopCapture.chooseDesktopMedia(['tab', 'screen', 'window'], tabs[0], async (streamId) => {
            if (!streamId) return;
            
            await setRecordingState(true);
            const success = await dispatchToOffscreen({ 
                type: 'START_RECORDING', 
                streamId: streamId,
                delay: 2000 
            });
            
            if (!success) {
                console.error('[SW] Start failed, resetting state');
                await setRecordingState(false);
            }
        });
    } catch (e) {
        console.error('[SW] Capture Error:', e);
    }
}

async function handleToggle() {
    const active = await getRecordingState();
    console.log('[SW] Toggle Active:', active);
    
    if (!active) {
        await initiateCapture();
    } else {
        console.log('[SW] Stopping via Command...');
        await dispatchToOffscreen({ type: 'STOP_RECORDING' });
        await setRecordingState(false); // 수동 정지 시 상태 리셋
    }
}

// 리스너
chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle-record') {
        handleToggle();
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'STATUS_UPDATE') return false;

    console.log('[SW] Message Recv:', message.type);
    
    if (message.type === 'START_RECORDING') {
        getRecordingState().then(active => { if (!active) initiateCapture(); });
    } else if (message.type === 'STOP_RECORDING') {
        dispatchToOffscreen({ type: 'STOP_RECORDING' });
        setRecordingState(false);
    } else if (message.type === 'RECORDING_STOPPED') {
        // 오프스크린에서 녹화가 멈췄을 때 호출됨 (브라우저 정지 버튼 등)
        console.log('[SW] State Reset (External Stop)');
        setRecordingState(false);
    }
    
    sendResponse({ ack: true });
    return true;
});
