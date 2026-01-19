# SmartRecorder

AI 기반 웹 레코더 도구입니다. 이 프로젝트는 기존 React 모듈에서 순수 JavaScript(Vanilla JS)와 Tailwind CSS를 사용하는 독립형 웹 애플리케이션으로 전환되었습니다.

## 🔄 작동 원리 (Workflow)

1. **녹화 준비**: `Start Recording` 버튼 클릭 시 브라우저 탭 선택 창이 뜹니다.
2. **탭 선택**: 녹화할 대상 탭을 사용자가 선택합니다.
3. **이벤트 기반 녹화 시작**: 선택된 탭에서 특정 이벤트가 발생하면 녹화가 자동으로 시작됩니다. (현재 개발 중)
4. **이벤트 기반 녹화 중단**: 작업 완료 등의 이벤트 발생 시 녹화가 자동으로 중단됩니다.
5. **저장 및 업로드**: 녹화된 영상은 즉시 다운로드되거나 구글 드라이브로 업로드됩니다.
6. **변환**: 다운로드된 WebM 파일은 필요에 따라 MP4로 변환됩니다.

## 🔗 사이트 A (대상 사이트) 초간편 연동법

대상 사이트의 버튼 클릭 함수에 딱 **2줄**만 추가하세요.

```javascript
// 1. 통신 채널 연결 (페이지 상단에 한 번만)
const channel = new BroadcastChannel("smart-recorder-sync");

// 2. 버튼 클릭 시 실행할 코드
function 온클릭_함수() {
  // 2초 뒤에 녹화 시작 (그동안 마우스를 치우세요!)
  channel.postMessage({ type: "START_RECORDING", delay: 2000 });

  // 모든 작업이 끝나면 호출
  // channel.postMessage({ type: 'STOP_RECORDING' });
}
```

> [!TIP]
> `delay`를 2000(2초) 정도로 설정하면, 버튼을 누른 후 마우스를 화면 구석으로 치울 시간이 충분하여 결과물에 마우스 흔적이 남지 않습니다.

## 🚀 주요 기능

- **간편한 녹화**: 원클릭으로 현재 브라우저 탭 또는 전체 화면 녹화 시작.
- **자동 다운로드**: 추가적인 로직을 통해 제목이 깨지지 않는 안전한 저장 지원.
- **수동 저장 옵션**: 브라우저 보안 제약 우회를 위한 백업 버튼 지원.
- **고화질 지원**: WebM (VP9/Opus) 포맷을 사용하여 원본급 화질 유지.

## 📂 폴더 구조

- `src/engine/`: 핵심 녹화 엔진 (`recorder.js`)
- `src/ui/`: 사용자 인터페이스 및 테마 (`main.js`, `style.css`)
- `index.html`: 메인 대시보드

## 🛠 실행 방법

```bash
npm install
npm run dev
```

## 📝 라이선스

MIT License
