# 07. Vercel 배포 지침 (프로젝트 생성 지침 ②)

> **쉽게 말하면** — GitHub에 코드를 올리고, Vercel이 그 코드를 가져가 인터넷 주소(`https://….vercel.app`)로 열어 줍니다. 이후 GitHub에 코드를 올릴(push) 때마다 자동으로 다시 배포됩니다.

---

## 1. 배포 전 확인
- [ ] `docs/09-qa-checklist.md` 의 로컬 항목이 모두 통과
- [ ] `npm test` 실패 0개
- [ ] `.gitignore` 에 `.env.local` 이 있고, `git status` 에 `.env.local` 이 보이지 않음
- [ ] `public/` 안에 API 키가 없음 (`grep -rn "sk-" public/` 결과 없음)

## 2. GitHub에 올리기
```bash
git init                      # 처음 한 번
git add .
git commit -m "[Step10] 첫 배포"
# GitHub 웹사이트에서 새 저장소 'academy-summary-zip' (Private 권장) 생성 후 안내되는 명령 실행
git remote add origin https://github.com/{내아이디}/academy-summary-zip.git
git branch -M main
git push -u origin main
```
> 에이전트는 사용자가 요청하기 전에는 `push` 하지 않는다(AGENTS.md §6.4).

## 3. Vercel 프로젝트 만들기 (웹 화면에서)

| 단계 | 화면 | 입력/선택 값 |
|---|---|---|
| 1 | vercel.com → **Add New… → Project** | GitHub의 `academy-summary-zip` 저장소 **Import** |
| 2 | Configure Project → Framework Preset | **Other** |
| 3 | Root Directory | `./` (그대로) |
| 4 | Build and Output Settings → Build Command | 비워 둠 (Override 끔) |
| 5 | Output Directory | `public` (vercel.json 에도 있음) |
| 6 | Install Command | 그대로 (`npm install`) |
| 7 | Environment Variables | 아래 §4 세 개 입력 |
| 8 | **Deploy** 클릭 | 1~2분 후 주소 발급 |

## 4. 환경변수 (Vercel → Project → Settings → Environment Variables)

| Key | Value | Environments |
|---|---|---|
| `OPENAI_API_KEY` | `sk-…` (내 키) | Production, Preview |
| `OPENAI_MODEL` | OpenAI 문서에서 확인한 모델 이름 | Production, Preview |
| `ACCESS_CODE` | 나만 아는 코드 (예: 영문+숫자 12자 이상) | Production, Preview |

> ⚠️ 환경변수를 **추가·변경한 뒤에는 반드시 다시 배포**해야 적용됩니다: Deployments → 최신 배포의 `…` → **Redeploy**.

## 5. 배포 후 확인 (배포 주소에서)
1. `https://{주소}/api/health` → `"aiConfigured": true, "accessRequired": true` 확인
2. 사이트 접속 → 첫 실행 모달 → 과정 설정
3. 설정 화면 → 접근 코드 입력 → "✓ AI를 사용할 수 있어요"
4. 하루 기록 작성 → AI 하루 요약 성공
5. 개발자도구 → Network → 응답 헤더에 `Content-Security-Policy` 가 있는지
6. 개발자도구 → Console 빨간 오류 0개
7. 휴대폰으로 접속해 화면 확인

## 6. 꼭 알아야 할 점 — 데이터는 "브라우저 + 주소"마다 따로
- 기록은 브라우저 안(IndexedDB)에 저장되므로 **주소(도메인)가 다르면 데이터도 다릅니다.**
  - `https://academy-summary-zip.vercel.app` (운영 주소)와 `https://academy-summary-zip-git-…vercel.app` (미리보기 주소)는 서로 다른 저장공간입니다.
  - 실제 기록은 **항상 운영 주소 하나만** 사용하세요.
- 다른 컴퓨터·브라우저로 옮길 때는 설정 → 백업 파일 내보내기 → 새 브라우저에서 가져오기.
- 브라우저의 "인터넷 사용 기록 삭제(쿠키 및 사이트 데이터)"를 하면 기록이 지워질 수 있으니 주기적으로 백업하세요.

## 7. 문제 해결

| 증상 | 원인 | 해결 |
|---|---|---|
| 사이트는 열리는데 `/api/health` 가 404 | `api/` 폴더가 루트에 없음 / 파일 이름 오타 / Framework Preset이 Other가 아님 | 폴더 위치·이름 확인 후 재배포 |
| 배포 로그 `No Output Directory named "public" found` | `public/` 폴더가 저장소에 없음 | `public/index.html` 커밋 확인 |
| AI 버튼 → "서버에 AI 설정이 안 되어 있어요" | 환경변수 없음 또는 재배포 안 함 | §4 확인 후 Redeploy |
| AI 버튼 → "AI 접근 코드가 맞지 않아요" | 설정 화면 코드 ≠ `ACCESS_CODE` | 설정 화면에서 다시 입력 |
| AI 버튼 → 30초 후 실패 | OpenAI 응답 지연 | 다시 시도. 계속되면 Vercel → Logs 에서 오류 코드 확인 |
| 글꼴이 기본 글꼴로 보임 | CSP `font-src` 누락 / CDN 주소 오타 | `vercel.json` CSP와 `fonts.css` 주소 확인 |
| 배포 로그에 Node 버전 경고 | `engines.node` 와 Vercel 설정 불일치 | Settings → General → Node.js Version 을 22.x 로 |
| 다른 기기에서 기록이 안 보임 | 정상 동작(로컬 저장) | 백업 파일로 옮기기 (§6) |

## 완료 기준 (이 문서 범위)
- [ ] 운영 주소에서 §5 의 1~7이 모두 통과
- [ ] GitHub에 `.env.local` 이 올라가 있지 않음 (저장소 파일 목록 확인)
- [ ] `README.md` 에 운영 주소와 이 문서 §6 요약이 적혀 있음

## 변경 이력
| 날짜 | 버전 | 내용 |
|---|---|---|
| 2026-11-23 | v1.0 | 최초 작성 |
