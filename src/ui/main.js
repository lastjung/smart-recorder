import { SmartRecorder } from '../engine/recorder.js';

const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const overlay = document.getElementById('recorder-overlay');
const countdownText = document.getElementById('countdown-text');
const stateDot = document.getElementById('record-state-dot');

const statusMsg = document.getElementById('status-msg');
const downloadBtn = document.getElementById('download-btn');

const recorder = new SmartRecorder({
    filename: 'smart-record',
    onStatus: (msg) => {
        statusMsg.textContent = msg;
        if (msg.includes('Download ready')) {
            downloadBtn.classList.remove('hidden');
        }
    },
    onStop: () => {
        updateUIState('idle');
    },
    onRemoteStart: () => {
        // 엔진 내부에서 처리되므로 여기서는 UI만 동기화
        updateUIState('recording');
    },
    onAction: () => {
        console.log('Action Started!');
        downloadBtn.classList.add('hidden');
    }
});

let countdownInterval = null;

const updateUIState = (state) => {
    if (state === 'idle') {
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        stateDot.className = 'w-4 h-4 rounded-full bg-slate-700';
    } else if (state === 'recording') {
        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
        stateDot.className = 'w-4 h-4 rounded-full bg-red-500 animate-pulse';
    }
};

const startCountdown = () => {
    let count = 3;
    overlay.classList.remove('hidden');
    countdownText.textContent = count;

    countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownText.textContent = count;
        } else {
            clearInterval(countdownInterval);
            overlay.classList.add('hidden');
            recorder.start();
            updateUIState('recording');
        }
    }, 1000);
};

// Event Listeners
startBtn.addEventListener('click', async () => {
    const success = await recorder.prepare();
    if (success) {
        statusMsg.textContent = 'Armed: Waiting for signal from Target Site...';
        stateDot.className = 'w-4 h-4 rounded-full bg-yellow-500 animate-pulse';
    }
});

stopBtn.addEventListener('click', () => {
    recorder.stop();
    updateUIState('idle');
});

downloadBtn.addEventListener('click', () => {
    if (recorder.lastBlobUrl && recorder.lastFileName) {
        const a = document.createElement('a');
        document.body.appendChild(a); // DOM에 추가하여 확실하게 인식
        a.style.display = 'none';
        a.href = recorder.lastBlobUrl;
        a.download = recorder.lastFileName;
        a.click();
        setTimeout(() => document.body.removeChild(a), 1000);
    }
});
