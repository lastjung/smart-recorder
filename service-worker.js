// SmartRecorder Golden - Service Worker (v2.1.0)
let isRecording = false;

// [CRITICAL] Handle Extension Icon Click
chrome.action.onClicked.addListener((tab) => {
  // [ROBUST FIX] 'isRecording' 변수 의존성 제거.
  // 이 이벤트(onClicked)는 팝업이 비활성화된 상태(즉, 녹화 중)에서만 발생하므로,
  // 조건 없이 무조건 '정지 신호'를 보냅니다. SW가 재시작되어도 작동합니다.
  console.log('Icon clicked. Sending STOP signal immediately.');
  
  // [ROBUST FIX 2] 광범위 탐색: URL 파라미터나 해시가 붙어도 'index.html'만 포함되면 찾습니다.
  chrome.tabs.query({}, (tabs) => {
    const recorderTab = tabs.find(t => t.url && t.url.includes('index.html'));
    
    if (recorderTab) {
      console.log('Found recorder tab (fuzzy match), forcing stop...', recorderTab.id);
      chrome.scripting.executeScript({
        target: { tabId: recorderTab.id },
        function: () => {
          // 1. 버튼 클릭 시도
          const stopBtn = document.getElementById('stop-btn');
          if (stopBtn) stopBtn.click();
          
          // 2. 만약 버튼 클릭이 안 먹힐 경우를 대비해 직접 엔진 정지 함수 호출 (Fallback)
          // (engine/recorder.js 인스턴스에 접근 가능하다면 좋겠지만, DOM 격리로 인해 버튼 클릭이 최선)
        }
      }).catch((err) => console.log('Script exec failed', err));
    } else {
      console.log('Recorder tab not found in checks, sending broadcast signal.');
      // 창을 못 찾았으면 모든 곳에 정지 신호 방송
      chrome.runtime.sendMessage({ type: 'STOP_RECORDING_SIGNAL' }).catch(() => {});
    }
    
    // UI 복구
    isRecording = false;
    chrome.action.setBadgeText({ text: "" }, () => chrome.runtime.lastError);
    chrome.action.setIcon({ path: "icons/icon48.png" }, () => chrome.runtime.lastError);
    chrome.action.setPopup({ popup: "index.html" }, () => chrome.runtime.lastError);
  });
});

// Sync recording state and update Icon/Badge
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'RECORDING_STATE_CHANGED') {
    isRecording = message.isRecording;
    
    // Toggle popup behavior: Disable popup while recording so onClicked works as STOP
    // Toggle popup behavior: Disable popup while recording so onClicked works as STOP
    chrome.action.setPopup({
      popup: isRecording ? "" : "index.html"
    }, () => chrome.runtime.lastError);

    // Badge indicator
    chrome.action.setBadgeText({ text: isRecording ? "REC" : "" }, () => chrome.runtime.lastError);
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" }, () => chrome.runtime.lastError);
    
    // Dynamic Icon
    chrome.action.setIcon({
      path: isRecording ? "icons/icon48_rec.png" : "icons/icon48.png"
    }, () => chrome.runtime.lastError);
  }
});
