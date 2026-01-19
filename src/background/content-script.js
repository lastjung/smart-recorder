// Content script to bridge the web page and extension
const channel = new BroadcastChannel('smart-recorder-sync');

channel.onmessage = (e) => {
  if (e.data.type === 'START_RECORDING' || e.data.type === 'STOP_RECORDING') {
    chrome.runtime.sendMessage(e.data);
  }
};

chrome.runtime.onMessage.addListener((message) => {
    // 임의의 UI 로직 제거됨 - 순수 릴레이만 수행
});
