// Popup controller for SmartRecorder Extension

const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const statusMsg = document.getElementById('status-msg');
const stateDot = document.getElementById('record-state-dot');
const downloadBtn = document.getElementById('download-btn');

// 서비스 워커로부터 상태 업데이트 수신
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'STATUS_UPDATE') {
        statusMsg.textContent = message.message;
        
        if (message.message.includes('Recording started')) {
            updateUIState('recording');
        } else if (message.message.includes('Download ready') || message.message.includes('Idle')) {
            updateUIState('idle');
            if (message.message.includes('Download ready')) {
                downloadBtn.classList.remove('hidden');
            }
        }
    }
});

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

// Event Listeners
startBtn.addEventListener('click', () => {
    // 백그라운드 서비스 워커에 녹화 시작 명령 전송
    chrome.runtime.sendMessage({ type: 'START_RECORDING' });
    downloadBtn.classList.add('hidden');
});

stopBtn.addEventListener('click', () => {
    // 백그라운드 서비스 워커에 녹화 중지 명령 전송
    chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
});

// 다운로드 기능은 오프스크린에서 파일이 생성되므로, 
// 필요한 경우 오프스크린에서 직접 다운로드를 수행하거나 링크를 전달받아야 함.
// 현재는 recorder.js 내부에서 이미 다운로드를 트리거함.
