# 01. 프로젝트 생성 지침

> 이 문서대로 하면 "빈 폴더 → 내 컴퓨터에서 실행되는 빈 화면"까지 만들어집니다.
> 기능 구현은 이 문서 범위가 아닙니다(`05-features.md`).

---

## 1. 준비물 (사용자 컴퓨터)

| 준비물 | 버전 | 확인 명령 (터미널) | 설명 |
|---|---|---|---|
| Node.js | **22.x** (LTS) | `node -v` → `v22.…` | 서버 코드 실행기. nodejs.org 에서 LTS 설치 |
| npm | Node에 포함 | `npm -v` | 부품 설치 도구 |
| Git | 아무 최신 버전 | `git --version` | 버전 관리 + Vercel 연결용 |
| 브라우저 | 최신 Chrome | — | 개발자도구(F12) 사용 |
| OpenAI API 키 | — | — | platform.openai.com → API keys 에서 발급 |
| Vercel 계정 | — | — | GitHub 계정으로 가입 (배포 단계에서 필요) |

> **에이전트 규칙**: Node 버전이 22가 아니면 설치를 진행하지 말고 사용자에게 Node 22 설치를 안내한다.

---

## 2. 생성 순서

```bash
# 1) 프로젝트 폴더로 이동 (이미 AGENTS.md, PRD.md, docs/ 가 들어 있는 폴더)
cd academy-summary-zip

# 2) package.json 생성 → 아래 §4 내용으로 덮어쓰기
npm init -y

# 3) OpenAI 공식 패키지 설치 (이것 1개만)
npm install openai

# 4) §3 폴더 구조대로 빈 파일 만들기 (에이전트가 수행)

# 5) 환경변수 파일 만들기
cp .env.example .env.local     # 그리고 .env.local 안에 실제 키 입력

# 6) 로컬 실행
npm run dev                    # → http://localhost:3000
```

---

## 3. 폴더 구조 (정확히 이대로)

```
academy-summary-zip/
├── AGENTS.md                      # 에이전트 작업 규칙
├── PRD.md                         # 제품 요구사항
├── README.md                      # 사람용 실행 안내 (Step 9에서 작성)
├── docs/                          # 설계 문서
│
├── public/                        # ── 브라우저로 그대로 전달되는 파일 ──
│   ├── index.html                 # 유일한 HTML 파일 (SPA)
│   ├── favicon.svg                # 파비콘 (02-design-system.md §8)
│   ├── css/
│   │   ├── fonts.css              # A2z @font-face 9개
│   │   ├── tokens.css             # 디자인 토큰(CSS 변수)
│   │   ├── base.css               # 초기화, 기본 글꼴, 레이아웃 컨테이너
│   │   ├── components.css         # 버튼, 카드, 칩, 입력창, 메모지, 모달, 토스트
│   │   └── pages.css              # 화면별 배치
│   └── js/
│       ├── main.js                # 시작점: DB 열기 → 첫 실행 확인 → 라우터 시작
│       ├── router.js              # 해시 라우팅
│       ├── constants.js           # 글자 수·파일 크기 등 모든 제한값
│       ├── db.js                  # IndexedDB 열기/기본 읽기·쓰기 (저수준)
│       ├── store.js               # 데이터 기능 함수 (getDay, saveDay, …) (고수준)
│       ├── api.js                 # /api/* 호출 함수
│       ├── backup.js              # 백업 내보내기/가져오기
│       ├── utils/
│       │   ├── dom.js             # h() 요소 생성 함수, clear(), $()
│       │   ├── date.js            # 날짜 포맷, 주차 계산, 기간 날짜 생성
│       │   ├── id.js              # 고유 ID 생성
│       │   ├── debounce.js        # 디바운스
│       │   ├── format.js          # 파일 크기 표시(1.2MB), hashText 등
│       │   ├── fileTypes.js       # 첨부 허용 확장자 표 + 검사 함수 (05 §6.3)
│       │   └── backupSchema.js    # 백업 파일 검증 validateBackup() (05 §8.2)
│       ├── components/
│       │   ├── icons.js           # 인라인 SVG 아이콘 모음
│       │   ├── header.js          # 유틸리티 스트립 + 상단 내비게이션
│       │   ├── footer.js          # 다크 푸터
│       │   ├── toast.js           # 토스트 알림
│       │   ├── modal.js           # 모달(대화상자), 확인창
│       │   ├── dayCard.js         # 날짜 카드
│       │   ├── fieldChip.js       # 분야 칩/배지
│       │   ├── growthNote.js      # 성장 기록 메모지
│       │   ├── aiPanel.js         # AI 결과 카드 (요약 표시 + 생성 버튼)
│       │   ├── teamLogCard.js     # 팀플 일지 카드
│       │   └── attachmentList.js  # 첨부 목록 + 업로드
│       └── pages/
│           ├── homePage.js        # #/
│           ├── dayPage.js         # #/day/:date
│           ├── fieldsPage.js      # #/fields
│           ├── fieldDetailPage.js # #/fields/:id (일반/팀플 분기)
│           ├── searchPage.js      # #/search?q=
│           ├── settingsPage.js    # #/settings
│           ├── onboarding.js      # 첫 실행 "과정 설정" 모달
│           └── notFoundPage.js    # 404
│
├── api/                           # ── 서버 코드 (Vercel Functions) ──
│   ├── health.js                  # GET  /api/health
│   ├── summarize-day.js           # POST /api/summarize-day
│   ├── summarize-field.js         # POST /api/summarize-field
│   ├── suggest-fields.js          # POST /api/suggest-fields
│   └── _lib/                      # 밑줄(_)로 시작 → Vercel이 주소로 만들지 않음
│       ├── http.js                # readJson, sendJson, 메서드 검사, 접근 코드 검사
│       ├── limits.js              # 서버용 제한값 (constants.js 와 같은 값)
│       ├── validate.js            # 입력 검사 함수
│       └── openai.js              # OpenAI 클라이언트 + 구조화 응답 호출 함수
│
├── scripts/
│   └── dev-server.mjs             # 로컬 개발 서버 (정적 파일 + /api 연결)
│
├── tests/                         # node --test 로 실행
│   ├── date.test.js
│   ├── validate.test.js
│   ├── limits.test.js
│   ├── format.test.js
│   ├── fileTypes.test.js
│   └── backup.test.js
│
├── package.json
├── vercel.json
├── .env.example
└── .gitignore
```

**규칙**
- `public/js/constants.js` 와 `public/js/utils/` 안의 파일은 **순수 함수만** 담는다: 파일 맨 위(함수 밖)에서 `window`, `document`, `indexedDB`, `localStorage` 같은 브라우저 전용 객체를 건드리지 않는다. 그래야 `tests/` 에서 Node로 바로 불러와 테스트할 수 있다. (`dom.js` 는 예외 — 테스트 대상 아님)
- `public/` 밖의 파일은 브라우저에서 직접 열 수 없다(서버 코드 보호).
- `public/js` 의 파일은 `import` 할 때 **확장자 `.js` 까지** 적는다. 예: `import { h } from './utils/dom.js';`
- `api/` 바로 아래 `.js` 파일 1개 = 주소 1개 (`api/health.js` → `/api/health`).

---

## 4. 설정 파일 내용

### 4.1 `package.json`
```json
{
  "name": "academy-summary-zip",
  "version": "1.0.0",
  "private": true,
  "description": "전력시장 디지털 인재 아카데미 학습 기록 웹앱 - 요약 zip",
  "type": "module",
  "engines": { "node": "22.x" },
  "scripts": {
    "dev": "node scripts/dev-server.mjs",
    "test": "node --test tests/"
  },
  "dependencies": {
    "openai": "(npm install 이 자동으로 적는 버전 그대로 둔다)"
  }
}
```
> `dependencies` 의 버전 문자열은 `npm install openai` 실행 결과를 그대로 둔다. 손으로 바꾸지 않는다.

### 4.2 `vercel.json`
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "outputDirectory": "public",
  "functions": {
    "api/*.js": { "maxDuration": 30 }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-Frame-Options", "value": "DENY" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self' https://cdn.jsdelivr.net; img-src 'self' blob: data:; connect-src 'self'; media-src 'self' blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        }
      ]
    }
  ]
}
```
**CSP(콘텐츠 보안 정책) 때문에 생기는 코딩 규칙**
- HTML에 `<script>…</script>` 인라인 코드, `onclick="…"` 속성 금지 → 모든 JS는 파일로, 이벤트는 `addEventListener`.
- HTML의 `style="…"` 속성, `el.setAttribute('style', …)` 금지 → 클래스를 쓰고, 동적 값(메모지 기울기 등)은 `el.style.setProperty('--tilt', '-1deg')` 처럼 **JS 속성으로** 넣는다.
- 외부에서 불러오는 것은 웹폰트(`cdn.jsdelivr.net`)뿐이다.

### 4.3 `.env.example` (커밋함 — 값은 비워 둠)
```bash
# OpenAI API 키 (platform.openai.com 에서 발급). 절대 커밋 금지.
OPENAI_API_KEY=
# 사용할 OpenAI 모델 이름. OpenAI 공식 문서 Models 페이지에서 확인해 입력.
# Responses API + Structured Outputs(json_schema)를 지원하는 모델이어야 함.
OPENAI_MODEL=
# (선택) AI 기능 접근 코드. 비워 두면 누구나 AI 기능 사용 가능.
# 배포 사이트에서는 반드시 설정 권장 (남이 내 API 요금을 쓰지 못하게).
ACCESS_CODE=
```

### 4.4 `.gitignore`
```
node_modules/
.env
.env.local
.env.*.local
.vercel/
.DS_Store
Thumbs.db
```

---

## 5. 로컬 개발 서버 `scripts/dev-server.mjs` 명세

> **쉽게 말하면** — 내 컴퓨터에서 Vercel과 똑같이 동작하는 "연습용 서버"입니다. 추가 설치 없이 Node만으로 돌아갑니다.

| 항목 | 동작 |
|---|---|
| 포트 | `process.env.PORT` 또는 `3000` |
| 환경변수 | 시작 시 `process.loadEnvFile('.env.local')` 호출. 파일이 없으면 경고 한 줄 출력 후 계속 실행 |
| `/api/<이름>` 요청 | `api/<이름>.js` 가 있으면 `import()` 해서 `default` 함수를 `(req, res)` 로 호출. 없으면 404 JSON `{ "error": { "code": "NOT_FOUND", "message": "없는 API예요." } }`. 이름에 `/`, `.`, `_` 로 시작하는 값이 있으면 404 |
| 그 외 요청 | `public/` 안의 파일을 돌려준다. `/` 는 `public/index.html`. 경로에 `..` 가 있으면 403 |
| MIME 타입 | `.html` text/html; charset=utf-8, `.css` text/css, `.js`/`.mjs` text/javascript, `.svg` image/svg+xml, `.png`, `.jpg`, `.webp`, `.ico`, `.json` application/json, 그 외 application/octet-stream |
| 보안 헤더 | `vercel.json` 을 읽어 `headers[0].headers` 를 모든 응답에 붙인다 (배포와 같은 조건에서 개발) |
| 로그 | `GET /api/health 200 12ms` 형식으로 한 줄씩 출력. 요청 본문은 출력하지 않음 |
| 외부 패키지 | 사용 금지 (`node:http`, `node:fs/promises`, `node:path`, `node:url` 만) |

---

## 6. `public/index.html` 뼈대

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>요약.zip — 전력시장 디지털 인재 아카데미</title>
  <meta name="description" content="전력시장 디지털 인재 아카데미 학습 기록" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
  <link rel="stylesheet" href="/css/fonts.css" />
  <link rel="stylesheet" href="/css/tokens.css" />
  <link rel="stylesheet" href="/css/base.css" />
  <link rel="stylesheet" href="/css/components.css" />
  <link rel="stylesheet" href="/css/pages.css" />
  <script type="module" src="/js/main.js"></script>
</head>
<body>
  <a class="skip-link" href="#main">본문으로 건너뛰기</a>
  <div id="app-header"></div>
  <main id="main" tabindex="-1"></main>
  <div id="app-footer"></div>
  <div id="modal-root"></div>
  <div id="toast-root" aria-live="polite" aria-atomic="true"></div>
  <noscript>이 서비스는 JavaScript가 켜져 있어야 동작해요.</noscript>
</body>
</html>
```

---

## 7. 완료 기준 (이 문서 범위)

- [ ] §3 구조대로 폴더·파일이 존재한다 (내용이 빈 파일이어도 됨, 단 JS 파일은 문법 오류 없음)
- [ ] `npm run dev` 실행 후 `http://localhost:3000` 에서 빈 화면(헤더 자리)이 보이고 Console 오류가 없다
- [ ] `http://localhost:3000/api/health` 가 JSON을 돌려준다 (`06-api-ai.md §3.1`)
- [ ] `http://localhost:3000/api/없는주소` 가 404 JSON을 돌려준다
- [ ] `http://localhost:3000/../package.json` 같은 경로 접근이 차단된다
- [ ] `npm test` 가 실행된다 (테스트 파일이 아직 비어 있어도 실패 0개)
- [ ] `git status` 에 `.env.local` 이 나타나지 않는다

## 변경 이력
| 날짜 | 버전 | 내용 |
|---|---|---|
| 2026-11-23 | v1.0 | 최초 작성 |
