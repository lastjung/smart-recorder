import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useSmartRecorder - 스마트 녹화 및 앱 액션 동기화 엔진
 * 
 * @param {Object} options
 * @param {Function} options.onAction - 카운트다운(3,2,1)이 끝난 후 녹화가 시작됨과 동시에 실행할 함수
 * @param {boolean} options.stopCondition - 이 값이 true가 되면 자동으로 녹화를 중단함 (예: status === 'success')
 * @param {number} options.autoStopDelay - 중단 조건 만족 후 실제 정지까지의 여유 시간 (ms, 기본값 1500)
 * @param {string} options.filename - 저장될 파일의 이름 접두사
 */
export const useSmartRecorder = ({
  onAction,
  stopCondition,
  autoStopDelay = 1500,
  filename = 'web-capture'
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false); 
  const [countdown, setCountdown] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const pendingStreamRef = useRef(null);

  // 비디오 다운로드 로직
  const downloadVideo = useCallback(() => {
    if (recordedChunksRef.current.length > 0) {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${Date.now()}.webm`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
    recordedChunksRef.current = [];
    pendingStreamRef.current = null;
  }, [filename]);

  // 전체 흐름 시작: 탭 선택 -> 카운트다운 -> 액션 호출 & 녹화 시작
  const startFlow = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
        selfBrowserSurface: 'include',
        systemAudio: 'include'
      });

      pendingStreamRef.current = stream;
      recordedChunksRef.current = [];
      setIsPreparing(true);
      setCountdown(3);
    } catch (err) {
      console.error('SmartRecorder: 시퀀스 시작 실패', err);
      setIsPreparing(false);
    }
  }, []);

  // 수동 중단
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPreparing(false);
  }, []);

  // 카운트다운 처리기
  useEffect(() => {
    if (countdown === 0) {
      setCountdown(null);
      
      if (pendingStreamRef.current) {
        setIsRecording(true);
        const stream = pendingStreamRef.current;
        const recorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 5000000
        });
        
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        
        recorder.onstop = () => {
          stream.getTracks().forEach(track => track.stop());
          downloadVideo();
        };

        recorder.start(100); // 0.1초 단위로 데이터 수집 (안정성)
        
        // 카운트다운 직후 실제 앱의 액션 실행
        if (onAction) onAction();
        
        // UI 깜빡임 방지를 위한 미세 지연 후 준비 상태 해제
        setTimeout(() => setIsPreparing(false), 200);
      }
    } else if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, onAction, downloadVideo]);

  // 자동 중단 모니터링
  useEffect(() => {
    if (isRecording && stopCondition) {
      const timer = setTimeout(() => {
        stopRecording();
      }, autoStopDelay);
      return () => clearTimeout(timer);
    }
  }, [isRecording, stopCondition, stopRecording, autoStopDelay]);

  return {
    startFlow,
    stopRecording,
    isRecording,
    isPreparing,
    countdown
  };
};
