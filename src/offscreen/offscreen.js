import { SmartRecorder } from '../engine/recorder.js';

const recorder = new SmartRecorder({
    filename: 'smart-record-ext',
    onStatus: (msg) => {
        chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', message: msg });
    }
});

chrome.runtime.onMessage.addListener(async (message) => {
    console.log('Offscreen received message:', message);
    if (message.type === 'START_RECORDING') {
        const success = await recorder.prepare(message.streamId);
        if (success) {
            recorder.handleRemoteMessage(message);
        }
    } else if (message.type === 'STOP_RECORDING') {
        recorder.stop();
    }
});
