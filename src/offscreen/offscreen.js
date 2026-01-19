import { SmartRecorder } from '../engine/recorder.js';

const recorder = new SmartRecorder({
    filename: 'smart-record-ext',
    onStatus: (msg) => {
        chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', message: msg });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Offscreen received message:', message);
    
    if (message.type === 'START_RECORDING') {
        recorder.prepare(message.streamId).then(success => {
            if (success) recorder.handleRemoteMessage(message);
        });
        sendResponse({ status: 'starting' });
    } else if (message.type === 'STOP_RECORDING') {
        recorder.stop();
        sendResponse({ status: 'stopped' });
    }
    return true; // 비동기 응답 지원
});
