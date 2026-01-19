// Service Worker for SmartRecorder

async function setupOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: 'src/offscreen/offscreen.html',
    reasons: ['USER_MEDIA'],
    justification: 'Recording screen in background'
  });
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-record') {
    await setupOffscreen();
    chrome.runtime.sendMessage({ type: 'TOGGLE_RECORDING' });
  }
});

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'START_RECORDING' || message.type === 'STOP_RECORDING') {
    await setupOffscreen();
    // 오프스크린 문서로 전달
    chrome.runtime.sendMessage(message);
  }
});
