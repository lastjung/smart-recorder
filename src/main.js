import { SmartRecorder } from './recorder.js';

const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const overlay = document.getElementById('recorder-overlay');
const countdownText = document.getElementById('countdown-text');
const stateDot = document.getElementById('record-state-dot');

const recorder = new SmartRecorder({
    filename: 'smart-record',
    onAction: () => {
        console.log('Action Started!');
        // 여기서 앱의 실제 로직을 실행할 수 있습니다.
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
        startCountdown();
    }
});

stopBtn.addEventListener('click', () => {
    recorder.stop();
    updateUIState('idle');
});

// 화면 공유 중단 대응 (브라우저 자체 중단 버튼 클릭 시)
window.addEventListener('blur', () => {
    // 필요한 경우 추가 로직 가동
});
