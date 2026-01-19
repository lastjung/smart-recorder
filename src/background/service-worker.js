// SmartRecorder Service Worker v1.0.8 [SILENT_ERROR_FIX]
console.log('--- SmartRecorder SW v1.0.8 Booted ---');

// 상태 초기화
chrome.storage.session.set({ isRecording: false });

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
    } catch (e) {
        console.log('[ERROR] State Sync Sync Fail:', e); // 에러 버튼 방지를 위해 log 사용
    }
}

// 오프스크린 준비
async function ensureOffscreen() {
    try {
        if (await chrome.offscreen.hasDocument()) return true;
        await chrome.offscreen.createDocument({
            url: 'src/offscreen/offscreen.html',
            reasons: ['USER_MEDIA'],
            justification: 'Background recording'
        });
        await new Promise(r => setTimeout(r, 800));
        return true;
    } catch (e) {
        if (e.message.includes('Only a single offscreen document may be created')) return true;
        console.log('[ERROR] Offscreen Creation Fail:', e);
        return false;
    }
}

// 메시지 전송
async function dispatchToOffscreen(message, retries = 2) {
    const ready = await ensureOffscreen();
    if (!ready) return false;
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                if (retries > 0) setTimeout(() => resolve(dispatchToOffscreen(message, retries - 1)), 500);
                else resolve(false);
            } else resolve(true);
        });
    });
}

// 캡처 시작
async function initiateCapture() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]) return;

        chrome.desktopCapture.chooseDesktopMedia(['tab', 'screen', 'window', 'audio'], tabs[0], async (streamId) => {
            if (!streamId) {
                console.log('[SW] Capture cancelled by user');
                return;
            }
            
            console.log('[SW] Starting offscreen with StreamID:', streamId);
            const success = await dispatchToOffscreen({ 
                type: 'START_RECORDING', 
                streamId: streamId,
                delay: 2000 
            });
            
            if (success) {
                await setRecordingState(true);
            } else {
                console.log('[ERROR] Failed to start record in offscreen');
            }
        });
    } catch (e) {
        console.log('[ERROR] initiateCapture Error:', e);
    }
}

// 정지 로직 (강제성 강화)
async function terminateCapture() {
    try {
        const hasDoc = await chrome.offscreen.hasDocument();
        if (hasDoc) {
            await dispatchToOffscreen({ type: 'STOP_RECORDING' });
        }
    } catch (e) {
        console.log('[ERROR] Terminate Fail:', e);
    } finally {
        await setRecordingState(false);
        console.log('[SW] State Reset Complete');
    }
}

// 토글 로직
async function handleToggle() {
    const isRecording = await getRecordingState();
    const hasOffscreen = await chrome.offscreen.hasDocument();

    console.log('[SW] Toggle Request. Rec:', isRecording, 'Offscreen:', hasOffscreen);

    if (!isRecording || !hasOffscreen) {
        // 불일치 시 상태 강제 초기화 후 시작
        if (isRecording && !hasOffscreen) await setRecordingState(false);
        await initiateCapture();
    } else {
        await terminateCapture();
    }
}

// 리스너
chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle-record') handleToggle();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'STATUS_UPDATE') return false;
    
    console.log('[SW] Internal Msg:', message.type);

    if (message.type === 'START_RECORDING') {
        handleToggle();
    } else if (message.type === 'STOP_RECORDING') {
        terminateCapture();
    } else if (message.type === 'RECORDING_STOPPED') {
        setRecordingState(false);
    }
    
    sendResponse({ status: 'ack' });
    return true;
});
