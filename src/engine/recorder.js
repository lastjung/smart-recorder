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

  async prepare() {
    try {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
        selfBrowserSurface: 'include',
        systemAudio: 'include'
      });
      this.recordedChunks = [];
      return true;
    } catch (err) {
      console.error('SmartRecorder: 준비 실패', err);
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
      console.error('MediaRecorder 생성 실패:', e);
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

        // [CORE FIX] Use a specific Blob with the correct type
        const blob = new Blob(this.recordedChunks, { type: actualType });
        
        // Revoke old URL if exists
        if (this.lastBlobUrl) URL.revokeObjectURL(this.lastBlobUrl);
        
        this.lastBlobUrl = URL.createObjectURL(blob);
        
        // [STABILITY] Create and trigger a hidden anchor element with explicit download attribute
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = this.lastBlobUrl;
        a.download = this.lastFileName;
        
        document.body.appendChild(a);
        
        // Small delay to ensure DOM attachment before click
        setTimeout(() => {
          a.click();
          this.onStatus(`Downloaded: ${this.lastFileName}`);
          
          // Cleanup
          setTimeout(() => {
            if (document.body.contains(a)) document.body.removeChild(a);
          }, 500);
        }, 100);

        // Notify UI that manual download is also available if auto-click fails
        if (this.onStop) this.onStop(this.lastBlobUrl, this.lastFileName);
        
      } catch (e) {
        this.onStatus('Download Error: ' + e.message);
        console.error('Download error:', e);
      }
    } else {
      this.onStatus('No recorded data to save.');
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

  // 메모리 해제 시 채널 닫기 (필요 시 호출)
  destroy() {
    if (this.channel) this.channel.close();
    this.stopTracks();
  }
}
