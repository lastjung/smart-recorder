// Service Worker for SmartRecorder
let isRecording = false;

async function setupOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  
  console.log('Creating offscreen document...');
  await chrome.offscreen.createDocument({
    url: 'src/offscreen/offscreen.html',
    reasons: ['USER_MEDIA'],
    justification: 'Recording screen in background'
  });
}

// 오프스크린에 메시지를 안전하게 보내는 함수 (준비될 때까지 약간 대기)
async function sendToOffscreen(message) {
  await setupOffscreen();
  // 오프스크린 스크립트가 로드될 시간을 짧게 부여
  setTimeout(() => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('Offscreen not ready yet, retrying...', chrome.runtime.lastError.message);
        setTimeout(() => chrome.runtime.sendMessage(message), 500);
      }
    });
  }, 200);
}

chrome.commands.onCommand.addListener(async (command) => {
  console.log('Hotkey Command:', command);
  if (command === 'toggle-record') {
    const type = isRecording ? 'STOP_RECORDING' : 'START_RECORDING';
    await sendToOffscreen({ type });
    isRecording = !isRecording;
  }
});

chrome.runtime.onMessage.addListener(async (message) => {
  console.log('Message in SW:', message);
  
  if (message.type === 'START_RECORDING' || message.type === 'STOP_RECORDING') {
    isRecording = (message.type === 'START_RECORDING');
    await sendToOffscreen(message);
  }
});
