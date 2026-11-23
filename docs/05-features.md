# 05. 기능 구현 지침 (기능 구현 지침 ②)

> 버튼을 누르면 **무슨 일이 어떤 순서로** 일어나는지, 실패하면 **무엇을 보여주는지** 정합니다.
> 데이터 모양은 `04-data-model.md`, 화면 배치는 `03-ui-screens.md`, 서버 API는 `06-api-ai.md`.

---

## 0. 제한값 — `public/js/constants.js` (이 값 그대로)

```js
// 글자 수 제한
export const MAX_COURSE_NAME = 40;
export const MAX_TITLE = 60;
export const MAX_LEARNED = 5000;
export const MAX_REFLECTION = 3000;
export const MAX_NOTE = 300;
export const MAX_NOTES_PER_DAY = 30;
export const MAX_FIELD_NAME = 20;
export const MAX_FIELDS = 50;
export const MAX_TEAM_TOPIC = 60;
export const MAX_TEAM_ROLE = 60;
export const MAX_TEAM_GOAL = 500;
export const MAX_TEAM_PURPOSE = 500;
export const MAX_TEAM_MEMBERS = 10;
export const MAX_MEMBER_NAME = 20;
export const MAX_TEAM_MEMO = 1000;
export const MAX_PROGRESS = 2000;
export const MAX_LINK_NAME = 60;
export const MAX_FILE_NAME = 120;
export const MAX_URL = 2000;
export const MAX_SEARCH_QUERY = 50;
// 개수·크기 제한
export const MAX_ATTACHMENTS_PER_LOG = 20;
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_GENERATE_DAYS = 366;           // 과정 기간 자동 생성 최대 일수
export const MAX_SEARCH_RESULTS = 100;
// 동작 값
export const AUTOSAVE_DELAY_MS = 800;
export const AI_MIN_CHARS = 20;                 // AI 하루 요약에 필요한 최소 글자 수 (learned + reflection, 공백 제외)
export const AI_FIELD_MAX_ENTRIES = 30;         // AI 분야 요약에 보내는 최대 기록 수 (최신 순)
export const AI_ENTRY_LEARNED_CHARS = 1500;     // 분야 요약 1개 기록의 배운 내용 최대 길이 (넘으면 자름)
export const AI_ENTRY_REFLECTION_CHARS = 500;
export const AI_ENTRY_PROGRESS_CHARS = 500;
export const AI_TIMEOUT_MS = 30000;
export const TOAST_MS = 3000;
export const TOAST_ERROR_MS = 6000;
```

---

## 1. 앱 시작 (`main.js`)

```
1. openDb()
   └ 실패 → <main>에 전체 오류 화면: "이 브라우저에서는 기록을 저장할 수 없어요.
            사생활 보호(시크릿) 모드라면 일반 창에서 열어 주세요." — 이후 아무것도 하지 않음
2. navigator.storage?.persist?.() 호출 (결과 무시, 실패해도 계속) — 브라우저가 데이터를 함부로 지우지 않게 요청
3. 헤더·푸터 그리기
4. getCourse() 가 null → 첫 실행 모달(§2.1) 열기 (모달이 닫힐 때까지 기다림)
5. router.start() — 현재 주소의 화면 그리기
6. 'data-changed' 이벤트를 들으면 헤더 통계 다시 그리기
```

### 1.1 라우터 (`router.js`)
| 주소 패턴 | 화면 | 파라미터 |
|---|---|---|
| `#/` 또는 빈 해시 | homePage | 쿼리 `status`(`all`/`written`/`empty`), `fields`(쉼표 구분 id) |
| `#/day/YYYY-MM-DD` | dayPage | 날짜가 `^\d{4}-\d{2}-\d{2}$` 가 아니거나 실제 없는 날짜(2026-02-30)면 404 |
| `#/fields` | fieldsPage | 쿼리 `tab`(`list`/`board`), `kind`(`all`/`interest`/`question`/`pledge`) |
| `#/fields/:id` | fieldDetailPage | 쿼리 `sort`(`asc`/`desc`), `filter`(`all`/`material`/`output`) |
| `#/search` | searchPage | 쿼리 `q` |
| `#/settings` | settingsPage | — |
| 그 외 | notFoundPage | — |

- `hashchange` 이벤트로 화면을 바꾼다. 화면 모듈은 `render(container, params)` 와 선택적 `destroy()` 를 내보낸다. 새 화면을 그리기 전에 이전 화면의 `destroy()` 를 호출한다(타이머 정리, 저장 대기 중인 내용 즉시 저장, Object URL 해제).
- 알 수 없는 쿼리 값은 기본값으로 처리한다(오류 아님).

---

## 2. 날짜 섹션

### 2.1 첫 실행 — 과정 설정
1. 모달 입력값 검사:
   - 과정 이름 1~40자 (비우면 "과정 이름을 입력해 주세요")
   - 시작일·종료일 둘 다 있어야 `시작하기` 활성
   - 종료일 < 시작일 → "종료일은 시작일과 같거나 뒤여야 해요"
   - 기간 일수 > 366 → "기간은 최대 366일까지 만들 수 있어요"
2. `시작하기` → `saveCourse()` → `generateDays()` → 토스트 `날짜 섹션 40개를 만들었어요` → 홈.
3. `나중에 할게요` → `saveCourse({ name: 기본값, startDate: null, endDate: null, includeWeekends: false })` → 홈(빈 상태).

### 2.2 `generateDays({ startDate, endDate, includeWeekends })`
- 시작일부터 종료일까지 **양 끝 포함**, 하루씩 증가(로컬 날짜 기준).
- `includeWeekends === false` 이면 토(6)·일(0)요일 건너뜀.
- 이미 있는 날짜는 건너뜀(덮어쓰지 않음). 새로 만든 개수를 반환.
- 공휴일은 고려하지 않는다(필요하면 사용자가 삭제).
- 예: 2026-11-03(화) ~ 2026-11-09(월), 주말 제외 → 11-03, 04, 05, 06, 09 → **5개**.

### 2.3 날짜 추가 (홈 `+ 날짜 추가`)
- 모달: 날짜 선택(`<input type="date">`, 기본값 오늘) + `추가`.
- 이미 있으면 "이미 있는 날짜예요" + `그 날짜로 이동` 링크.
- 성공 → 토스트 `11월 23일을 추가했어요` → 그 날짜 화면으로 이동.

### 2.4 날짜 삭제 (하루 기록 화면 맨 아래)
- 확인 모달: 제목 `11월 23일 기록을 삭제할까요?`, 본문 `배운 내용, 느낀 점, 메모지 3장, 팀플 일지와 첨부 2개가 함께 삭제돼요. 되돌릴 수 없어요.` (숫자는 실제 값, 0인 항목은 문장에서 뺌)
- `삭제` → `deleteDay()` → 토스트 `삭제했어요` → 홈.

### 2.5 `오늘 기록` / `오늘 기록 쓰기` 버튼
- 오늘 날짜 섹션이 있으면 → `#/day/{오늘}`.
- 없으면 → 확인 모달 `오늘(11월 23일) 날짜 섹션이 없어요. 만들까요?` → `만들기` 시 생성 후 이동.

### 2.6 홈 스크롤
- 필터가 기본값(`status=all`, 분야 없음)일 때만, 홈에 처음 들어오면 대상 카드(오늘 → 없으면 오늘 이후 가장 가까운 날 → 없으면 마지막 날)가 화면 가운데 오도록 `scrollIntoView({ block: 'center' })`. 단 대상이 첫 주차의 첫 카드면 스크롤하지 않음(히어로가 보이도록).

---

## 3. 하루 메모 자동 저장

```
입력 발생 → 저장 상태 "저장 중…" 대신 아무것도 바꾸지 않음
         → 800ms 동안 추가 입력 없음 → updateDay(date, { [필드]: 값 }) 호출
               → 상태 "저장 중…"
               → 성공: "저장됨 HH:MM"
               → 실패: "저장 실패 — 다시 시도" (누르면 마지막 값으로 재시도) + 오류 토스트 1회
```
- 입력창에 `maxlength` 속성을 걸어 최대 글자 수를 넘지 못하게 한다(붙여넣기 포함).
- 제목·배운 내용·느낀 점 각각 디바운스 타이머를 따로 둔다. 저장 시에는 그 필드만 patch 한다.
- **즉시 저장(flush)** 하는 순간: 화면 이동(`destroy()`), 입력창 `blur`, `visibilitychange`→`hidden`.
- `beforeunload`: 저장 대기·진행 중이면 flush 를 시도하고 `event.preventDefault()` 로 브라우저 기본 "나가시겠어요?" 확인을 띄운다. 대기 중인 저장이 없으면 아무것도 하지 않는다.
- 저장할 값이 DB 값과 같으면 저장하지 않는다(`updatedAt` 불필요한 갱신 방지).

---

## 4. 성장 기록 메모지

| 동작 | 순서 | 실패/예외 |
|---|---|---|
| 추가 | `+ 메모지 추가` → 편집 상태 빈 메모지 → `저장` → `addNote()` → 보기 상태 | 내용 공백뿐 → "내용을 입력해 주세요" / 30장 → 추가 칸 숨김 |
| 수정 | 메모지 클릭 → 편집 상태 → `저장` → `updateNote()` | 같음 |
| 취소 | `취소`·Esc → 새 메모지면 사라짐, 기존이면 원래 내용으로 | — |
| 삭제 | 휴지통 아이콘 → 확인 모달 `이 메모지를 삭제할까요?` → `deleteNote()` → 토스트 `메모지를 삭제했어요` | — |

- 편집 상태는 한 번에 1장만. 다른 메모지를 편집하려 하면 현재 편집 중인 것을 먼저 저장(내용이 비었으면 취소)한다.
- 메모지 내용 앞뒤 공백은 제거해서 저장, 줄바꿈은 유지.
- 메모지 변경은 Day의 `updatedAt` 도 갱신한다.

---

## 5. 분야

### 5.1 만들기 / 수정
1. 이름 `trim()`. 검사: 비었으면 "분야 이름을 입력해 주세요", 20자 초과 불가(maxlength), 중복이면 "이미 있는 분야 이름이에요".
   - 중복 판단: `name.trim().toLowerCase().replace(/\s+/g, '')` 가 같으면 중복. (예: "파이썬 기초" = "파이썬기초")
2. 50개면 `+ 분야 만들기` 를 눌렀을 때 모달 대신 토스트 "분야는 50개까지 만들 수 있어요".
3. 하루 기록 화면의 `+ 새 분야` 로 만들면, 만든 분야를 **그 날짜에 바로 태그**한다.
4. 팀플로 만들면 이어서 팀 정보 모달(§6.1)을 연다.

### 5.2 삭제
- 일반 분야 확인 문구: `'{이름}' 분야를 삭제할까요? 8개 날짜에서 이 태그가 빠져요. 기록 자체는 지워지지 않아요.`
- 팀플 분야 확인 문구: `'{이름}' 팀플을 삭제할까요? 팀 정보, 팀플 일지 6개, 첨부 9개가 함께 삭제되고 되돌릴 수 없어요.`
- 삭제 후 분야 상세 화면에 있었다면 `#/fields` 로 이동.

### 5.3 순서 바꾸기
- 위/아래 버튼 → 바로 옆 분야와 `order` 교환 → 목록 다시 그림 → 포커스는 같은 분야의 같은 버튼에 유지.

### 5.4 하루 기록에 태그 붙이기/떼기
- 칩 클릭 → `setDayFields(date, 새 배열)` **즉시 저장**(디바운스 없음). 붙이면 배열 끝에 추가.
- 팀플 칩을 붙이면 섹션 E에 그 팀플 일지 카드가 즉시 나타나고, 떼면 사라진다(데이터는 유지 — `04 §3.4`).

### 5.5 AI 분야 태그 추천 (P1)
1. `AI 추천` 클릭. 조건: 분야 1개 이상, `learned` 공백 제외 20자 이상. 아니면 버튼 비활성 + `title` 속성으로 이유 표시.
2. `POST /api/suggest-fields` 에 `{ text: title + '\n' + learned, fields: [{ id, name }] }` (이미 붙은 분야는 제외해서 보냄).
3. 결과 `fieldIds` 중 **현재 존재하는 분야 id만** 남긴다. 0개면 "어울리는 분야를 찾지 못했어요".
4. `붙이기` 를 눌러야만 태그가 붙는다(자동 적용 금지).

---

## 6. 팀플

### 6.1 팀 정보
- 모달 필드와 제한은 `04 §3.3 team`. 날짜는 둘 다 비워도 되고, 둘 다 있으면 종료일 ≥ 시작일.
- 팀원 입력: 입력 후 Enter 또는 `추가` → 칩 생성. 공백뿐·중복·10명 초과 시 추가 안 됨 + 안내.
- `저장` → `updateField(id, { team })`.

### 6.2 팀플 일지 진행 내용
- 자동 저장 규칙은 §3과 같다. 저장은 `saveTeamLog(fieldId, date, progress)`(없으면 생성).

### 6.3 첨부 — 허용 파일

`utils/fileTypes.js` 의 `getFileTypeInfo(fileName)` 로 판단한다(`04 §7.3`). 확장자(소문자)로 판단한다. `file.type` 은 비어 있거나 틀릴 수 있으므로 **판단에 쓰지 않고**, 저장할 `mimeType` 만 `file.type || 아래 표의 MIME` 으로 정한다.

| 분류 | 확장자 | 저장 MIME (file.type 이 비었을 때) | 열기 방식 | 목록 표시 |
|---|---|---|---|---|
| 이미지 | png, jpg, jpeg, gif, webp | image/png, image/jpeg, image/jpeg, image/gif, image/webp | 새 탭 | 썸네일 |
| PDF | pdf | application/pdf | 새 탭 | file 아이콘 |
| 텍스트 | txt | text/plain | 새 탭 | file 아이콘 |
| 문서 | docx, xlsx, pptx, hwp, hwpx | 각 공식 MIME, hwp/hwpx 는 application/octet-stream | 다운로드 | file 아이콘 |
| 데이터·코드 | csv, md, json, py, ipynb | text/csv, text/markdown, application/json, text/x-python, application/json | 다운로드 | file 아이콘 |
| 압축 | zip | application/zip | 다운로드 | file 아이콘 |

- **허용하지 않음**: svg, html, htm, js, exe 등 위 표에 없는 모든 확장자 → "올릴 수 없는 파일 형식이에요 (.svg)".
- `<input type="file" multiple accept=".png,.jpg,…">` 로 위 확장자만 고르게 하되, 끌어다 놓기 경로에서도 같은 검사를 한다.

### 6.4 파일 추가 순서
```
파일 선택 또는 끌어다 놓기
 → 파일마다 검사: 확장자 허용? / 크기 ≤ 10MB? / (현재 개수 + 추가 개수) ≤ 20?
     └ 실패한 파일은 목록에서 빼고 토스트로 이유 표시 ("시안.psd: 올릴 수 없는 형식", "영상.zip: 10MB 초과")
 → 통과한 파일이 1개 이상이면 구분 선택 모달(자료/결과물)
 → 추가 → 파일마다 addFileAttachment() (일지가 없으면 먼저 생성)
 → 목록 다시 그림 + 토스트 "파일 2개를 추가했어요"
 → 저장 공간 부족(QuotaExceededError) → "브라우저 저장공간이 부족해요. 백업 후 오래된 첨부를 지워 주세요."
```
- 파일 이름이 120자를 넘으면 확장자를 살리고 앞부분을 자른다.

### 6.5 링크 추가
- 모달: 이름(선택, 60자), URL(필수), 구분(자료/결과물).
- URL 검사: `new URL(값)` 성공 + `protocol` 이 `http:` 또는 `https:` + 2000자 이하. 실패 → "http:// 또는 https:// 로 시작하는 주소를 입력해 주세요".
- 이름을 비우면 `hostname` 을 이름으로 저장(예: `drive.google.com`).
- 링크 열기: `<a href={url} target="_blank" rel="noopener noreferrer">`.

### 6.6 첨부 열기 / 썸네일 / 삭제
- 파일 열기: `getFileBlob(id)` → `URL.createObjectURL(blob)` →
  - "새 탭" 형식: `window.open(url, '_blank', 'noopener')`
  - "다운로드" 형식: 임시 `<a href={url} download={name}>` 클릭
  - 60초 뒤 `URL.revokeObjectURL(url)`.
- 썸네일: 화면을 그릴 때 이미지 첨부의 Object URL을 만들고 목록에 기록해 두었다가 화면 `destroy()` 에서 모두 해제.
- 삭제: 확인 모달 `'{이름}'을(를) 삭제할까요?` → `deleteAttachment()` → 토스트.

---

## 7. 검색 (P1)

1. 검색어 `trim()`, 1~50자. (헤더 검색창 `maxlength=50`)
2. 대소문자 무시(`toLowerCase()`), 단순 포함(`includes`) 검사. 띄어쓰기도 그대로 비교.
3. 검사 대상과 라벨: Day `title`(제목), `learned`(배운 내용), `reflection`(느낀 점), `growthNotes[].text`(메모지), 그날의 TeamLog `progress`(팀플 일지), 첨부 `name`(첨부).
4. 날짜 단위로 묶어 날짜 최신 순, 최대 100개 날짜.
5. 발췌: 처음 일치 위치 앞 40자 + 일치 + 뒤 40자, 잘린 쪽에 `…`. 줄바꿈은 공백으로 바꿔 표시.

---

## 8. 백업

### 8.1 내보내기
1. 버튼 비활성 + 토스트 `백업 파일을 만드는 중…`.
2. `exportAll()`: 모든 저장소 읽기 → 파일 첨부는 `FileReader.readAsDataURL` 로 `dataUrl` 생성 → `04 §8` 형식 객체.
3. `JSON.stringify` → `Blob([…], { type: 'application/json' })` → `<a download="yoyak-zip-backup-YYYYMMDD-HHmm.json">` 클릭.
4. `meta.lastBackupAt` 저장 → 토스트 `백업 파일을 저장했어요 (12.3MB)`.

### 8.2 가져오기 — 검증 규칙 (하나라도 틀리면 중단, 아무것도 바꾸지 않음)
| 검사 | 실패 문구 |
|---|---|
| 파일 확장자 `.json` | "백업 파일(.json)을 골라 주세요" |
| `JSON.parse` 성공 | "파일을 읽을 수 없어요. 손상된 파일일 수 있어요" |
| `app === 'academy-summary-zip'` | "요약.zip 백업 파일이 아니에요" |
| `schemaVersion === 1` | "지원하지 않는 백업 버전이에요 (버전 N)" |
| `data.days/fields/teamLogs/attachments` 가 배열 | "백업 파일 형식이 올바르지 않아요" |
| 각 Day `date` 형식·중복 없음, 각 Field `type`·`color` 허용값, 각 첨부 `category`·`kind` 허용값, file 첨부는 `dataUrl` 이 `data:` 로 시작 | "백업 파일 형식이 올바르지 않아요 (days[3].date)" — 괄호 안에 처음 발견한 위치 |
| 글자 수 제한(§0) 초과 | 같은 문구 + 위치 |

### 8.3 가져오기 — 실행 순서
1. 검증 통과 → 확인 모달: `날짜 40개, 분야 5개, 팀플 일지 12개, 첨부 18개를 불러와요. 지금 있는 데이터는 모두 지워지고 바뀌어요.` + `바꾸기`(.btn--danger).
2. **트랜잭션을 열기 전에** 모든 `dataUrl` 을 Blob으로 변환해 둔다.
   > ⚠️ IndexedDB 트랜잭션 안에서 IndexedDB가 아닌 비동기 작업(fetch, FileReader, setTimeout 등)을 `await` 하면 트랜잭션이 자동으로 끝나 버린다. 변환은 반드시 먼저 끝내고, 트랜잭션 안에서는 `put`/`clear` 만 한다.
3. 한 트랜잭션에서 6개 저장소 `clear()` → 전부 `put()`.
4. 성공 → 토스트 `백업을 불러왔어요` → 홈으로 이동 후 새로고침(`location.reload()`).

---

## 9. 설정

- **과정 정보 저장**: 검사 규칙은 §2.1. 기간을 바꿔도 기존 날짜 섹션은 지우지 않는다. `기간에 맞춰 빈 날짜 채우기` 를 눌러야 빠진 날짜가 추가된다(`generateDays`) → 토스트 `날짜 3개를 추가했어요` / `추가할 날짜가 없어요`.
- **접근 코드 저장 후 연결 확인**: `localStorage['yz.accessCode']` 저장(빈 값이면 키 삭제) → `GET /api/health`(헤더 `x-access-code`) → 응답에 따라 `03 §7` 의 결과 문구.
- **저장공간**: `navigator.storage.estimate()` 의 `usage`/`quota` 를 `formatBytes()` 로 표시(1024 단위, 소수 1자리: `12.3MB`).
- **모든 데이터 삭제**: `wipeAll()` → `location.reload()` → 첫 실행 모달.

---

## 10. AI 기능 (클라이언트 쪽 흐름)

### 10.1 공통 — `api.js`
```js
// 서버 API를 부르는 공통 함수. 30초 넘으면 중단한다.
export async function postJson(path, body) { … }
```
- `fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-access-code': 저장된 코드 또는 생략 }, body, signal })`
- `AbortController` 로 30초 타임아웃.
- 응답이 `ok` 가 아니면 본문의 `error.code` 로 아래 문구를 골라 `Error` 를 던진다.

| 상황 / `error.code` | 화면 문구 |
|---|---|
| 네트워크 실패 (fetch 예외) | 인터넷 연결을 확인해 주세요 |
| 타임아웃 (AbortError) | AI 응답이 너무 오래 걸려요. 잠시 후 다시 시도해 주세요 |
| `UNAUTHORIZED` | AI 접근 코드가 맞지 않아요. 설정에서 코드를 확인해 주세요 |
| `INVALID_INPUT` | 보낸 내용이 너무 길거나 형식이 맞지 않아요 |
| `NOT_CONFIGURED` | 서버에 AI 설정이 안 되어 있어요 (관리자: OPENAI_API_KEY, OPENAI_MODEL 확인) |
| `RATE_LIMITED` | AI 사용량이 많아요. 1분 뒤 다시 시도해 주세요 |
| `AI_REFUSED` | AI가 이 내용은 요약할 수 없다고 답했어요 |
| `AI_ERROR`, 그 외 | AI 요약에 실패했어요. 잠시 후 다시 시도해 주세요 |

### 10.2 AI 하루 요약
1. 조건: `learned` + `reflection` 의 공백 제외 글자 수 합 ≥ 20.
2. 먼저 대기 중인 자동 저장을 flush.
3. `POST /api/summarize-day` 본문: `{ date, title, learned, reflection, growthNotes: [{ kind, text }] }`
4. 성공 → `updateDay(date, { ai: { summary, keywords, generatedAt: 지금, sourceHash: hashText(…) } })` → 카드 다시 그림.
5. 실패 → 카드 안에 §10.1 문구 + `다시 시도`. 기존 결과가 있으면 지우지 않는다.

### 10.3 AI 분야 요약
1. 그 분야가 붙은 Day를 날짜 **최신 순**으로 최대 30개 고른 뒤, 보낼 때는 **오래된 순**으로 정렬.
2. 각 기록 → `{ date, title, learned(1500자로 자름), reflection(500자로 자름), notes: 메모지 text 배열(최대 10개), teamProgress(팀플 분야면 그날 progress 500자, 아니면 '') }`.
3. `POST /api/summarize-field` 본문: `{ fieldName, fieldType, team: (팀플이면 { topic, role, goal, purpose }, 아니면 null), entries }`
4. 성공 → `updateField(id, { ai: { overview, keyPoints, nextTopics, generatedAt, sourceHash: hashText(JSON.stringify(entries)), entryCount } })`.

---

## 11. 공통 UI 동작

### 11.1 모달 (`modal.js`)
- `openModal({ title, body, actions })` → Promise(누른 버튼 값 또는 `null`).
- `confirmDialog({ title, message, confirmLabel, danger })` → Promise<boolean>.
- 열릴 때: 첫 입력 요소(없으면 첫 버튼)에 포커스, `role="dialog"`, `aria-modal="true"`, `aria-labelledby`. Tab 순환은 모달 안에서만. Esc·배경 클릭 = 취소(`null`/`false`). 닫힐 때 연 버튼으로 포커스 복귀. 뒤 페이지 스크롤 잠금.
- 모달 위에 모달은 최대 2단(예: 분야 만들기 → 팀 정보).

### 11.2 토스트 (`toast.js`)
- `toast(message, { type: 'info'|'error', action?: { label, onClick } })`.
- info 3초 / error 6초 후 사라짐, 최대 3개, 새 것이 아래. 마우스를 올리거나 포커스 중이면 멈춤.

### 11.3 화면 문구 공통
- 날짜 표시: 카드 `11월 23일 (월)`, 화면 제목 `11월 23일 월요일`, 짧게 `11.23`, 기간 `2026.11.03 – 2026.12.26`.
- 시각 표시: `HH:MM`(24시간), 날짜+시각 `11.23 16:50`.
- 파일 크기: `formatBytes` — `845B`, `12.3KB`, `1.2MB`.

## 완료 기준 (이 문서 범위)
- [ ] §0 상수가 `constants.js` 에 그대로 있고, 다른 파일에 같은 숫자가 하드코딩되어 있지 않다
- [ ] 입력 후 0.8초 뒤 저장되고, 새로고침해도 내용이 남아 있다
- [ ] 입력 직후 바로 다른 화면으로 이동해도 내용이 저장된다
- [ ] §6.3 표에 없는 파일(.svg, .exe)은 끌어다 놓아도 추가되지 않는다
- [ ] 11MB 파일은 거부되고 이유가 토스트로 나온다
- [ ] `javascript:alert(1)` 링크는 저장되지 않는다
- [ ] 백업 → 전체 삭제 → 가져오기 후 첨부 이미지 썸네일까지 그대로 보인다
- [ ] 다른 앱의 JSON 파일을 가져오면 "요약.zip 백업 파일이 아니에요" 가 나오고 기존 데이터가 그대로다

## 변경 이력
| 날짜 | 버전 | 내용 |
|---|---|---|
| 2026-11-23 | v1.0 | 최초 작성 |
