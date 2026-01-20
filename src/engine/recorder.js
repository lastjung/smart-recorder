/**
 * SmartRecorder Engine - V2.0.8 (Stable Extension Edition)
 */
export class SmartRecorder {
  constructor(options = {}) {
    this.filename = options.filename || 'smart-record';
    this.onStatus = options.onStatus || (() => {});
    this.onStop = options.onStop || (() => {});
    
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.stream = null;
    this.lastBlobUrl = null;
    this.lastFileName = null;

    // [EXTENSION SYNC] Listen for background stop signals (Action Icon)
    chrome.runtime.onMessage.addListener((msg) => {
      // [FIX] 상태 조건 제거 (this.isRecording 체크 없이 무조건 수행)
      // 아이콘을 눌렀다는 건 사용자가 저장을 원한다는 뜻이므로 무조건 저장 시도
      if (msg.type === 'STOP_RECORDING_SIGNAL') {
        console.log('Force stopping by signal...');
        this.stop();
      }
    });
  }

  async prepare() {
    try {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
        selfBrowserSurface: 'include',
        systemAudio: 'include'
      });
      
      this.recordedChunks = [];

      // [FIX] 브라우저 상단 'Stop Sharing' 버튼 클릭 감지 강화
      const videoTrack = this.stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          console.log('Detected "Stop Sharing" from browser UI');
          if (this.isRecording) {
            this.stop(); // 즉시 녹화 종료 및 저장 시작
          }
        };
      }

      return true;
    } catch (err) {
      console.error('SmartRecorder: 준비 실패', err);
      this.onStatus('Start Failed: ' + err.message);
      return false;
    }
  }

  start() {
    if (!this.stream) return;

    const mimeType = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ].find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) this.recordedChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        // Sync with Service Worker
        chrome.runtime.sendMessage({ type: 'RECORDING_STATE_CHANGED', isRecording: false }).catch(() => {});
        this.download();
        this.stopTracks();
        this.onStop();
      };

      this.mediaRecorder.start(100);
      this.isRecording = true;
      
      // [FIX] SW 통신 대기 없이, 엔진이 직접 아이콘을 '정지 버튼'으로 개조 (즉시 반영)
      if (typeof chrome !== 'undefined' && chrome.action) {
          try {
            chrome.action.setPopup({ popup: "" }, () => chrome.runtime.lastError);
            chrome.action.setBadgeText({ text: "REC" }, () => chrome.runtime.lastError);
            chrome.action.setBadgeBackgroundColor({ color: "#ef4444" }, () => chrome.runtime.lastError);
            chrome.action.setIcon({ path: "icons/icon48_rec.png" }, () => chrome.runtime.lastError);
          } catch(e) {}
      }

      // Sync with Service Worker (Backup)
      chrome.runtime.sendMessage({ type: 'RECORDING_STATE_CHANGED', isRecording: true }).catch(() => {});
      this.onStatus('Recording...');
    } catch (e) {
      console.error('Recorder Start Error:', e);
    }
  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.isRecording = false;
    
    // [FIX] 정지 시에도 즉시 아이콘 복구
    if (typeof chrome !== 'undefined' && chrome.action) {
        try {
          chrome.action.setPopup({ popup: "index.html" }, () => chrome.runtime.lastError);
          chrome.action.setBadgeText({ text: "" }, () => chrome.runtime.lastError);
          chrome.action.setIcon({ path: "icons/icon48.png" }, () => chrome.runtime.lastError);
        } catch(e) {}
    }

    // Sync with Service Worker
    chrome.runtime.sendMessage({ type: 'RECORDING_STATE_CHANGED', isRecording: false }).catch(() => {});
  }

  stopTracks() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  download() {
    if (this.recordedChunks.length === 0) {
      this.onStatus('Nothing to save.');
      return;
    }

    try {
      const blob = new Blob(this.recordedChunks, { type: this.mediaRecorder.mimeType });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const ext = this.fileExt || 'webm'; // 확장자 사용
      this.lastFileName = `${this.filename}_${timestamp}.${ext}`;
      
      if (this.lastBlobUrl) URL.revokeObjectURL(this.lastBlobUrl);
      this.lastBlobUrl = URL.createObjectURL(blob);

      // [CRITICAL FIX] Use chrome.downloads ONLY to ensure save works even if popup closes
      if (typeof chrome !== 'undefined' && chrome.downloads) {
        chrome.downloads.download({
          url: this.lastBlobUrl,
          filename: this.lastFileName,
          saveAs: false
        });
        this.onStatus('Video Saved!');
      } else {
        // Fallback for non-extension environments (standard web)
        const a = document.createElement('a');
        a.href = this.lastBlobUrl;
        a.download = this.lastFileName;
        a.click();
      }
    } catch (e) {
      console.error('Save Error:', e);
      this.onStatus('Save Failed.');
    }
    this.recordedChunks = [];
  }
}
