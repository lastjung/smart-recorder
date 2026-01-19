// SmartRecorder Service Worker v1.0.23 [UI_RESTORED]
console.log('--- SmartRecorder SW v1.0.23 Booted ---');

// UI에 상태 업데이트 알림
async function notifyUI(message, isForceIdle = false) {
    try {
        console.log('[SW-UI]', message);
        chrome.runtime.sendMessage({ 
            type: 'STATUS_UPDATE', 
            message: message,
            isForceIdle: isForceIdle
        }).catch(() => {});
    } catch (e) {}
}

// 화면에 토스트/바 메시지 전송 (Active Tab)
async function showVisualFeedback(text) {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { 
                type: 'SHOW_TOAST', 
                text: text 
            }).catch(() => {});
        }
    } catch (e) {
        console.log('[SW] Visual Feedback Fail:', e);
    }
}

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
        notifyUI(state ? 'Recording started...' : 'Idle - Ready');
    } catch (e) {
        console.log('[ERROR] State Sync Sync Fail:', e);
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
        
        showVisualFeedback("⚡️ Initializing...");

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
                // [Trigger UI]
                showVisualFeedback("🎥 Recording in 2s...");
            } else {
                console.log('[ERROR] Failed to start record in offscreen');
                showVisualFeedback("❌ Failed to Start");
            }
        });
    } catch (e) {
        console.log('[ERROR] initiateCapture Error:', e);
    }
}

// 정지 로직 (강제성 강화)
async function terminateCapture() {
    console.log('[SW] Executing Terminate Sequence...');
    showVisualFeedback("⏹ STOP COMMAND RECEIVED!"); 

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

// 리스너
chrome.commands.onCommand.addListener(async (command) => {
    console.log('[SW] Command Received:', command);
    
    if (command === 'start-record') {
        await initiateCapture(); // 무조건 실행
    } else if (command === 'stop-record') {
        await terminateCapture(); // 무조건 중단 시도
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'STATUS_UPDATE') return false;

    if (message.type === 'START_RECORDING') {
        initiateCapture();
    } else if (message.type === 'STOP_RECORDING') {
        terminateCapture();
    } else if (message.type === 'RECORDING_STOPPED') {
        setRecordingState(false);
        showVisualFeedback("💾 Saved!");
    }
    
    sendResponse({ status: 'ack' });
    return true;
});
