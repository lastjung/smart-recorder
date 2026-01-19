// SmartRecorder Service Worker v1.0.7 [ULTRA_STABLE_AUDIO]
console.log('--- SmartRecorder SW v1.0.7 Booted ---');

// 상태 초기화
chrome.storage.session.set({ isRecording: false });

async function getRecordingState() {
    const data = await chrome.storage.session.get('isRecording');
    return !!data.isRecording;
}

async function setRecordingState(state) {
    await chrome.storage.session.set({ isRecording: state });
}

// 오프스크린 준비
async function ensureOffscreen() {
    try {
        if (await chrome.offscreen.hasDocument()) return true;
        await chrome.offscreen.createDocument({
            url: 'src/offscreen/offscreen.html',
            reasons: ['USER_MEDIA'],
            justification: 'Background recording with audio'
        });
        await new Promise(r => setTimeout(r, 800));
        return true;
    } catch (e) {
        if (e.message.includes('Only a single offscreen document may be created')) return true;
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

        // [FIX] 'audio'를 추가하여 '시스템 소리 공유'를 복구
        chrome.desktopCapture.chooseDesktopMedia(['tab', 'screen', 'window', 'audio'], tabs[0], async (streamId) => {
            if (!streamId) return;
            
            const success = await dispatchToOffscreen({ 
                type: 'START_RECORDING', 
                streamId: streamId,
                delay: 2000 
            });
            
            if (success) await setRecordingState(true);
        });
    } catch (e) {
        console.error('[SW] initiateCapture Fail:', e);
    }
}

// 정지 로직
async function terminateCapture() {
    const hasDoc = await chrome.offscreen.hasDocument();
    if (hasDoc) {
        await dispatchToOffscreen({ type: 'STOP_RECORDING' });
    }
    await setRecordingState(false);
}

// 토글 로직 (이중 체크)
async function handleToggle() {
    const isRecording = await getRecordingState();
    const hasOffscreen = await chrome.offscreen.hasDocument();

    // 실제 녹화 중이 아니거나 오프스크린이 죽었다면 무조건 '시작' 모드로 간주
    if (!isRecording || !hasOffscreen) {
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
