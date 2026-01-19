# 🎬 SmartRecorder (스마트 웹 레코더)

어떤 React 웹 애플리케이션에서도 **"녹화 시작 -> 카운트다운 -> 액션 실행 -> 자동 종료 -> 저장"**의 전체 시퀀스를 한 줄의 코드로 구현할 수 있는 독립형 프론트엔드 모듈입니다.

---

## 🚀 주요 기능

- **이벤트 동기화**: `3, 2, 1` 카운트다운 직후 앱의 특정 액션(예: 게임 시작, 알고리즘 구동)을 정확한 타이밍에 실행.
- **자동 정지 (Auto-Stop)**: 앱의 상태(예: `isFinished`)를 감시하여 목표 달성 시 정해진 시간 후 자동 녹화 종료.
- **클린 캡처 (Clean Capture)**: 녹화 시작 시점에 메뉴가 번쩍이거나 군더더기가 찍히지 않도록 `isPreparing` 상태 제공.
- **고화질 인코딩**: VP9 코덱 및 고비트레이트 설정으로 쇼츠 제작에 최적화된 화질 제공.
- **순수 프론트엔드**: 외부 서버 없이 브라우저 API(`getDisplayMedia`)만으로 작동.

---

## 📂 파일 구조

- `src/useSmartRecorder.js`: 녹화 엔진 (핵심 로직 Hook)
- `src/RecorderOverlay.jsx`: 화면 중앙 카운트다운 UI 컴포넌트
- `src/index.js`: 통합 익스포트 파일

---

## 🛠 사용 방법

### 1. 훅 설정 (Hook Setup)

```javascript
import { useSmartRecorder } from "./SmartRecorder";

const { startFlow, stopRecording, isRecording, countdown, isPreparing } =
  useSmartRecorder({
    // 카운트다운(3,2,1)이 끝남과 동시에 실행할 함수
    onAction: () => startYourAppLogic(),

    // 이 조건이 true가 되면 1.5초 후 자동으로 녹화 중단
    stopCondition: appStatus === "success",

    autoStopDelay: 1500,
    filename: "my-awesome-video",
  });
```

### 2. UI 렌더링

```javascript
import { RecorderOverlay } from "./SmartRecorder";

return (
  <div>
    {/* 메뉴 숨김 조건 예시 */}
    {!isRecording && !countdown && !isPreparing && <Menu />}

    <button onClick={startFlow}>녹화 및 시작</button>

    {/* 카운트다운 오버레이 */}
    <RecorderOverlay countdown={countdown} />
  </div>
);
```

---

## 📝 개발자 노트 및 로드맵

> **주의**: 이 툴은 브라우저의 `getDisplayMedia` API를 사용합니다. 보안 정책상 반드시 사용자 클릭(User Interaction)에 의해서만 가동될 수 있습니다.

### 향후 계획 (Next Steps)

1. **쇼츠 가이드 연동**: 현재 앱에 있는 9:16 가이드 라인 로직을 이 모듈 내부로 내장시키기.
2. **저장소 확장**: 로컬 다운로드 뿐만 아니라 Google Drive, S3 등에 바로 업로드할 수 있는 `storageAdapter` 추가.
3. **오디오 믹싱**: 시스템 오디오와 마이크 오디오를 믹싱하여 설명이 포함된 녹화 지원.
4. **브라우저 제한 대응**: 최소 너비 제한이 있는 브라우저에서도 강제로 9:16 가변 캔버스로 녹화하는 기능 연구.

---

**Last Update**: 2026-01-18
**Developer**: Antigravity & USER
