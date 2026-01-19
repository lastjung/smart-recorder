// Service Worker for SmartRecorder
let isRecording = false;

async function setupOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: 'src/offscreen/offscreen.html',
    reasons: ['USER_MEDIA'],
    justification: 'Recording screen in background'
  });
}

chrome.commands.onCommand.addListener(async (command) => {
  console.log('Command received:', command);
  if (command === 'toggle-record') {
    await setupOffscreen();
    const type = isRecording ? 'STOP_RECORDING' : 'START_RECORDING';
    console.log('Toggling recording. Sending:', type);
    chrome.runtime.sendMessage({ type });
    isRecording = !isRecording;
  }
});

chrome.runtime.onMessage.addListener(async (message) => {
  console.log('Message received in SW:', message);
  if (message.type === 'START_RECORDING' || message.type === 'STOP_RECORDING') {
    await setupOffscreen();
    isRecording = (message.type === 'START_RECORDING');
    chrome.runtime.sendMessage(message);
  } else if (message.type === 'STATUS_UPDATE') {
    // 팝업으로 전달하기 위해 다시 쏘기
    // (이미 쏜 것이지만 명확히 하기 위해)
  }
});
