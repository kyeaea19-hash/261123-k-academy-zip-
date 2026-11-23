# AGENTS.md — AI 코딩 에이전트 작업 규칙

> 이 파일은 Antigravity IDE의 AI 코딩 에이전트(및 이 저장소에서 일하는 모든 AI·사람)가 **작업 전에 반드시 읽는 규칙서**입니다.
> 사람(비전공자)을 위한 설명은 `> 쉽게 말하면` 상자에 있습니다.

---

## 0. 가장 중요한 5가지 규칙

1. **추측하지 않는다.** 문서에 없는 결정이 필요하면 구현을 멈추고 사용자에게 질문한다. (질문 형식은 §7)
2. **문서가 기준이다.** 우선순위: `PRD.md` > `docs/*.md` > 기존 코드 > 에이전트 판단.
3. **범위 밖 기능을 만들지 않는다.** `PRD.md §5.8`(P2) 목록의 기능, 문서에 없는 "있으면 좋을 것 같은" 기능은 만들지 않는다.
4. **API 키는 절대 프론트엔드에 넣지 않는다.** `OPENAI_API_KEY` 는 `api/` 폴더의 서버 코드에서만 `process.env` 로 읽는다.
5. **한 번에 한 단계씩.** `docs/08-roadmap.md` 의 단계 순서대로 작업하고, 단계마다 완료 기준을 확인한 뒤 보고한다.

> **쉽게 말하면** — 에이전트는 "설계도에 적힌 것만, 적힌 순서대로" 짓는 시공사입니다. 설계도에 없는 부분은 마음대로 짓지 않고 건축주(사용자)에게 물어봅니다.

---

## 1. 프로젝트 개요 (요약)

- 서비스: **요약 zip** — 전력시장 디지털 인재 아카데미 학습 기록 웹앱
- 프론트엔드: 순수 HTML + CSS + JavaScript (ES Modules), **빌드 도구 없음**
- 백엔드: Node.js 22 — Vercel Serverless Functions (`api/` 폴더)
- AI: OpenAI API (Responses API + Structured Outputs), 공식 npm 패키지 `openai`
- 저장: 브라우저 IndexedDB (서버 DB 없음)
- 배포: Vercel
- 글꼴: 웹폰트 `A2z` (에이투지체)
- 디자인 기준: `docs/02-design-system.md` (첨부된 DESIGN-hp.md를 이 프로젝트용으로 옮긴 것)

---

## 2. 기술 제약 (반드시 지킬 것)

### 2.1 허용
| 영역 | 허용되는 것 |
|---|---|
| 프론트 언어 | HTML5, CSS3(CSS 변수 사용), JavaScript ES2022 (`type="module"`) |
| 프론트 라이브러리 | **없음.** 외부 JS 라이브러리·CDN 스크립트 사용 금지 (웹폰트 CSS 제외) |
| 백엔드 | Node.js 22, ES Modules (`"type": "module"`) |
| npm 의존성 | `dependencies`: `openai` 1개만. `devDependencies`: 없음 |
| 테스트 | Node 내장 테스트 러너 `node --test` (설치 불필요) |
| 아이콘 | 인라인 SVG만 (`public/js/components/icons.js` 에 모아서 관리) |

### 2.2 금지
- React, Vue, Svelte, jQuery, Tailwind, Bootstrap 등 프레임워크/라이브러리 **추가 금지**
- Vite, Webpack, TypeScript, Babel 등 빌드 단계 **추가 금지**
- Express 등 서버 프레임워크 **추가 금지** (Vercel 함수 + 직접 만든 개발 서버로 충분)
- `localStorage` 에 기록 데이터 저장 금지 (AI 접근 코드 1개만 예외: `docs/04-data-model.md §6`)
- `innerHTML` 에 **사용자 입력값을 그대로** 넣기 금지 → `textContent` 또는 `public/js/utils/dom.js` 의 `h()` 함수 사용
- 코드에 OpenAI 모델 이름 하드코딩 금지 → 환경변수 `OPENAI_MODEL` 사용
- `docs/02-design-system.md` 에 없는 색상 값(HEX) 사용 금지
- 콘솔에 사용자 메모 내용, API 키, 접근 코드를 `console.log` 하기 금지

> **쉽게 말하면** — "재료는 정해진 것만 쓴다"는 규칙입니다. 재료가 적을수록 고장이 적고, 비전공자도 코드를 따라 읽기 쉽습니다.

---

## 3. 폴더 구조 규칙

정확한 구조는 `docs/01-project-setup.md §3` 을 따른다. 요약:

```
academy-summary-zip/
├── AGENTS.md · PRD.md · README.md
├── docs/            ← 설계 문서 (코드 아님)
├── public/          ← 브라우저에 그대로 전달되는 파일 (HTML, CSS, JS, 이미지)
├── api/             ← 서버 코드 (Vercel 함수). `_lib/` 은 공용 코드
├── scripts/         ← 로컬 개발 서버
├── tests/           ← 자동 테스트
├── package.json · vercel.json · .env.example · .gitignore
```

- 새 폴더를 만들거나 파일 위치를 바꾸려면 먼저 질문한다.
- 1개 파일이 **400줄을 넘으면** 기능 단위로 나눈다(나누는 방법은 질문 없이 진행해도 됨, 단 보고에 적는다).

---

## 4. 코드 작성 규칙

### 4.1 이름 짓기
| 대상 | 규칙 | 예 |
|---|---|---|
| 파일 | kebab-case(소문자-하이픈) 단, JS 컴포넌트/페이지는 camelCase | `dev-server.mjs`, `dayPage.js` |
| 변수·함수 | camelCase | `saveDay`, `fieldIds` |
| 상수 | UPPER_SNAKE_CASE | `MAX_LEARNED_LENGTH` |
| CSS 클래스 | BEM 비슷하게 `블록__요소--상태` | `day-card__title`, `chip--active` |
| CSS 변수 | `--color-*`, `--font-*`, `--space-*`, `--radius-*`, `--shadow-*` | `--color-primary` |
| 데이터 필드 | `PRD.md §3` 용어표의 코드 이름 그대로 | `learned`, `reflection` |

### 4.2 주석
- 비전공자도 읽을 수 있게 **함수마다 한국어 한 줄 주석**을 단다. 예: `// 하루 기록을 IndexedDB에 저장한다`
- 복잡한 계산(주차 계산 등)에는 예시 입력/출력을 주석으로 단다.

### 4.3 상수 관리
- 글자 수 제한, 파일 크기 제한 등 숫자는 **`public/js/constants.js` 한 곳**에만 정의하고 가져다 쓴다.
- 서버도 같은 제한을 쓰므로 `api/_lib/limits.js` 에 같은 값을 정의한다. 두 파일의 값이 같은지 `tests/limits.test.js` 로 검사한다.

### 4.4 화면 문구
- 모든 화면 문구는 **한국어**, 존댓말(`~해요` 체). 예: "저장했어요", "분야 이름을 입력해 주세요".
- 버튼 문구는 동사로 끝낸다. 예: "메모지 추가", "백업 파일 내보내기".
- 오류 문구는 "무엇이 잘못됐는지 + 어떻게 하면 되는지"를 함께 쓴다. 예: "파일이 10MB보다 커요. 더 작은 파일을 올려 주세요."

### 4.5 오류 처리
- 모든 `await` 호출(IndexedDB, fetch)은 `try/catch` 로 감싸고, 실패 시 토스트(화면 아래 알림)로 알린다.
- 앱 전체가 멈추면 안 된다. 한 영역의 오류는 그 영역에만 오류 문구를 보여준다.

---

## 5. 보안 규칙

1. `OPENAI_API_KEY`, `OPENAI_MODEL`, `ACCESS_CODE` 는 `.env.local`(로컬)과 Vercel 환경변수(배포)에만 둔다. `.env*` 파일은 `.gitignore` 에 포함하고 **커밋 금지** (`.env.example` 만 커밋).
2. 브라우저 → 서버 요청은 우리 서버(`/api/*`)로만 보낸다. 브라우저에서 `api.openai.com` 으로 직접 요청 금지.
3. 서버는 받은 값을 **항상 다시 검사**한다(글자 수, 타입). 프론트 검사만 믿지 않는다.
4. 링크 첨부 URL은 `http://` 또는 `https://` 로 시작하는 것만 허용 (`javascript:` 등 차단).
5. 사용자 입력을 화면에 그릴 때는 반드시 텍스트로 넣는다(§2.2 `innerHTML` 금지 규칙).

---

## 6. 작업 진행 방식

### 6.1 작업 순서
`docs/08-roadmap.md` 의 Step 0 → Step 10 순서. **앞 단계 완료 기준을 통과하기 전에 다음 단계로 가지 않는다.**

### 6.2 단계 완료 보고 형식
각 단계가 끝나면 아래 형식으로 보고한다.

```markdown
## Step N 완료 보고 — (단계 이름)
### 만든/바꾼 파일
- public/js/db.js (새 파일) — IndexedDB 열기/읽기/쓰기
### 완료 기준 확인
- [x] 기준 1 … (어떻게 확인했는지 한 줄)
- [x] 기준 2 …
### 문서와 다르게 한 점
- 없음 (있으면 이유와 함께)
### 사용자가 직접 확인할 것
- 브라우저에서 http://localhost:3000 열고 ○○ 눌러 보기
```

### 6.3 변경 시 문서 동기화
- 코드가 문서와 달라져야 한다면, **먼저 사용자 승인**을 받고 → 코드와 해당 `docs/*.md` 를 **함께** 수정한다.
- 문서 맨 아래 "변경 이력" 표에 한 줄 추가한다.

### 6.4 Git 커밋 (사용자가 Git을 쓰는 경우)
- 단계마다 1개 이상 커밋. 메시지 형식: `[StepN] 요약` 예: `[Step3] 하루 기록 자동 저장 구현`
- 사용자가 요청하지 않으면 `push` 하지 않는다.

---

## 7. 질문해야 하는 상황과 질문 형식

### 7.1 반드시 질문하는 경우
- 문서끼리 내용이 서로 다를 때
- 문서에 없는 화면 문구·기능·데이터 필드가 필요할 때
- 새 npm 패키지, 외부 서비스, 새 폴더가 필요할 때
- 이미 저장된 데이터 구조(`docs/04-data-model.md`)를 바꿔야 할 때
- 완료 기준을 지킬 수 없을 때

### 7.2 질문하지 않고 진행해도 되는 경우
- 문서 범위 안에서의 함수 이름, 파일 분리, 내부 구현 방식
- 오타 수정, 주석 추가
- 문서에 정해진 값을 그대로 적용하는 일

### 7.3 질문 형식
```markdown
❓ 확인이 필요해요 — (한 줄 주제)
- 상황: (무엇을 하다가 막혔는지)
- 문서 근거: (어떤 문서 몇 절에 무엇이 있고/없는지)
- 선택지:
  A. … (장점/단점)
  B. … (장점/단점)
- 추천: A (이유 한 줄)
```

---

## 8. 완료의 정의 (Definition of Done)

어떤 작업이든 아래를 모두 만족해야 "완료"라고 말할 수 있다.

- [ ] 해당 기능의 PRD 요구사항 ID(예: F-NOTE-01)를 모두 충족
- [ ] `docs/09-qa-checklist.md` 의 관련 항목을 직접 수행해 통과
- [ ] `npm test` 실패 0개
- [ ] 브라우저 Console 빨간 오류 0개
- [ ] 360px(모바일)과 1280px(데스크톱) 폭에서 화면 확인
- [ ] 키보드(Tab/Enter/Esc)만으로 해당 기능 사용 가능
- [ ] 금지 규칙(§2.2, §5) 위반 없음

---

## 9. 문서 지도 — 무엇을 할 때 어떤 문서를 볼까

| 하려는 일 | 볼 문서 |
|---|---|
| 처음 프로젝트 만들기 | `docs/01-project-setup.md` |
| 색·글꼴·버튼 모양 정하기 | `docs/02-design-system.md` |
| 화면 배치 만들기 | `docs/03-ui-screens.md` |
| 데이터 저장 구조 | `docs/04-data-model.md` |
| 버튼 누르면 무슨 일이 일어나는지 | `docs/05-features.md` |
| 서버/AI 연결 | `docs/06-api-ai.md` |
| 배포 | `docs/07-deployment.md` |
| 작업 순서 | `docs/08-roadmap.md` |
| 다 됐는지 확인 | `docs/09-qa-checklist.md` |

---

## 변경 이력
| 날짜 | 버전 | 내용 |
|---|---|---|
| 2026-11-23 | v1.0 | 최초 작성 |
