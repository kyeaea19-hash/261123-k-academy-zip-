# 요약.zip — 전력시장 디지털 인재 아카데미 학습 기록

## 1. 이 프로젝트는?

아카데미에서 매일 배운 내용을 **날짜별로 기록**하고, 내가 정한 **분야별로 모아 보고**, **팀 프로젝트(팀플) 자료와 결과물**까지 한곳에 정리하는 웹앱이에요.

- 하루 기록: 배운 내용·느낀 점 자동 저장, 성장 기록 메모지(관심·궁금·다짐)
- 분야: 기록에 분야 태그를 붙여 모아 보기, 성장 보드
- 팀플: 팀 정보, 날짜별 진행 내용, 자료·결과물 첨부(파일·링크)
- AI(선택): 하루 요약, 분야 요약, 분야 태그 추천 — 버튼을 누를 때만 동작
- 검색, 백업 파일 내보내기/가져오기

> **쉽게 말하면** — 공책(기록)은 내 브라우저 안에 있고, AI에게 물어볼 때만 우리 서버가 대신 OpenAI에 전달해 줘요.

기술: 순수 HTML·CSS·JavaScript(빌드 없음) + Node.js 22 Vercel 함수(`api/`) + 브라우저 IndexedDB.

## 2. 실행 방법(로컬)

준비물: [Node.js 22 이상](https://nodejs.org)

```powershell
npm install
npm run dev
```

브라우저에서 <http://localhost:3000> 을 열어요. 자동 테스트는 아래 명령으로 실행해요.

```powershell
npm test
```

## 3. 환경변수

`.env.example` 을 복사해 `.env.local` 을 만들고 값을 채워요. **`.env.local` 은 절대 커밋하지 않아요** (`.gitignore` 에 포함).

| 이름 | 필수 | 설명 |
|---|---|---|
| `OPENAI_API_KEY` | AI 사용 시 | OpenAI API 키 |
| `OPENAI_MODEL` | AI 사용 시 | OpenAI 공식 문서에서 확인한 모델 이름 (Responses API + Structured Outputs 지원 모델) |
| `ACCESS_CODE` | 선택 (배포 시 권장) | AI 접근 코드. 설정하면 앱 설정 화면에 같은 코드를 넣어야 AI를 쓸 수 있어요 |

키가 없어도 AI를 뺀 모든 기능은 동작해요. 배포 사이트에서는 Vercel → Settings → Environment Variables 에 같은 값을 넣고 **다시 배포(Redeploy)** 해야 적용돼요.

## 4. 배포 주소

- 운영 주소: _(배포 후 여기에 적어 주세요 — 예: `https://academy-summary-zip.vercel.app`)_
- 배포 방법: [`docs/07-deployment.md`](docs/07-deployment.md)

## 5. 데이터 저장 위치와 백업

- 모든 기록은 **지금 쓰는 브라우저의 IndexedDB** 에만 저장돼요. 서버에는 저장되지 않아요.
- **주소(도메인)가 다르면 데이터도 달라요.** 운영 주소와 미리보기(`…-git-….vercel.app`) 주소는 서로 다른 저장공간이니, 실제 기록은 운영 주소 하나에서만 하세요.
- 다른 컴퓨터·브라우저로 옮길 때: 설정 → `백업 파일 내보내기` → 새 브라우저에서 `백업 파일 가져오기`.
- 브라우저의 "쿠키 및 사이트 데이터 삭제"를 하면 기록이 지워질 수 있어요. **주기적으로 백업**해 주세요.
- AI 버튼을 누를 때만 그 기록의 글자가 OpenAI로 전송돼요. 첨부 파일은 전송되지 않아요.

## 6. 문서 안내

| 문서 | 내용 |
|---|---|
| [`AGENTS.md`](AGENTS.md) | AI 코딩 에이전트 작업 규칙 |
| [`PRD.md`](PRD.md) | 제품 요구사항 |
| [`docs/README.md`](docs/README.md) | docs 폴더 안내 + 용어 사전 |
| [`docs/01-project-setup.md`](docs/01-project-setup.md) ~ [`docs/09-qa-checklist.md`](docs/09-qa-checklist.md) | 설치·디자인·화면·데이터·기능·API·배포·작업 순서·검증 기준 |

## 7. 문제 해결

자주 생기는 문제와 해결 방법은 [`docs/07-deployment.md` §7](docs/07-deployment.md#7-문제-해결)을 보세요.
