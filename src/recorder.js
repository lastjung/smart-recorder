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
    
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.stream = null;
    this.isRecording = false;
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
      this.download();
      this.stopTracks();
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
    this.onStatus(`Attempting download (${this.recordedChunks.length} chunks)...`);
    console.log('Attempting download, chunk count:', this.recordedChunks.length);
    
    if (this.recordedChunks.length > 0) {
      try {
        // 실제 MediaRecorder가 사용한 MIME 타입 가져오기
        const actualType = (this.mediaRecorder && this.mediaRecorder.mimeType) || 'video/webm';
        const blob = new Blob(this.recordedChunks, { type: actualType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        
        // 파일명 생성 (특수문자 제거 및 명확한 확장자 부여)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const extension = actualType.includes('mp4') ? 'mp4' : 'webm';
        const finalFileName = `${this.filename}_${timestamp}.${extension}`;
        
        console.log('Final FileName:', finalFileName);
        
        a.href = url;
        // .download 속성 대신 setAttribute를 사용하여 브라우저 호환성 극대화
        a.setAttribute('download', finalFileName);
        
        // 가상 클릭 실행
        a.click();
        
        this.onStatus(`Download started: ${finalFileName}`);
        
        // 메모리 해제를 넉넉하게 기다림
        setTimeout(() => {
          if (document.body.contains(a)) {
            document.body.removeChild(a);
          }
          URL.revokeObjectURL(url);
        }, 10000); 
      } catch (e) {
        this.onStatus('Download Error: ' + e.message);
        console.error('Download error:', e);
      }
    } else {
      this.onStatus('No recorded data found.');
      console.warn('recordedChunks가 비어있어 다운로드를 건너뜁니다.');
    }
    this.recordedChunks = [];
  }
}
