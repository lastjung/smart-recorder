import { SmartRecorder } from '../engine/recorder.js';

const recorder = new SmartRecorder({
    filename: 'smart-record-ext',
    onStatus: (msg) => {
        chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', message: msg });
    },
    onStop: () => {
        // 녹화가 완전히 멈췄음을 서비스 워커에 알림
        chrome.runtime.sendMessage({ type: 'RECORDING_STOPPED' });
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
    return true; 
});
