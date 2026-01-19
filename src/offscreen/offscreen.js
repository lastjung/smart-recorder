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
        const success = await recorder.prepare();
        if (success) {
            // 확장 프로그램에서는 바로 시작 (딜레이 처리는 recorder.js에 내장됨)
            // 여기서는 시그널 기반이므로 recorder.handleRemoteMessage를 모방하거나 직접 호출
            recorder.handleRemoteMessage(message);
        }
    } else if (message.type === 'STOP_RECORDING') {
        recorder.stop();
    }
});
