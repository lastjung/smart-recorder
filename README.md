# SmartRecorder

AI 기반 웹 레코더 도구입니다. 이 프로젝트는 순수 JavaScript(Vanilla JS)와 Tailwind CSS를 사용하는 **크롬 확장 프로그램(Chrome Tool)**으로 개발되었습니다.

## 🔄 작동 원리 (최신 워크플로우)

1. **녹화 트리거**: 녹화하려는 탭에서 단축키(`Alt+Shift+R`)를 누르고 해당 탭을 선택합니다.
2. **무흔적 대기**: 탭 선택 직후 **2초 카운트다운**이 시작됩니다. 이 시간 동안 마우스를 화면 밖으로 치우세요!
3. **자동 녹화**: 카운트다운 완료 후 마우스 흔적 없는 깨끗한 녹화가 시작됩니다.
4. **종료 및 저장**: 다시 단축키(`Alt+Shift+R`)를 누르면 녹화가 즉시 중단되고 파일이 자동 저장됩니다.

---

## 🛠 고급 가이드: 사이트 A 자동 연동 (선택 사항)

**일반적인 경우에는 단축키(`Alt+Shift+R`)만으로 충분합니다.** 만약 개발 중인 사이트(A)의 로직과 녹화 시작/종료를 **완전히 자동화**하고 싶을 때만 아래 가이드를 따르세요.

### 1. 통신 채널 설정

페이지 상단(또는 필요한 공통 모듈)에 아래 코드를 한 번만 작성합니다.

```javascript
const recorderChannel = new BroadcastChannel("smart-recorder-sync");
```

### 2. 자동 녹화 시작 (무흔적 트리거)

버튼 클릭이나 시스템 이벤트 발생 시 2초 뒤에 녹화가 시작되도록 설정합니다.

```javascript
function startCapture() {
  // 2s 지연 시작: 사용자가 마우스를 치울 시간을 확보합니다.
  recorderChannel.postMessage({ type: "START_RECORDING", delay: 2000 });

  // 이후 실제 작업 로직 실행
  console.log("작업 시작...");
}
```

### 3. 자동 녹화 종료

작업이 끝나는 시점에 자동으로 녹화를 정지시킵니다.

```javascript
function endCapture() {
  recorderChannel.postMessage({ type: "STOP_RECORDING" });
}
```

### 4. 수동 제어 단축키 (선택 사항)

사용자가 직접 키보드로 제어하고 싶을 때 유용합니다.

- **기본 제공 단축키**:
  - **녹화 시작 (Start)**: `Ctrl/Cmd + Shift + U`
  - **녹화 중단 (Stop & Save)**: `Ctrl/Cmd + Shift + Y`
    _(크롬 설정(`chrome://extensions/shortcuts`)에서 변경 가능)_

- **사이트 A 내 직접 구현 예시**:

```javascript
window.addEventListener("keydown", (e) => {
  // Ctrl/Cmd + Shift + U/Y 감지
  const isCmdOrCtrl = e.metaKey || e.ctrlKey;
  // 시작 단축키 (U)
  if (isCmdOrCtrl && e.shiftKey && (e.key === "U" || e.key === "u")) {
    recorderChannel.postMessage({ type: "START_RECORDING", delay: 2000 });
  }
  // 중단 단축키 (Y)
  if (isCmdOrCtrl && e.shiftKey && (e.key === "Y" || e.key === "y")) {
    recorderChannel.postMessage({ type: "STOP_RECORDING" });
  }
});
```

---

## 🚀 주요 기능

- **크롬 확장 프로그램**: 모든 탭 대응 및 강력한 제어 권한.
- **무흔적 대기 모드**: 탭 선택 후 신호가 올 때까지 대기하여 불필요한 마우스 이동 제거.
- **안전한 다운로드**: VP9 고화질 코덱 및 강제 파일명 주입으로 안정성 확보.

## 📂 폴더 구조

- `src/engine/`: 핵심 녹화 엔진 (`recorder.js`)
- `src/background/`: 확장 프로그램 서비스 워커 및 메시지 릴레이
- `src/offscreen/`: 백그라운드 녹화 수행 문서
- `src/ui/`: 팝업 인터페이스

## 📝 라이선스

MIT License
