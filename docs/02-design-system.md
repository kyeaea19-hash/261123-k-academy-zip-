# 02. 디자인 시스템 (UI 구현 지침 ①)

> 사용자가 첨부한 `DESIGN-hp.md`(HP 디자인 언어 분석 문서)의 **색·간격·모서리·그림자·컴포넌트 규칙을 그대로 가져오고**, 다음 3가지만 이 프로젝트에 맞게 바꿨습니다.
>
> | 바꾼 것 | 원본 | 이 프로젝트 | 이유 |
> |---|---|---|---|
> | 글꼴 | Forma DJR Micro | **A2z (에이투지체) 웹폰트** | 사용자 지정, 한글 지원 |
> | 줄 간격 | 제목 1.0 / 본문 1.38 | **제목 1.25 / 본문 1.6** | 한글은 글자 높이가 커서 1.0이면 위아래가 잘리고 답답함 |
> | 버튼 글자 | 대문자 변환 + 0.7px 자간 | **대문자 변환 없음(영문만 적용) + 0.02em 자간** | 한글에는 대소문자가 없음 |
>
> **HP 로고, "HP" 이름, HP 제품 사진은 사용하지 않습니다.** 파란 사선 장식(쉐브론)은 이 프로젝트에서 "전력·전류"를 뜻하는 자체 장식으로 사용합니다.

---

## 1. 디자인 원칙 (한눈에)

1. **흰 바탕 + 검정 글자**가 90%. **파란색으로 채운 면**(`.btn--primary` 버튼, 쉐브론 장식)은 **한 화면(뷰포트)에 최대 2개**. 링크 글자·활성 메뉴 밑줄·포커스 테두리처럼 선/글자로 쓰인 파란색은 이 개수에 넣지 않는다.
2. **버튼은 각지게(4px), 카드는 둥글게(16px).** 이 대비가 시각적 특징이다.
3. 깊이는 그림자보다 **배경색 차이**(흰색 ↔ 연회색 띠)로 표현한다. 그림자는 카드에만 약하게.
4. 페이지의 끝은 항상 **진한 검정(잉크) 띠**(푸터)로 닫는다.
5. 제목도 굵기 **500**(Medium). 크게 키워도 700으로 올리지 않는다.

---

## 2. 글꼴 (웹폰트)

### 2.1 `public/css/fonts.css` — 아래 내용을 **그대로** 붙여 넣는다
```css
/* A2z(에이투지체) 웹폰트 — 브라우저는 실제로 쓰인 굵기의 파일만 내려받는다 */
@font-face { font-family: 'A2z'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-6@1.0/에이투지체-1Thin.woff2') format('woff2'); font-weight: 100; font-display: swap; }
@font-face { font-family: 'A2z'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-6@1.0/에이투지체-2ExtraLight.woff2') format('woff2'); font-weight: 200; font-display: swap; }
@font-face { font-family: 'A2z'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-6@1.0/에이투지체-3Light.woff2') format('woff2'); font-weight: 300; font-display: swap; }
@font-face { font-family: 'A2z'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-6@1.0/에이투지체-4Regular.woff2') format('woff2'); font-weight: 400; font-display: swap; }
@font-face { font-family: 'A2z'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-6@1.0/에이투지체-5Medium.woff2') format('woff2'); font-weight: 500; font-display: swap; }
@font-face { font-family: 'A2z'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-6@1.0/에이투지체-6SemiBold.woff2') format('woff2'); font-weight: 600; font-display: swap; }
@font-face { font-family: 'A2z'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-6@1.0/에이투지체-7Bold.woff2') format('woff2'); font-weight: 700; font-display: swap; }
@font-face { font-family: 'A2z'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-6@1.0/에이투지체-8ExtraBold.woff2') format('woff2'); font-weight: 800; font-display: swap; }
@font-face { font-family: 'A2z'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2601-6@1.0/에이투지체-9Black.woff2') format('woff2'); font-weight: 900; font-display: swap; }
```

### 2.2 사용하는 굵기
이 프로젝트 화면에서는 **400, 500, 600, 700 만** 사용한다. (100~300, 800~900은 선언만 하고 쓰지 않음 → 다운로드되지 않음)

### 2.3 대체 글꼴(웹폰트 로딩 전·실패 시)
```css
--font-sans: 'A2z', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', '맑은 고딕', sans-serif;
```

### 2.4 글자 크기 단계 (Typography Tokens)

| 토큰 | 크기 | 굵기 | 줄간격 | 쓰는 곳 |
|---|---|---|---|---|
| `display-xl` | 56px | 500 | 1.2 | (예비) 쓰지 않음 |
| `display-lg` | 44px | 500 | 1.2 | 홈 히어로 제목 (데스크톱) |
| `display-md` | 32px | 500 | 1.25 | 페이지 제목 (하루 기록 날짜, 분야 이름) |
| `display-sm` | 24px | 500 | 1.3 | 섹션 제목 ("성장 기록 메모지", "1주차") |
| `display-xs` | 20px | 500 | 1.35 | 카드 제목, 모달 제목 |
| `body-lg` | 18px | 400 | 1.6 | 히어로 설명문, 모바일 메뉴 |
| `body-md` | 16px | 400 | 1.6 | 기본 본문, 입력창 |
| `body-emphasis` | 16px | 500 | 1.6 | 라벨, 강조 문장, 칩 글자 |
| `caption-md` | 14px | 400 | 1.55 | 보조 설명, 날짜, 글자 수 |
| `caption-bold` | 14px | 700 | 1.4 | TODAY 배지, 숫자 강조 |
| `caption-sm` | 12px | 400 | 1.5 | 각주, 법적 안내, 파일 크기 |
| `button-md` | 14px | 600 | 1.4 | 버튼 글자 (자간 0.02em) |
| `button-sm` | 13px | 700 | 1.2 | 작은 버튼 (자간 0.02em) |
| `stat-md` | 24px | 500 | 1.2 | 히어로의 숫자 통계 ("12일") — 원본 `price-md` 대체 |

**규칙**: 12px 미만 글자 금지. 기울임꼴(italic) 금지. 강조는 굵기로만.

---

## 3. 색상

### 3.1 색상 토큰 (원본과 동일 — 이 표에 없는 색은 쓰지 않는다)

| 분류 | CSS 변수 | 값 | 이 프로젝트에서 쓰는 곳 |
|---|---|---|---|
| 브랜드 | `--color-primary` | `#024ad8` | 주요 버튼, 링크, 쉐브론 장식, 활성 메뉴 밑줄, 포커스 테두리 |
| | `--color-primary-bright` | `#296ef9` | 어두운 배경(푸터·다크 띠) 위의 링크/버튼 |
| | `--color-primary-deep` | `#0e3191` | 주요 버튼 눌림(active) 상태, 방문한 링크 |
| | `--color-primary-soft` | `#c9e0fc` | 메모지(파랑), AI 결과 카드 배경, 선택된 항목 배경 |
| | `--color-on-primary` | `#ffffff` | 파란 배경 위 글자 |
| 글자 | `--color-ink` | `#1a1a1a` | 기본 글자, 다크 띠 배경, 잉크 버튼 |
| | `--color-ink-deep` | `#000000` | 로고 글자 |
| | `--color-ink-soft` | `#292929` | 다크 띠 안의 구분 면 |
| | `--color-on-ink` | `#ffffff` | 다크 띠 위 글자 |
| | `--color-charcoal` | `#3d3d3d` | 보조 본문 (미리보기 글, 설명문) |
| | `--color-graphite` | `#636363` | 메타 정보 (날짜, 글자 수, 저장 상태) |
| 면 | `--color-canvas` | `#ffffff` | 페이지 바탕 |
| | `--color-paper` | `#ffffff` | 카드 바탕 |
| | `--color-cloud` | `#f7f7f7` | 번갈아 나오는 회색 띠, 입력 영역 묶음 배경 |
| | `--color-fog` | `#e8e8e8` | 진한 회색 띠, 메모지(회색), 빈 상태 박스 |
| | `--color-steel` | `#c2c2c2` | 입력창 테두리, 비활성 버튼 |
| | `--color-hairline` | `#e8e8e8` | 1px 구분선 |
| | `--color-hairline-strong` | `#c2c2c2` | 강한 구분선 |
| 보조 | `--color-bloom-coral` | `#ff5050` | "TODAY" 점 표시 1곳에만 |
| | `--color-bloom-rose` | `#f9d4d2` | 메모지(분홍) |
| | `--color-bloom-deep` | `#b3262b` | 오류 글자, 삭제 버튼 글자 |
| | `--color-bloom-wine` | `#5a1313` | (사용 안 함) |
| | `--color-storm-mist` | `#8ebdce` | 메모지(하늘) |
| | `--color-storm-sea` | `#7fadbe` | 분야 색 "바다" |
| | `--color-storm-deep` | `#356373` | 분야 색 "청록", 팀플 배지 |
| 상태 | `--color-error` | `#b3262b` | 오류 |

### 3.2 성장 기록 메모지 색상 (4종 — 코드 값 고정)

| 코드 값 (`GrowthNote.color`) | 화면 이름 | 배경 | 글자 |
|---|---|---|---|
| `blue` (기본) | 파랑 | `--color-primary-soft` | `--color-ink` |
| `rose` | 분홍 | `--color-bloom-rose` | `--color-ink` |
| `mist` | 하늘 | `--color-storm-mist` | `--color-ink` |
| `fog` | 회색 | `--color-fog` | `--color-ink` |

### 3.3 분야 색상 (6종 — 코드 값 고정)
분야 색은 **칩 앞의 10px 동그라미 점**과 분야 카드 위쪽 4px 띠에만 쓴다(넓은 면 채우기 금지).

| 코드 값 (`Field.color`) | 화면 이름 | 값 |
|---|---|---|
| `blue` (기본) | 파랑 | `--color-primary` |
| `navy` | 남색 | `--color-primary-deep` |
| `teal` | 청록 | `--color-storm-deep` |
| `sea` | 바다 | `--color-storm-sea` |
| `brick` | 벽돌 | `--color-bloom-deep` |
| `charcoal` | 먹색 | `--color-charcoal` |

---

## 4. 간격 · 모서리 · 그림자 · 레이아웃

### 4.1 간격 (8px 기준)
| 토큰 | 값 | 주 용도 |
|---|---|---|
| `--space-xxs` | 4px | 아이콘-글자 사이 |
| `--space-xs` | 8px | 칩 사이, 작은 간격 |
| `--space-sm` | 12px | 버튼 세로 안쪽 여백, 폼 요소 사이 |
| `--space-md` | 16px | 작은 카드 안쪽 여백, 모바일 좌우 여백 |
| `--space-lg` | 20px | 메모지 안쪽 여백 |
| `--space-xl` | 24px | 카드 안쪽 여백, 그리드 간격 |
| `--space-xxl` | 32px | 큰 카드 안쪽 여백, 데스크톱 좌우 여백 |
| `--space-section` | 80px | 큰 영역(띠) 사이 — 모바일(<768px)은 48px |

### 4.2 모서리 (두 단계 원칙: 버튼 각지게 / 카드 둥글게)
| 토큰 | 값 | 용도 |
|---|---|---|
| `--radius-none` | 0 | 쉐브론 장식 |
| `--radius-sm` | 3px | 작은 태그 |
| `--radius-md` | 4px | **모든 버튼, 입력창** |
| `--radius-lg` | 8px | 배지, 메모지, 첨부 항목, 아코디언 줄 |
| `--radius-xl` | 16px | **모든 카드**, 히어로, 모달, 이미지 프레임 |
| `--radius-pill` | 9999px | 분야 칩, 필터 탭, 검색창 |

> 버튼에 8px 이상 둥근 모서리 금지.

### 4.3 그림자 (깊이)
| 단계 | 토큰 | 값 | 용도 |
|---|---|---|---|
| 0 평면 | — | 없음 | 띠(섹션 배경), 히어로 바깥 |
| 1 선 | — | `1px solid var(--color-hairline)` | 아웃라인 버튼, 입력 영역, 아코디언 |
| 2 살짝 뜸 | `--shadow-soft` | `0 2px 8px rgba(26,26,26,0.08)` | 날짜 카드, 분야 카드, 메모지, 팀플 일지 카드 |
| 3 떠 있음 | `--shadow-float` | `0 8px 24px rgba(26,26,26,0.12)` | 모달, 토스트, 모바일 메뉴 |

### 4.4 레이아웃
- 바깥 컨테이너 최대 폭 `--container-max: 1366px`, 좌우 여백 데스크톱 32px / 모바일 16px.
- **글 쓰는 화면(하루 기록, 설정)의 본문 폭은 최대 880px** (`--content-max: 880px`) — 긴 글 읽기 편하게.
- 그리드 간격 24px(데스크톱) / 16px(태블릿·모바일).

### 4.5 반응형 구간 (Breakpoints)
| 이름 | 폭 | 날짜 카드 열 수 | 내비게이션 |
|---|---|---|---|
| Mobile | < 480px | 1 | 햄버거 메뉴 |
| Mobile-L | 480–767px | 1 | 햄버거 메뉴 |
| Tablet | 768–1023px | 2 | 햄버거 메뉴 |
| Desktop | 1024–1279px | 3 | 전체 메뉴 |
| Desktop-L | ≥ 1280px | 4 | 전체 메뉴 |

CSS는 **모바일 우선**으로 작성하고 `@media (min-width: 480px)`, `768px`, `1024px`, `1280px` 로 넓혀 간다.

---

## 5. `public/css/tokens.css` — 아래 내용을 그대로 사용

```css
:root {
  /* 글꼴 */
  --font-sans: 'A2z', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', '맑은 고딕', sans-serif;

  /* 색 — 브랜드 */
  --color-primary: #024ad8;
  --color-primary-bright: #296ef9;
  --color-primary-deep: #0e3191;
  --color-primary-soft: #c9e0fc;
  --color-on-primary: #ffffff;
  /* 색 — 글자 */
  --color-ink: #1a1a1a;
  --color-ink-deep: #000000;
  --color-ink-soft: #292929;
  --color-on-ink: #ffffff;
  --color-charcoal: #3d3d3d;
  --color-graphite: #636363;
  /* 색 — 면 */
  --color-canvas: #ffffff;
  --color-paper: #ffffff;
  --color-cloud: #f7f7f7;
  --color-fog: #e8e8e8;
  --color-steel: #c2c2c2;
  --color-hairline: #e8e8e8;
  --color-hairline-strong: #c2c2c2;
  /* 색 — 보조 */
  --color-bloom-coral: #ff5050;
  --color-bloom-rose: #f9d4d2;
  --color-bloom-deep: #b3262b;
  --color-bloom-wine: #5a1313;
  --color-storm-mist: #8ebdce;
  --color-storm-sea: #7fadbe;
  --color-storm-deep: #356373;
  --color-error: #b3262b;

  /* 글자 크기 */
  --fs-display-xl: 56px;
  --fs-display-lg: 44px;
  --fs-display-md: 32px;
  --fs-display-sm: 24px;
  --fs-display-xs: 20px;
  --fs-body-lg: 18px;
  --fs-body-md: 16px;
  --fs-caption-md: 14px;
  --fs-caption-sm: 12px;
  --fs-button-md: 14px;
  --fs-button-sm: 13px;
  --fs-stat-md: 24px;
  /* 줄 간격 (한글 보정) */
  --lh-display: 1.25;
  --lh-body: 1.6;
  --lh-caption: 1.55;
  --ls-button: 0.02em;

  /* 간격 */
  --space-xxs: 4px;
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 16px;
  --space-lg: 20px;
  --space-xl: 24px;
  --space-xxl: 32px;
  --space-section: 48px;

  /* 모서리 */
  --radius-none: 0;
  --radius-sm: 3px;
  --radius-md: 4px;
  --radius-lg: 8px;
  --radius-xl: 16px;
  --radius-pill: 9999px;

  /* 그림자 */
  --shadow-soft: 0 2px 8px rgba(26, 26, 26, 0.08);
  --shadow-float: 0 8px 24px rgba(26, 26, 26, 0.12);

  /* 레이아웃 */
  --container-max: 1366px;
  --content-max: 880px;
  --gutter: 16px;
  --page-pad: 16px;
  --utility-h: 36px;
  --nav-h: 64px;
  --control-h: 44px;

  /* 움직임 */
  --ease: cubic-bezier(0.2, 0, 0, 1);
  --dur-fast: 120ms;
  --dur-base: 200ms;
}

@media (min-width: 768px) {
  :root { --space-section: 80px; --gutter: 24px; --page-pad: 32px; }
}

@media (prefers-reduced-motion: reduce) {
  :root { --dur-fast: 0ms; --dur-base: 0ms; }
}
```

---

## 6. 컴포넌트 시각 명세

> "어떻게 생겼나"만 정의합니다. 어떤 화면 어디에 놓이는지는 `03-ui-screens.md`.
> **호버(hover) 상태**: 원본 문서는 호버를 정의하지 않습니다. 이 프로젝트는 아래 규칙 하나만 씁니다 — 버튼은 `filter: brightness(0.95)`, 카드는 그림자를 `--shadow-float` 로. 그 외 호버 효과 금지.

### 6.1 버튼 (공통: 높이 44px, 안쪽 여백 12px 24px, 모서리 4px, `button-md`)
| 클래스 | 배경 | 글자 | 테두리 | 용도 |
|---|---|---|---|---|
| `.btn.btn--primary` | primary | on-primary | 없음 | 화면의 가장 중요한 행동 1개 (화면당 최대 1개) |
| `.btn.btn--primary:active` | primary-deep | on-primary | — | 눌림 |
| `.btn:disabled` | steel | on-primary | 없음 | 비활성 (`cursor: not-allowed`) |
| `.btn.btn--ink` | ink | on-ink | 없음 | 두 번째로 중요한 행동, 모달의 확인 |
| `.btn.btn--outline` | canvas | primary | 1px primary | 보조 행동 (파란색 사용 횟수에 포함) |
| `.btn.btn--outline-ink` | canvas | ink | 1px ink | 일반 보조 행동 (가장 많이 씀) |
| `.btn.btn--danger` | canvas | bloom-deep | 1px bloom-deep | 삭제 |
| `.btn.btn--text` | 투명 | primary | 없음, 밑줄 | "더 보기" 류 링크형 |
| `.btn--sm` | — | — | — | 높이 36px, 여백 8px 16px, `button-sm` (모바일에서도 탭 영역은 44px 유지: `::after` 로 확장) |
| `.icon-btn` | 투명 | ink | 없음 | 44×44 영역 + 24×24 아이콘. 반드시 `aria-label` |

### 6.2 카드 (공통: 모서리 16px, 배경 paper)
| 클래스 | 안쪽 여백 | 그림자 | 용도 |
|---|---|---|---|
| `.card` | 24px | soft | 날짜 카드, 분야 카드 (원본 `card-product`) |
| `.card--feature` | 32px | 없음, 배경 cloud | 묶음 영역 (원본 `card-product-feature`) |
| `.card--compact` | 16px | soft | 검색 결과, 팀플 타임라인 항목 (원본 `card-article-tile`) |
| `.panel-dark` | 32px 48px (모바일 24px) | 없음, 배경 ink, 글자 on-ink | 팀 정보 패널 (원본 `promo-strip-dark`) |

### 6.3 입력창
- `.input`, `.textarea`, `.select`: 배경 canvas, 글자 ink, `body-md`, 모서리 4px, 1px steel 테두리, 안쪽 여백 12px 16px, `.input` 높이 44px.
- 포커스: 테두리 1px ink → **추가로** 전역 포커스 규칙(§6.8) 적용.
- `.textarea`: 최소 높이 160px(배운 내용) / 120px(느낀 점) / 96px(팀플 진행 내용), 세로 크기 조절 가능(`resize: vertical`).
- 라벨: 입력창 위, `body-emphasis`, 아래 간격 8px. 필수 표시는 라벨 뒤 `(필수)` 글자 — 빨간 별표 금지.
- 도움말/글자 수: 입력창 아래 오른쪽, `caption-md`, graphite. 90% 넘으면 ink, 100%면 bloom-deep.
- 오류 문구: 입력창 아래 왼쪽, `caption-md`, bloom-deep, 입력창 테두리도 bloom-deep. `aria-describedby` 로 연결.

### 6.4 칩 · 배지 · 탭
| 클래스 | 모양 | 용도 |
|---|---|---|
| `.chip` | 모서리 pill, 1px hairline-strong 테두리, 배경 canvas, `body-emphasis` 14px, 여백 6px 14px, 앞에 10px 분야색 점 | 분야 칩(선택 가능) |
| `.chip[aria-pressed="true"]` | 배경 ink, 글자 on-ink, 테두리 ink, 점은 그대로 | 선택된 분야 |
| `.tab` / `.tab--active` | pill, 여백 8px 20px(터치 기기 12px 24px), `body-emphasis` / 활성: 배경 ink 글자 on-ink | 필터 탭 (원본 `category-tab`) |
| `.badge` | 모서리 8px, 여백 4px 10px, `caption-bold`, 배경 ink, 글자 on-ink | TODAY, 팀플 |
| `.badge--outline` | 배경 canvas, 1px ink 테두리, 글자 ink | N일차, 상태 |
| `.badge--team` | 배경 storm-deep, 글자 on-ink | "팀플" 표시 |
| `.badge--ai` | 배경 primary-soft, 글자 primary-deep | "AI" 표시 |

### 6.5 성장 기록 메모지 `.note`
- 크기: 그리드 셀에 맞춤(최소 폭 200px), 최소 높이 160px, 정사각형에 가깝게.
- 배경: §3.2 메모지 색, 모서리 8px, 그림자 soft, 안쪽 여백 20px.
- 기울기: 카드마다 `--tilt` 값을 `-1deg, 0.5deg, -0.5deg, 1deg` 순서로 돌려 쓰기(`transform: rotate(var(--tilt))`). 포커스·편집 중에는 0deg. `prefers-reduced-motion` 이면 항상 0deg.
- 위쪽: 종류 라벨(`관심`/`궁금`/`다짐`) — `caption-bold`, 앞에 작은 아이콘(관심=전구, 궁금=물음표, 다짐=깃발).
- 가운데: 내용 `body-md`, 줄바꿈 유지(`white-space: pre-wrap`).
- 아래쪽: 작성 시각 `caption-sm` graphite + 오른쪽에 수정·삭제 아이콘 버튼.
- "+ 메모지 추가" 칸: 같은 크기의 점선(1px dashed steel) 박스, 가운데 + 아이콘과 "메모지 추가".

### 6.6 쉐브론 장식 `.chevrons` (원본 `chevron-decoration`)
- 파란(primary) **평행사변형 2개**, 모서리 0, 그림자 없음.
- CSS: `clip-path: polygon(30% 0, 100% 0, 70% 100%, 0 100%);` 폭 48px, 높이 = 히어로 카드 높이의 100%, 두 개 사이 간격 12px.
- 위치: **홈 히어로 카드의 왼쪽 바깥과 오른쪽 바깥에만**. 다른 곳 사용 금지.
- 태블릿(768–1023px): 60% 크기. 모바일(<768px): 숨김(`display: none`).
- 장식이므로 `aria-hidden="true"`.

### 6.7 모달 · 토스트
- 모달: 화면 가운데, 최대 폭 560px(모바일은 좌우 16px 여백), 모서리 16px, 그림자 float, 안쪽 여백 32px(모바일 24px). 뒤 배경 `rgba(26,26,26,0.5)`. 제목 `display-xs`. 버튼은 오른쪽 아래 정렬(취소=outline-ink, 확인=ink, 삭제 확인=danger).
- 토스트: 화면 아래 가운데, 배경 ink, 글자 on-ink, 모서리 8px, 그림자 float, 여백 12px 20px, `body-md`. 3초 후 사라짐(오류는 6초). 동시에 최대 3개 쌓임.

### 6.8 포커스 · 접근성 공통
```css
:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.panel-dark :focus-visible, .site-footer :focus-visible { outline-color: var(--color-primary-bright); }
```
- 모든 클릭 요소는 최소 44×44px 탭 영역.
- 아이콘만 있는 버튼은 `aria-label` 필수.
- 색만으로 정보를 전달하지 않는다(분야 칩에는 항상 이름 글자가 함께).

---

## 7. 아이콘 (`public/js/components/icons.js`)

- 모두 **인라인 SVG**, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.75"`, 선 끝 둥글게.
- 필요한 아이콘 목록(이것만 만든다): `plus`, `close`, `edit`, `trash`, `chevronLeft`, `chevronRight`, `chevronDown`, `arrowUp`, `arrowDown`, `search`, `menu`, `settings`, `sparkle`(AI), `bulb`(관심), `question`(궁금), `flag`(다짐), `file`, `image`, `link`, `download`, `upload`, `calendar`, `folder`, `users`(팀플), `check`, `alert`.
- 함수 형태: `icon('plus', { size: 20, label: '추가' })` → SVG 요소 반환. `label` 이 없으면 `aria-hidden="true"`.

---

## 8. 로고 · 파비콘

- 로고(헤더 왼쪽): 글자 `요약.zip` — `display-xs`(20px), 굵기 700, ink-deep. 점(`.`)만 primary 색. 앞에 작은 쉐브론 2개(각 8×16px, primary). 클릭하면 홈.
- 파비콘 `public/favicon.svg`: 32×32, ink 바탕 모서리 6px 사각형 위에 primary 평행사변형 2개.

---

## 9. 해야 할 것 / 하지 말 것

**해야 할 것**
- 파란색으로 채운 면(주요 버튼·쉐브론)은 한 화면에 최대 2개, 주요 버튼은 화면당 1개.
- 카드 16px / 버튼·입력창 4px 모서리 지키기.
- 흰 띠와 cloud(#f7f7f7) 띠를 번갈아 써서 영역 나누기.
- 모든 페이지 맨 아래는 다크 푸터.

**하지 말 것**
- 표에 없는 색(초록, 노랑, 보라 등) 추가 금지. "성공" 표시도 초록 대신 ink + 체크 아이콘.
- 진한 그림자, 그라데이션 배경 금지.
- 글자 투명도(opacity)로 위계 만들기 금지 → charcoal/graphite 색으로.
- 쉐브론을 카드 안·버튼 장식으로 쓰기 금지.
- 이모지를 UI 아이콘 대신 쓰기 금지 (사용자 입력 내용 속 이모지는 허용).

## 완료 기준 (이 문서 범위)
- [ ] `fonts.css`, `tokens.css` 가 §2.1, §5 와 글자 하나 다르지 않다
- [ ] 개발자도구 Network 탭에서 A2z 400/500/600/700 woff2 파일이 200으로 받아진다
- [ ] 개발자도구 Elements → Computed 에서 본문 `font-family` 첫 값이 `A2z` 이다
- [ ] CSS 파일 전체에서 `#` 으로 시작하는 색상 값이 `tokens.css` 에만 있다 (`grep -n "#[0-9a-fA-F]\{3,6\}" public/css/*.css` 결과가 tokens.css 뿐)
- [ ] 버튼의 `border-radius` 가 4px, 카드가 16px 이다

## 변경 이력
| 날짜 | 버전 | 내용 |
|---|---|---|
| 2026-11-23 | v1.0 | 최초 작성 (DESIGN-hp.md 기반, A2z 글꼴·한글 줄간격 적용) |
