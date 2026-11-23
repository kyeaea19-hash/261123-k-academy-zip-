# 04. 데이터 구조 (기능 구현 지침 ①)

> 모든 기록은 **사용자 브라우저의 IndexedDB**에 저장됩니다. 서버(Vercel)는 아무것도 저장하지 않습니다.
>
> **쉽게 말하면** — IndexedDB는 브라우저 안의 "서랍장"입니다. 서랍(저장소, store)이 6개 있고, 각 서랍에 정해진 모양의 카드(레코드)를 넣습니다.

---

## 1. 데이터베이스 기본값

| 항목 | 값 |
|---|---|
| DB 이름 | `academy-summary-zip` |
| DB 버전 | `1` |
| 스키마 버전(백업 파일용) | `1` |
| 고유 ID 생성 | `crypto.randomUUID()` (utils/id.js 의 `newId()`) |
| 시각(timestamp) 형식 | ISO 문자열 `new Date().toISOString()` → `"2026-11-23T07:42:10.123Z"` |
| 날짜(date) 형식 | 로컬 날짜 문자열 `"YYYY-MM-DD"` → `"2026-11-23"` |

> ⚠️ **날짜 함정**: 날짜 문자열을 만들 때 `toISOString().slice(0, 10)` 을 **쓰지 않는다**. 한국 시간 오전 9시 이전에는 전날로 바뀐다. 반드시 `utils/date.js` 의 `toDateKey(date)` (로컬 연·월·일을 조립)만 쓴다. 날짜 문자열 → Date 변환도 `new Date('2026-11-23')`(UTC로 해석됨) 대신 `fromDateKey('2026-11-23')` → `new Date(2026, 10, 23)` 을 쓴다.

---

## 2. 저장소(Object Store) 목록

| 저장소 | keyPath | 인덱스 | 담는 것 |
|---|---|---|---|
| `meta` | `key` | — | 과정 정보, 마지막 백업 시각 |
| `days` | `date` | `byField` (`fieldIds`, multiEntry: true) | 하루 기록 + 성장 기록 메모지 |
| `fields` | `id` | — | 분야 (일반/팀플) + 팀 정보 |
| `teamLogs` | `id` | `byField` (`fieldId`), `byDate` (`date`) | 팀플 일지 |
| `attachments` | `id` | `byTeamLog` (`teamLogId`), `byField` (`fieldId`) | 첨부의 정보(이름·크기 등) |
| `files` | `id` | — | 첨부 파일의 실제 내용(Blob). id는 attachments와 같음 |

> 첨부 "정보"와 "내용"을 나눈 이유: 목록을 그릴 때 큰 파일 내용까지 읽지 않도록.

---

## 3. 레코드 모양

### 3.1 `meta`
```js
// key: 'course' — 과정 정보 (과정은 1개만)
{
  key: 'course',
  value: {
    name: '전력시장 디지털 인재 아카데미', // 1~40자
    startDate: '2026-11-03',            // 또는 null (나중에 할게요)
    endDate: '2026-12-26',              // 또는 null. startDate 이상
    includeWeekends: false,
    createdAt: '…', updatedAt: '…'
  }
}
// key: 'lastBackupAt' — 마지막으로 백업 파일을 내보낸 시각
{ key: 'lastBackupAt', value: '2026-11-20T09:02:00.000Z' }   // 없으면 레코드 없음
```

### 3.2 `days` — 하루 기록
```js
{
  date: '2026-11-23',          // 키. 고유
  title: '',                   // 0~60자
  learned: '',                 // 배운 내용 0~5000자
  reflection: '',              // 느낀 점 0~3000자
  growthNotes: [               // 성장 기록 메모지 0~30장, 만든 순서대로
    {
      id: 'uuid',
      kind: 'interest',        // 'interest'(관심) | 'question'(궁금) | 'pledge'(다짐)
      color: 'blue',           // 'blue' | 'rose' | 'mist' | 'fog'
      text: 'LSTM으로 수요예측 해보기', // 1~300자
      createdAt: '…', updatedAt: '…'
    }
  ],
  fieldIds: ['uuid1', 'uuid2'], // 붙은 분야 id. 중복 없음, 붙인 순서
  ai: null,                    // 또는 아래 모양
  // ai: {
  //   summary: ['요약1', '요약2', '요약3'],   // 정확히 3개
  //   keywords: ['SMP', '전력거래소'],        // 1~5개
  //   generatedAt: '…',
  //   sourceHash: 'a1b2c3d4'                 // 생성 당시 내용의 해시 (§5)
  // },
  createdAt: '…', updatedAt: '…'
}
```

**계산값 (저장하지 않음)**
| 이름 | 계산 방법 |
|---|---|
| `dayNumber` (N일차) | 모든 Day를 `date` 오름차순 정렬한 순번(1부터). 필터와 무관 |
| `weekNumber` (N주차) | 기준일 = `course.startDate`(없으면 가장 이른 Day 날짜). `floor((그 날짜가 속한 주의 월요일 − 기준일이 속한 주의 월요일) / 7일) + 1`. 0 이하이면 화면에 "과정 전" 그룹으로 표시 |
| `isWritten` (작성함) | `learned.trim()` 또는 `reflection.trim()` 이 1자 이상, 또는 `growthNotes.length > 0` |
| `isToday` | `date === toDateKey(new Date())` |

예: 기준일 2026-11-03(화) → 그 주 월요일 11-02. 날짜 2026-11-10(화) → 월요일 11-09 → (7일/7)+1 = **2주차**.

### 3.3 `fields` — 분야
```js
{
  id: 'uuid',
  name: '전력시장 기초',       // 1~20자, 앞뒤 공백 제거 후 저장, 대소문자·공백 무시하고 중복 불가
  type: 'general',            // 'general'(일반) | 'team'(팀플). 만든 뒤 변경 불가
  color: 'blue',              // 'blue' | 'navy' | 'teal' | 'sea' | 'brick' | 'charcoal'
  order: 0,                   // 목록 순서. 0부터, 작을수록 앞
  team: null,                 // type==='general' 이면 항상 null
  // type==='team' 이면:
  // team: {
  //   topic: '',      // 주제 0~60자
  //   role: '',       // 내 역할 0~60자
  //   goal: '',       // 목표 0~500자
  //   purpose: '',    // 목적 0~500자
  //   startDate: null,// 'YYYY-MM-DD' 또는 null
  //   endDate: null,  // 'YYYY-MM-DD' 또는 null, startDate 이상
  //   members: [],    // 팀원 이름 0~10개, 각 1~20자, 중복 불가
  //   memo: ''        // 메모 0~1000자
  // },
  ai: null,
  // ai: {
  //   overview: '…',          // 1~600자
  //   keyPoints: ['…'],       // 3~7개
  //   nextTopics: ['…'],      // 1~5개
  //   generatedAt: '…',
  //   sourceHash: '…',
  //   entryCount: 12          // 요약에 사용한 기록 수
  // },
  createdAt: '…', updatedAt: '…'
}
```
- 분야는 최대 **50개**.
- 새 분야의 `order` = 현재 최대 order + 1.

### 3.4 `teamLogs` — 팀플 일지
```js
{
  id: '{fieldId}__{date}',     // 예: 'b3f…__2026-11-23' (팀플 1개 × 날짜 1개 = 일지 1개)
  fieldId: 'uuid',             // type==='team' 인 분야
  date: '2026-11-23',
  progress: '',                // 오늘 진행 내용 0~2000자
  createdAt: '…', updatedAt: '…'
}
```
- **필요할 때 만든다**: 진행 내용을 처음 입력하거나 첫 첨부를 추가하는 순간 생성. 화면에 카드만 보이는 상태에서는 만들지 않는다.
- 하루 기록에서 팀플 분야 태그를 떼도 일지는 지우지 않는다(다시 붙이면 다시 보임). 단 분야 상세 타임라인에는 태그와 무관하게 내용이 있는 일지가 모두 보인다.

### 3.5 `attachments` — 첨부 정보
```js
{
  id: 'uuid',
  teamLogId: '{fieldId}__{date}',
  fieldId: 'uuid',
  date: '2026-11-23',
  category: 'material',        // 'material'(자료) | 'output'(결과물)
  kind: 'file',                // 'file' | 'link'
  name: '회의록.pdf',           // file: 원래 파일 이름(최대 120자로 자름) / link: 사용자가 입력한 이름 1~60자(비우면 도메인)
  mimeType: 'application/pdf', // file만. link는 ''
  size: 1258291,               // file만(바이트). link는 0
  url: '',                     // link만. http:// 또는 https:// 로 시작, 최대 2000자
  createdAt: '…'
}
```

### 3.6 `files` — 첨부 파일 내용
```js
{ id: '(attachments.id 와 같음)', blob: Blob }
```
- `kind === 'link'` 인 첨부는 `files` 레코드가 없다.

---

## 4. 삭제 규칙 (함께 지워지는 것)

| 지우는 것 | 함께 처리되는 것 | 트랜잭션 |
|---|---|---|
| 메모지 1장 | Day.growthNotes 배열에서 제거 | `days` |
| 첨부 1개 | `attachments` + `files` 레코드 | `attachments`,`files` |
| 날짜 섹션(Day) | 그 날짜의 모든 `teamLogs` + 그 일지들의 `attachments` + `files` | `days`,`teamLogs`,`attachments`,`files` |
| 일반 분야 | 모든 Day의 `fieldIds` 에서 그 id 제거 | `fields`,`days` |
| 팀플 분야 | 위 + 그 분야의 모든 `teamLogs`·`attachments`·`files` | `fields`,`days`,`teamLogs`,`attachments`,`files` |
| 전체 삭제 | 6개 저장소 모두 비움 (`localStorage` 접근 코드는 유지) | 전부 |

- 여러 저장소를 바꾸는 작업은 **하나의 readwrite 트랜잭션**으로 묶는다(중간에 실패하면 전부 취소되도록).
- 분야 삭제 후 남은 분야들의 `order` 를 0부터 다시 매긴다.

---

## 5. 내용 해시 (AI 결과가 "오래됨"인지 판단)

- `utils/format.js` 에 `hashText(str)` = **FNV-1a 32비트**, 결과는 8자리 소문자 16진수 문자열.
- 하루 요약 해시 입력: `title + '\n' + learned + '\n' + reflection + '\n' + growthNotes.map(n => n.kind + ':' + n.text).join('\n')`
- 분야 요약 해시 입력: 요약 요청에 보낸 `entries` 배열을 `JSON.stringify` 한 문자열.
- 화면을 그릴 때 현재 해시 ≠ `ai.sourceHash` 이면 "기록이 바뀌었어요" 안내를 띄운다.

---

## 6. localStorage (예외 1개)

| 키 | 값 | 용도 |
|---|---|---|
| `yz.accessCode` | 문자열 | AI 접근 코드. 서버 요청 헤더 `x-access-code` 로 보냄 |

그 외 모든 데이터는 IndexedDB에만 저장한다.

---

## 7. 코드 구조 — `db.js` 와 `store.js`

### 7.1 `db.js` (저수준 — IndexedDB 직접 다루기)
| 함수 | 설명 |
|---|---|
| `openDb()` | DB를 열고, 버전 1 생성 시 §2 저장소·인덱스를 만든다. 한 번 연 연결을 재사용 |
| `tx(storeNames, mode, fn)` | 트랜잭션 열고 `fn(stores)` 실행, 완료(`complete`)까지 기다리는 Promise 반환 |
| `get(store, key)`, `getAll(store)`, `getAllByIndex(store, index, value)`, `put(store, value)`, `del(store, key)`, `clear(store)` | 기본 동작. 모두 Promise 반환 |

### 7.2 `store.js` (고수준 — 화면이 부르는 함수)
화면 코드는 **`store.js` 만** 부른다(`db.js` 직접 호출 금지).

| 영역 | 함수 |
|---|---|
| 과정 | `getCourse()`, `saveCourse(course)`, `generateDays({ startDate, endDate, includeWeekends })` → 새로 만든 개수 반환 |
| 날짜 | `listDays()`(date 오름차순), `getDay(date)`, `createDay(date)`, `updateDay(date, patch)`, `deleteDay(date)` |
| 메모지 | `addNote(date, note)`, `updateNote(date, noteId, patch)`, `deleteNote(date, noteId)` |
| 분야 | `listFields()`(order 오름차순), `getField(id)`, `createField({name,type,color})`, `updateField(id, patch)`, `deleteField(id)`, `moveField(id, 'up'|'down')`, `setDayFields(date, fieldIds)` |
| 팀플 | `getTeamLog(fieldId, date)`(없으면 null), `saveTeamLog(fieldId, date, progress)`(없으면 생성), `listTeamLogsByField(fieldId)` |
| 첨부 | `listAttachments(teamLogId)`, `listAttachmentsByField(fieldId)`, `addFileAttachment({fieldId,date,category,file})`, `addLinkAttachment({fieldId,date,category,name,url})`, `getFileBlob(id)`, `deleteAttachment(id)` |
| 통계 | `getStats()` → `{ totalDays, writtenDays, noteCount, fieldCount, teamCount, attachmentCount }` |
| 검색 | `search(query)` → 결과 배열 (`05 §7`) |
| 전체 | `exportAll()`, `importAll(backupObject)`, `wipeAll()` |

- 모든 쓰기 함수는 `updatedAt` 을 갱신하고, 저장 전에 §3의 제한을 검사한다. 위반 시 `Error` 를 던지고 `error.code` 에 `'VALIDATION'`, `error.field` 에 필드 이름을 넣는다.
- 저장 후 `window.dispatchEvent(new CustomEvent('data-changed', { detail: { type: 'day'|'field'|… } }))` 를 보내 헤더 통계 등이 갱신되게 한다.

---

### 7.3 순수 함수 모듈 (테스트 대상 — 이름·동작 고정)

**`utils/date.js`**
| 함수 | 입력 → 출력 | 예 |
|---|---|---|
| `toDateKey(date)` | Date → `'YYYY-MM-DD'` (로컬) | `new Date(2026,10,23,0,30)` → `'2026-11-23'` |
| `fromDateKey(key)` | `'YYYY-MM-DD'` → 로컬 자정 Date | `'2026-11-23'` → `new Date(2026,10,23)` |
| `isValidDateKey(key)` | 문자열 → boolean (형식 + 실제 존재하는 날짜) | `'2026-02-30'` → false |
| `todayKey()` | → 오늘 `'YYYY-MM-DD'` | |
| `addDays(key, n)` | → n일 뒤 key | `('2026-11-30', 1)` → `'2026-12-01'` |
| `listDateRange(startKey, endKey, { includeWeekends })` | → key 배열(양 끝 포함). 일수 > 366 이면 `Error('RANGE_TOO_LONG')`, 끝 < 시작이면 `Error('RANGE_INVALID')` | `('2026-11-03','2026-11-09',{includeWeekends:false})` → 5개 |
| `weekNumber(key, baseKey)` | → 정수 (§3.2 공식) | `('2026-11-10','2026-11-03')` → 2 |
| `formatDateLong(key)` | → `'11월 23일 월요일'` | |
| `formatDateCard(key)` | → `'11월 23일 (월)'` | |
| `formatDateShort(key)` | → `'11.23'` | |
| `formatDateDot(key)` | → `'2026.11.23'` | |

**`utils/format.js`**: `formatBytes(n)`, `hashText(str)`(§5), `truncateFileName(name, max)`(확장자 유지하고 앞부분 자름), `formatTime(isoString)` → `'16:42'`, `formatDateTime(isoString)` → `'11.23 16:42'`, `countNonSpace(str)`(공백·줄바꿈 제외 글자 수).

**`utils/fileTypes.js`**: `getFileTypeInfo(fileName)` → `{ allowed, ext, mime, openMode: 'tab' | 'download', isImage }` (`05 §6.3` 표 그대로), `ACCEPT_ATTR`(file input 의 `accept` 문자열).

**`utils/backupSchema.js`**: `validateBackup(obj)` → `{ ok: true }` 또는 `{ ok: false, message, path }` (`05 §8.2`).

## 8. 백업 파일 형식

파일 이름: `yoyak-zip-backup-YYYYMMDD-HHmm.json` (로컬 시각)

```json
{
  "app": "academy-summary-zip",
  "schemaVersion": 1,
  "exportedAt": "2026-11-23T08:00:00.000Z",
  "data": {
    "course": { "name": "…", "startDate": "…", "endDate": "…", "includeWeekends": false, "createdAt": "…", "updatedAt": "…" },
    "days": [ { "date": "2026-11-23", "…": "§3.2 그대로" } ],
    "fields": [ { "…": "§3.3 그대로" } ],
    "teamLogs": [ { "…": "§3.4 그대로" } ],
    "attachments": [
      { "…": "§3.5 그대로", "dataUrl": "data:application/pdf;base64,JVBERi0…" }
    ]
  }
}
```
- 파일 첨부는 `dataUrl`(Base64) 로 넣고, 링크 첨부는 `"dataUrl": null`.
- `course` 가 없으면 `null`.
- 가져오기 검증 규칙은 `05-features.md §8`.

---

## 9. 스키마 변경 규칙
- 저장 구조를 바꿔야 하면 **먼저 사용자에게 질문**한다(AGENTS.md §7).
- 승인되면 DB 버전과 `schemaVersion` 을 1씩 올리고, `onupgradeneeded` 에 이전 데이터 변환 코드를 넣으며, 백업 가져오기에서 이전 버전 파일도 변환해 받는다.

## 완료 기준 (이 문서 범위)
- [ ] 개발자도구 → Application → IndexedDB 에 `academy-summary-zip` DB와 6개 저장소, §2 의 인덱스가 보인다
- [ ] 한국 시간 오전 0시~9시 사이에도 "오늘" 날짜가 올바르다 (`tests/date.test.js` 로 검증)
- [ ] 팀플 분야 삭제 후 IndexedDB에 그 분야의 teamLogs·attachments·files 가 0개다
- [ ] 화면 코드(`pages/`, `components/`)에서 `db.js` 를 import 하는 곳이 없다

## 변경 이력
| 날짜 | 버전 | 내용 |
|---|---|---|
| 2026-11-23 | v1.0 | 최초 작성 |
