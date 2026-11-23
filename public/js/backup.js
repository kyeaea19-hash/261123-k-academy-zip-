// 백업 파일 내보내기 / 가져오기 화면 흐름 (05 §8)
import { exportAll, importAll, setLastBackupAt } from './store.js';
import { validateBackup } from './utils/backupSchema.js';
import { formatBytes } from './utils/format.js';
import { confirmDialog } from './components/modal.js';
import { toast } from './components/toast.js';

// 파일 이름용 시각 'YYYYMMDD-HHmm' (로컬 시각)
function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

// 백업 파일을 만들어 내려받게 한다. 성공하면 저장한 시각(ISO)을 돌려준다
export async function downloadBackup() {
  toast('백업 파일을 만드는 중…');
  try {
    const backup = await exportAll();
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yoyak-zip-backup-${stamp()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    const at = await setLastBackupAt();
    toast(`백업 파일을 저장했어요 (${formatBytes(blob.size)})`);
    return at;
  } catch {
    toast('백업 파일을 만들지 못했어요. 다시 시도해 주세요.', { type: 'error' });
    return null;
  }
}

// 고른 백업 파일을 검사하고, 확인을 받은 뒤 지금 데이터를 바꾼다
export async function importBackupFile(file) {
  if (!file || !/\.json$/i.test(file.name)) {
    toast('백업 파일(.json)을 골라 주세요', { type: 'error' });
    return false;
  }

  let obj;
  try {
    obj = JSON.parse(await file.text());
  } catch {
    toast('파일을 읽을 수 없어요. 손상된 파일일 수 있어요', { type: 'error' });
    return false;
  }

  const checked = validateBackup(obj);
  if (!checked.ok) {
    toast(checked.message, { type: 'error' });
    return false;
  }

  const { days, fields, teamLogs, attachments } = obj.data;
  const ok = await confirmDialog({
    title: '백업 파일 가져오기',
    message: `날짜 ${days.length}개, 분야 ${fields.length}개, 팀플 일지 ${teamLogs.length}개, 첨부 ${attachments.length}개를 불러와요. 지금 있는 데이터는 모두 지워지고 바뀌어요.`,
    confirmLabel: '바꾸기',
    danger: true
  });
  if (!ok) return false;

  try {
    await importAll(obj);
  } catch (err) {
    const quota = err?.name === 'QuotaExceededError';
    toast(quota ? '브라우저 저장공간이 부족해요. 공간을 비운 뒤 다시 시도해 주세요.' : '백업을 불러오지 못했어요. 지금 데이터는 그대로예요.', { type: 'error' });
    return false;
  }
  toast('백업을 불러왔어요');
  setTimeout(() => {
    window.location.hash = '#/';
    window.location.reload();
  }, 600);
  return true;
}
