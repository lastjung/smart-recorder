/**
 * SmartRecorder Engine - Vanilla JS Version
 */
export class SmartRecorder {
  constructor(options = {}) {
    this.onAction = options.onAction || (() => {});
    this.stopCondition = options.stopCondition || false;
    this.autoStopDelay = options.autoStopDelay || 1500;
    this.filename = options.filename || 'web-capture';
    this.onStatus = options.onStatus || (() => {});
    this.onStop = options.onStop || (() => {});
    this.onRemoteStart = options.onRemoteStart || (() => {});
    
    // 외부 탭 통신을 위한 채널 설정 (Option 1)
    this.channel = new BroadcastChannel('smart-recorder-sync');
    this.channel.onmessage = (e) => this.handleRemoteMessage(e.data);
    
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.stream = null;
    this.isRecording = false;
    this.lastBlobUrl = null;
    this.lastFileName = null;
  }

  async prepare(streamId = null) {
    try {
      if (streamId) {
        // [FIX] 오디오 캡처 활성화
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: streamId
            }
          },
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: streamId
            }
          }
        });
      } else {
        // 일반 웹 사이트를 위한 방식
        this.stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 30 } },
          audio: true,
          selfBrowserSurface: 'include',
          systemAudio: 'include'
        });
      }
      this.recordedChunks = [];
      return true;
    } catch (err) {
      console.log('[ERROR] SmartRecorder: 준비 실패', err);
      return false;
    }
}

  start() {
    if (!this.stream) return;

    // 지원되는 최적의 MIME 타입 찾기
    const mimeType = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ].find(type => MediaRecorder.isTypeSupported(type)) || '';

    console.log('Using MIME type:', mimeType);

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        videoBitsPerSecond: 5000000
      });
    } catch (e) {
      console.log('[ERROR] MediaRecorder 생성 실패:', e);
      return;
    }

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      console.log('Recording stopped, chunks:', this.recordedChunks.length);
      this.isRecording = false; // 보수적으로 한 번 더 설정
      this.download();
      this.stopTracks();
      this.onStop(); // UI에 중단 알림
    };

    // 브라우저 자체 '공유 중지' 버튼 대응
    this.stream.getTracks()[0].onended = () => {
      if (this.isRecording) this.stop();
    };

    this.mediaRecorder.start(100);
    this.isRecording = true;
    
    if (this.onAction) this.onAction();
  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.isRecording = false;
  }

  stopTracks() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  download() {
    this.onStatus(`Processing recorded video...`);
    
    if (this.recordedChunks.length > 0) {
      try {
        const actualType = (this.mediaRecorder && this.mediaRecorder.mimeType) || 'video/webm';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const extension = actualType.includes('mp4') ? 'mp4' : 'webm';
        this.lastFileName = `${this.filename}_${timestamp}.${extension}`;

        // [핵심] Blob이 아닌 'File' 객체를 생성하여 파일명을 강제로 주입
        const blob = new Blob(this.recordedChunks, { type: actualType });
        const file = new File([blob], this.lastFileName, { type: actualType });
        
        // 이전 URL 해제
        if (this.lastBlobUrl) URL.revokeObjectURL(this.lastBlobUrl);
        
        this.lastBlobUrl = URL.createObjectURL(file);
        
        // [ULTRA-FIX] 확장 프로그램 API가 있으면 최우선 사용 (오프스크린 제약 해결)
        if (typeof chrome !== 'undefined' && chrome.downloads && chrome.downloads.download) {
            console.log('[Engine] Using chrome.downloads API for robust saving');
            chrome.downloads.download({
                url: this.lastBlobUrl,
                filename: this.lastFileName,
                saveAs: false
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    console.log('[ERROR] Download fail via API:', chrome.runtime.lastError.message);
                    this.fallbackDownload();
                } else {
                    this.onStatus(`Saved: ${this.lastFileName}`);
                }
            });
        } else {
            this.fallbackDownload();
        }
      } catch (e) {
        this.onStatus('Process Error: ' + e.message);
        console.log('[ERROR] Process error:', e);
      }
    } else {
      this.onStatus('No recorded data found.');
    }
    this.recordedChunks = [];
  }

  handleRemoteMessage(data) {
    console.log('Remote Signal Receipt:', data);
    
    if (data.type === 'START_RECORDING') {
      if (!this.isRecording) {
        let remaining = data.delay !== undefined ? data.delay : 2000;
        
        const countdown = setInterval(() => {
            if (remaining > 0) {
                this.onStatus(`Signal received! Starting in ${remaining/1000}s... (Move your mouse!)`);
                remaining -= 500;
            } else {
                clearInterval(countdown);
                if (this.stream) {
                    this.start();
                } else {
                    this.onStatus('Error: Select tab in Recorder first!');
                }
            }
        }, 500);
      }
    } else if (data.type === 'STOP_RECORDING') {
      if (this.isRecording) {
        this.onStatus('Stop signal received. Saving...');
        this.stop();
      }
    }
  }

  // 기존 방식 (일반 웹용)
  fallbackDownload() {
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = this.lastBlobUrl;
    a.download = this.lastFileName;
    a.click();
    this.onStatus(`Ready (Fallback): ${this.lastFileName}`);
    setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
    }, 1000);
  }

  // 메모리 해제 시 채널 닫기
  destroy() {
    if (this.channel) this.channel.close();
    this.stopTracks();
  }
}
