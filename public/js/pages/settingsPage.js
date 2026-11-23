import { h, clear } from '../utils/dom.js';
import { openModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { getCourse, saveCourse, generateDays, getStats, getLastBackupAt, wipeAll } from '../store.js';
import { getAccessCode, setAccessCode } from '../api.js';
import { downloadBackup, importBackupFile } from '../backup.js';
import { formatBytes } from '../utils/format.js';
import { listDateRange, formatDateDot } from '../utils/date.js';
import { MAX_COURSE_NAME } from '../constants.js';

// 섹션 카드 (제목 + 내용)
function section(title, children, extraClass = '') {
  return h('section', { className: `card--feature settings-section ${extraClass}`, 'aria-label': title }, [
    h('h2', { className: 'settings-section__title' }, [title]),
    ...children
  ]);
}

// 라벨 + 입력 묶음
function field(label, input) {
  return h('div', { className: 'form-group' }, [h('label', { className: 'form-label', htmlFor: input.id }, [label]), input]);
}

// ISO 시각 → '2026.11.20 18:02'
function formatStamp(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${formatDateDot(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// 1. 과정 정보 섹션
function courseSection(course) {
  const name = h('input', { id: 'set-course-name', type: 'text', className: 'input', maxLength: MAX_COURSE_NAME, value: course?.name || '' });
  const start = h('input', { id: 'set-course-start', type: 'date', className: 'input', value: course?.startDate || '' });
  const end = h('input', { id: 'set-course-end', type: 'date', className: 'input', value: course?.endDate || '' });
  const weekends = h('input', { id: 'set-course-weekends', type: 'checkbox', checked: Boolean(course?.includeWeekends) });

  // 입력값을 검사한다 → 오류 문구 또는 ''
  function check() {
    if (!name.value.trim()) return '과정 이름을 입력해 주세요';
    if (start.value && end.value) {
      if (end.value < start.value) return '종료일은 시작일과 같거나 뒤여야 해요';
      try { listDateRange(start.value, end.value, { includeWeekends: true }); } catch { return '기간은 최대 366일까지 만들 수 있어요'; }
    }
    return '';
  }

  const value = () => ({ name: name.value.trim(), startDate: start.value || null, endDate: end.value || null, includeWeekends: weekends.checked });

  return section('과정 정보', [
    field('과정 이름', name),
    h('div', { className: 'settings-row' }, [field('시작일', start), field('종료일', end)]),
    h('label', { className: 'settings-check', htmlFor: weekends.id }, [weekends, ' 주말 포함']),
    h('div', { className: 'settings-actions' }, [
      h('button', {
        type: 'button', className: 'btn btn--ink',
        onClick: async () => {
          const err = check();
          if (err) return toast(err, { type: 'error' });
          try { await saveCourse(value()); toast('과정 정보를 저장했어요'); }
          catch { toast('과정 정보를 저장하지 못했어요. 다시 시도해 주세요.', { type: 'error' }); }
        }
      }, ['저장']),
      h('button', {
        type: 'button', className: 'btn btn--outline-ink',
        onClick: async () => {
          const err = check();
          if (err) return toast(err, { type: 'error' });
          if (!start.value || !end.value) return toast('시작일과 종료일을 모두 입력해 주세요', { type: 'error' });
          try {
            await saveCourse(value());
            const n = await generateDays(value());
            toast(n > 0 ? `날짜 ${n}개를 추가했어요` : '추가할 날짜가 없어요');
          } catch { toast('날짜를 추가하지 못했어요. 다시 시도해 주세요.', { type: 'error' }); }
        }
      }, ['기간에 맞춰 빈 날짜 채우기'])
    ]),
    h('p', { className: 'form-hint' }, ['이미 있는 날짜는 그대로 두고, 빠진 날짜만 추가해요'])
  ]);
}

// 2. AI 사용 설정 섹션
function aiSection() {
  const code = h('input', { id: 'set-access-code', type: 'password', className: 'input', value: getAccessCode(), autocomplete: 'off' });
  const result = h('p', { className: 'settings-result', 'aria-live': 'polite' });
  const toggle = h('button', {
    type: 'button', className: 'btn btn--outline-ink btn--sm', 'aria-pressed': 'false',
    onClick: () => {
      const show = code.type === 'password';
      code.type = show ? 'text' : 'password';
      toggle.textContent = show ? '숨기기' : '보기';
      toggle.setAttribute('aria-pressed', String(show));
    }
  }, ['보기']);

  // 코드를 저장하고 /api/health 로 연결을 확인한다
  async function saveAndCheck() {
    setAccessCode(code.value.trim());
    result.textContent = '확인하는 중…';
    result.className = 'settings-result';
    try {
      const headers = {};
      if (code.value.trim()) headers['x-access-code'] = code.value.trim();
      const res = await fetch('/api/health', { headers });
      const { data } = await res.json();
      let text = '✓ AI를 사용할 수 있어요';
      let ok = true;
      if (!data.aiConfigured) { text = '서버에 AI 키가 설정되지 않았어요'; ok = false; }
      else if (!data.accessGranted) { text = '접근 코드가 맞지 않아요'; ok = false; }
      result.textContent = text;
      result.className = `settings-result ${ok ? 'settings-result--ok' : 'settings-result--bad'}`;
    } catch {
      result.textContent = '서버에 연결할 수 없어요';
      result.className = 'settings-result settings-result--bad';
    }
  }

  return section('AI 사용 설정', [
    h('div', { className: 'form-group' }, [
      h('label', { className: 'form-label', htmlFor: code.id }, ['접근 코드']),
      h('div', { className: 'settings-row settings-row--tight' }, [code, toggle])
    ]),
    h('button', { type: 'button', className: 'btn btn--ink', onClick: saveAndCheck }, ['저장 후 연결 확인']),
    result,
    h('p', { className: 'form-hint' }, ['AI 버튼을 누를 때만 해당 기록의 글자가 OpenAI로 전송돼요. 첨부 파일은 전송되지 않아요.'])
  ]);
}

// 3. 저장공간 섹션
function storageSection(stats) {
  const bar = h('div', { className: 'storage-bar', role: 'progressbar', 'aria-label': '저장공간 사용량' }, [h('div', { className: 'storage-bar__fill' })]);
  const text = h('p', { className: 'settings-result' }, ['확인하는 중…']);
  (async () => {
    try {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      const pct = quota ? Math.min(100, (usage / quota) * 100) : 0;
      bar.firstChild.style.width = `${Math.max(pct, usage > 0 ? 1 : 0)}%`;
      bar.setAttribute('aria-valuenow', String(Math.round(pct)));
      text.textContent = `사용 중 ${formatBytes(usage)} / 사용 가능 약 ${formatBytes(quota)}`;
    } catch {
      text.textContent = '확인할 수 없어요';
    }
  })();
  return section('저장공간', [
    bar, text,
    h('p', { className: 'form-hint' }, [`기록 ${stats.totalDays}일 · 메모지 ${stats.noteCount}장 · 첨부 ${stats.attachmentCount}개`])
  ]);
}

// 4. 백업 섹션
function backupSection(lastBackupAt) {
  const last = h('p', { className: 'form-hint' }, [lastBackupAt ? `마지막 백업: ${formatStamp(lastBackupAt)}` : '아직 백업한 적 없어요']);
  const fileInput = h('input', {
    type: 'file', accept: '.json,application/json', hidden: true,
    onChange: async () => {
      const file = fileInput.files?.[0];
      fileInput.value = '';
      if (file) await importBackupFile(file);
    }
  });
  const exportBtn = h('button', {
    type: 'button', className: 'btn btn--primary',
    onClick: async () => {
      exportBtn.disabled = true;
      const at = await downloadBackup();
      exportBtn.disabled = false;
      if (at) last.textContent = `마지막 백업: ${formatStamp(at)}`;
    }
  }, ['백업 파일 내보내기']);
  return section('백업', [
    h('p', { className: 'form-hint' }, ['기록은 이 브라우저에만 저장돼요. 다른 브라우저나 컴퓨터로 옮기려면 백업 파일을 써요.']),
    h('div', { className: 'settings-actions' }, [
      exportBtn,
      h('button', { type: 'button', className: 'btn btn--outline-ink', onClick: () => fileInput.click() }, ['백업 파일 가져오기']),
      fileInput
    ]),
    last
  ]);
}

// 5. 위험 구역 — `삭제` 를 직접 입력해야 버튼이 켜진다
function dangerSection() {
  async function openWipe() {
    const ok = await openModal({
      title: '모든 데이터 삭제',
      body: (close) => {
        const confirmBtn = h('button', { type: 'button', className: 'btn btn--danger', disabled: true, onClick: () => close(true) }, ['삭제']);
        const typed = h('input', {
          id: 'wipe-confirm', type: 'text', className: 'input', autocomplete: 'off',
          onInput: () => { confirmBtn.disabled = typed.value.trim() !== '삭제'; }
        });
        return [
          h('p', { style: { lineHeight: 'var(--lh-body)', marginBottom: 'var(--space-sm)' } }, ['모든 기록·메모지·분야·팀플 일지·첨부가 지워지고 되돌릴 수 없어요. 계속하려면 아래 칸에 삭제 를 입력해 주세요.']),
          field('확인 글자', typed),
          h('div', { className: 'modal-footer' }, [
            h('button', { type: 'button', className: 'btn btn--outline-ink', onClick: () => close(false) }, ['취소']),
            confirmBtn
          ])
        ];
      }
    });
    if (!ok) return;
    try {
      await wipeAll();
      window.location.hash = '#/';
      window.location.reload();
    } catch {
      toast('삭제하지 못했어요. 다시 시도해 주세요.', { type: 'error' });
    }
  }
  return section('위험 구역', [
    h('p', { className: 'form-hint' }, ['이 브라우저에 저장된 모든 데이터를 지워요. 먼저 백업 파일을 내보내 두세요.']),
    h('button', { type: 'button', className: 'btn btn--danger', onClick: openWipe }, ['모든 데이터 삭제'])
  ], 'settings-section--danger');
}

// 설정 화면 (#/settings)
export async function render(container) {
  clear(container);
  document.title = '설정 — 요약.zip';
  let course = null, stats = { totalDays: 0, noteCount: 0, attachmentCount: 0 }, lastBackupAt = null;
  try {
    [course, stats, lastBackupAt] = await Promise.all([getCourse(), getStats(), getLastBackupAt()]);
  } catch {
    toast('설정을 불러오지 못했어요. 새로고침해 주세요.', { type: 'error' });
  }
  container.appendChild(h('div', { className: 'content-container section settings' }, [
    h('h1', { style: { fontSize: 'var(--fs-display-md)', fontWeight: '500', marginBottom: 'var(--space-xl)' } }, ['설정']),
    courseSection(course),
    aiSection(),
    storageSection(stats),
    backupSection(lastBackupAt),
    dangerSection()
  ]));
}
