# 08. 작업 순서 (Roadmap)

> 에이전트는 Step 0부터 차례대로 진행합니다. **각 Step의 완료 기준을 모두 통과하고 `AGENTS.md §6.2` 형식으로 보고한 뒤** 다음 Step으로 넘어갑니다.
> 사용자는 각 Step 끝의 "사용자가 확인할 것"만 해 보면 됩니다.

| Step | 이름 | 핵심 산출물 | 관련 PRD ID |
|---|---|---|---|
| 0 | 문서 확인 | 질문 목록 (없으면 "질문 없음") | — |
| 1 | 프로젝트 뼈대 | 폴더·설정 파일·개발 서버 | — |
| 2 | 디자인 시스템 + 공통 틀 | CSS, 헤더, 푸터, 모달, 토스트, 아이콘, 라우터, 404 | N-04~07 |
| 3 | 데이터 계층 | db.js, store.js, utils, 테스트 | N-01 |
| 4 | 홈 + 날짜 섹션 | 첫 실행 모달, 홈, 날짜 추가 | F-DAY-01~04 |
| 5 | 하루 기록 | 메모 자동 저장, 메모지, 날짜 이동·삭제 | F-DAY-05~06, F-MEMO, F-NOTE-01~03 |
| 6 | 분야 | 분야 목록·만들기·태그·상세(일반)·성장 보드·홈 필터 | F-FIELD, F-NOTE-04 |
| 7 | 팀플 | 팀 정보, 팀플 일지, 첨부, 팀플 상세 | F-TEAM |
| 8 | 서버 + AI | api/*, AI 패널, AI 추천 | F-AI |
| 9 | 검색·설정·백업 | 검색 화면, 설정 화면, 백업/복원 | F-SYS |
| 10 | 마무리 + 배포 | README, 전체 QA, Vercel 배포 | 8장 Release Criteria |

---

## Step 0 — 문서 확인
- **할 일**: `AGENTS.md`, `PRD.md`, `docs/*.md` 전부 읽기. 서로 모순되거나 빠진 부분을 `AGENTS.md §7.3` 형식으로 정리.
- **완료 기준**
  - [ ] 질문 목록을 사용자에게 보냈거나 "질문 없음"을 보고
  - [ ] 사용자의 답을 받아 관련 문서를 고쳤다 (변경 이력 기록)
- **사용자가 확인할 것**: 질문에 답하기.

## Step 1 — 프로젝트 뼈대
- **참고**: `01-project-setup.md`
- **할 일**: 폴더 구조, `package.json`, `vercel.json`, `.env.example`, `.gitignore`, `scripts/dev-server.mjs`, `public/index.html`, `api/health.js`(최소 구현), `api/_lib/http.js`.
- **완료 기준**: `01 §7` 전부.
- **사용자가 확인할 것**: 터미널에서 `npm run dev` → 브라우저에서 `http://localhost:3000/api/health` 열어 글자가 나오는지.

## Step 2 — 디자인 시스템 + 공통 틀
- **참고**: `02-design-system.md` 전체, `03-ui-screens.md §1, §9`, `05 §1.1, §11`
- **할 일**: `fonts.css`, `tokens.css`, `base.css`, `components.css`(버튼·카드·입력창·칩·배지·탭·모달·토스트·메모지 클래스 전부), `icons.js`, `header.js`(모바일 메뉴 포함), `footer.js`, `modal.js`, `toast.js`, `router.js`, `notFoundPage.js`, 나머지 페이지 파일은 제목만 보여주는 빈 화면.
- **완료 기준**
  - [ ] `02` 완료 기준 전부
  - [ ] 모든 주소(`#/`, `#/fields`, `#/settings`, `#/없는곳`)로 이동 시 해당 빈 화면/404가 나온다
  - [ ] 360px 폭에서 햄버거 메뉴가 열리고 Esc로 닫힌다
  - [ ] 404 화면의 `홈으로` 버튼이 `.btn--ink` 모양(검정, 모서리 4px, 높이 44px)이다
- **사용자가 확인할 것**: 글꼴이 에이투지체로 보이는지, 휴대폰 크기(개발자도구 기기 모드)에서 메뉴가 열리는지.

## Step 3 — 데이터 계층
- **참고**: `04-data-model.md` 전체, `05 §0`
- **할 일**: `constants.js`, `utils/*.js`, `db.js`, `store.js`(§7.2 함수 전부 — 검색·백업 함수는 Step 9에서 채워도 됨, 단 함수 이름은 지금 만들어 둠), `api/_lib/limits.js`, `tests/date.test.js`, `tests/format.test.js`, `tests/fileTypes.test.js`, `tests/limits.test.js`.
- **완료 기준**
  - [ ] `04` 완료 기준 전부
  - [ ] `npm test` 통과 (`09 §2` 의 Step 3 테스트 항목)
  - [ ] 브라우저 Console에서 `import('/js/store.js').then(s => s.createDay('2026-11-23'))` 실행 시 IndexedDB `days` 에 레코드가 생긴다
- **사용자가 확인할 것**: 없음 (화면 변화 없음).

## Step 4 — 홈 + 날짜 섹션
- **참고**: `03 §2, §8`, `05 §1, §2`
- **할 일**: `onboarding.js`, `homePage.js`, `dayCard.js`, 헤더 통계, 날짜 추가 모달, `오늘 기록` 버튼 동작.
- **완료 기준**
  - [ ] `09` 의 HOME-*, DAY-01~05 통과
  - [ ] 2026-11-03 ~ 2026-11-09 주말 제외로 시작하면 카드 5개, 1주차 4개 + 2주차 1개
- **사용자가 확인할 것**: 실제 아카데미 기간을 넣어 날짜 카드가 맞게 나오는지.

## Step 5 — 하루 기록
- **참고**: `03 §3.1~3.3, §3.7`, `05 §2.4, §3, §4`
- **할 일**: `dayPage.js` 섹션 A·B, `growthNote.js`, 자동 저장, 이전/다음, 날짜 삭제.
- **완료 기준**: `09` 의 DAY-06~10, MEMO-*, NOTE-01~06 통과.
- **사용자가 확인할 것**: 오늘 배운 내용을 실제로 적고 새로고침해도 남아 있는지, 메모지 3장 붙여 보기.

## Step 6 — 분야
- **참고**: `03 §2.2, §3.4, §4, §5.1~5.2`, `05 §5`
- **할 일**: `fieldsPage.js`, `fieldDetailPage.js`(일반), `fieldChip.js`, 분야 모달, 하루 기록 섹션 C(AI 추천 버튼은 자리만, 비활성), 홈 분야 필터, 성장 보드.
- **완료 기준**: `09` 의 FIELD-*, NOTE-07~08, HOME-04~05 통과.
- **사용자가 확인할 것**: 분야 3개 만들고 여러 날짜에 붙인 뒤 분야 화면에서 모여 보이는지.

## Step 7 — 팀플
- **참고**: `03 §3.6, §5.3`, `04 §3.4~3.6`, `05 §6`
- **할 일**: 팀 정보 모달, `teamLogCard.js`, `attachmentList.js`, `utils/fileTypes.js` 연결, 팀플 상세.
- **완료 기준**: `09` 의 TEAM-*, ATT-* 통과.
- **사용자가 확인할 것**: 실제 팀플 정보를 입력하고 PDF·이미지·링크를 하나씩 올려 열어 보기.

## Step 8 — 서버 + AI
- **참고**: `06-api-ai.md` 전체, `03 §3.5, §5.2`, `05 §5.5, §10`
- **사전 조건**: 사용자가 `.env.local` 에 `OPENAI_API_KEY`, `OPENAI_MODEL` 을 넣었는지 확인. 없으면 요청하고 기다린다.
- **할 일**: `api/_lib/*`, `api/summarize-day.js`, `api/summarize-field.js`, `api/suggest-fields.js`, `public/js/api.js`, `aiPanel.js`, AI 추천 활성화, `tests/validate.test.js`.
- **완료 기준**: `06` 완료 기준 전부, `09` 의 AI-* 통과.
- **사용자가 확인할 것**: 하루 요약·분야 요약을 실제로 눌러 결과가 그럴듯한지.

## Step 9 — 검색·설정·백업
- **참고**: `03 §6, §7`, `05 §7, §8, §9`
- **할 일**: `searchPage.js`, `settingsPage.js`, `backup.js`, `utils/backupSchema.js`, `tests/backup.test.js`.
- **완료 기준**: `09` 의 SEARCH-*, SET-*, BAK-* 통과.
- **사용자가 확인할 것**: 백업 파일을 내보낸 뒤 다른 브라우저(예: Edge)에서 가져오기.

## Step 10 — 마무리 + 배포
- **참고**: `07-deployment.md`, `09-qa-checklist.md` 전체
- **할 일**: `README.md` 작성(아래 목차), 전체 QA, 접근성·반응형 손보기, Vercel 배포 안내.
- **README.md 목차 (이대로)**: 1. 이 프로젝트는? 2. 실행 방법(로컬) 3. 환경변수 4. 배포 주소 5. 데이터 저장 위치와 백업 6. 문서 안내(AGENTS/PRD/docs) 7. 문제 해결(07 §7 링크)
- **완료 기준**: `PRD.md §8` 의 1~6 전부.
- **사용자가 확인할 것**: 배포 주소에서 시나리오 A~D 직접 해 보기.

## 변경 이력
| 날짜 | 버전 | 내용 |
|---|---|---|
| 2026-11-23 | v1.0 | 최초 작성 |
