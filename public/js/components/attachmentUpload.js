import { h } from '../utils/dom.js';
import { openModal } from './modal.js';
import { toast } from './toast.js';
import { addFileAttachment, addLinkAttachment } from '../store.js';
import { getFileTypeInfo } from '../utils/fileTypes.js';
import { formatBytes } from '../utils/format.js';
import { MAX_ATTACHMENTS_PER_LOG, MAX_FILE_BYTES, MAX_LINK_NAME, MAX_URL } from '../constants.js';

const LIMIT_MESSAGE = `일지 1개당 첨부는 ${MAX_ATTACHMENTS_PER_LOG}개까지예요. 다른 첨부를 지운 뒤 다시 올려 주세요.`;
const QUOTA_MESSAGE = '브라우저 저장공간이 부족해요. 백업 후 오래된 첨부를 지워 주세요.';
const URL_MESSAGE = 'http:// 또는 https:// 로 시작하는 주소를 입력해 주세요';

// 저장공간 부족 오류인지 확인한다
function isQuotaError(err) {
  return err && (err.name === 'QuotaExceededError' || err.inner?.name === 'QuotaExceededError');
}

// 자료/결과물 라디오 묶음을 만든다 (선택값은 onChange 로 알려 준다)
function categoryRadios(groupName, onChange) {
  const makeOption = (value, label, checked) => h('label', {
    style: { display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', minHeight: '44px' }
  }, [
    h('input', { type: 'radio', name: groupName, value, checked, onChange: () => onChange(value) }),
    label
  ]);
  return h('div', { role: 'radiogroup', style: { display: 'flex', gap: 'var(--space-lg)' } }, [
    makeOption('material', '자료', true),
    makeOption('output', '결과물', false)
  ]);
}

// URL 이 http/https 이고 2000자 이하인지 검사한다
export function isAllowedUrl(value) {
  if (!value || value.length > MAX_URL) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// 고른 파일들을 검사하고, 통과한 파일을 구분 선택 모달을 거쳐 저장한다
// 예) 현재 19개 + 파일 3개 → 1개만 통과, 2개는 "20개 초과" 토스트
export async function uploadFiles(files, { fieldId, date, currentCount }) {
  const valid = [];
  const problems = [];
  for (const f of files) {
    const info = getFileTypeInfo(f.name);
    if (!info.allowed) {
      problems.push(`올릴 수 없는 파일 형식이에요 (.${info.ext || '확장자 없음'})`);
    } else if (f.size > MAX_FILE_BYTES) {
      problems.push(`${f.name}: 10MB 초과`);
    } else if (currentCount + valid.length >= MAX_ATTACHMENTS_PER_LOG) {
      problems.push(`${f.name}: ${LIMIT_MESSAGE}`);
    } else {
      valid.push(f);
    }
  }
  problems.forEach(msg => toast(msg, { type: 'error' }));
  if (valid.length === 0) return false;

  let category = 'material';
  const fileList = h('ul', {
    style: { listStyle: 'none', padding: 0, margin: 'var(--space-sm) 0 0', display: 'flex', flexDirection: 'column', gap: '4px' }
  }, valid.map(f => h('li', {
    style: { fontSize: 'var(--fs-caption-md)', color: 'var(--color-charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
  }, [`${f.name} · ${formatBytes(f.size)}`])));

  const added = await openModal({
    title: '이 파일을 어디에 넣을까요?',
    body: [categoryRadios('uploadCategory', v => { category = v; }), fileList],
    actions: [
      { label: '취소', className: 'btn btn--outline-ink', value: false },
      {
        label: '추가',
        className: 'btn btn--ink',
        onClick: async () => {
          let count = 0;
          try {
            for (const file of valid) {
              await addFileAttachment({ fieldId, date, category, file });
              count++;
            }
          } catch (err) {
            if (isQuotaError(err)) toast(QUOTA_MESSAGE, { type: 'error' });
            else if (err?.code === 'LIMIT_EXCEEDED') toast(LIMIT_MESSAGE, { type: 'error' });
            else toast('파일을 저장하지 못했어요. 다시 시도해 주세요.', { type: 'error' });
          }
          if (count > 0) toast(`파일 ${count}개를 추가했어요.`);
          return true;
        },
        value: true
      }
    ]
  });
  return Boolean(added);
}

// 링크 추가 모달을 열고 저장한다
export async function openLinkModal({ fieldId, date, currentCount }) {
  if (currentCount >= MAX_ATTACHMENTS_PER_LOG) {
    toast(LIMIT_MESSAGE, { type: 'error' });
    return false;
  }

  let category = 'material';
  const urlInput = h('input', {
    type: 'url', className: 'input', maxLength: MAX_URL, placeholder: 'https://…', id: 'link-url-input', required: true
  });
  const nameInput = h('input', {
    type: 'text', className: 'input', maxLength: MAX_LINK_NAME, placeholder: '비우면 주소의 도메인으로 저장해요', id: 'link-name-input'
  });

  const added = await openModal({
    title: '링크 추가',
    body: [
      h('div', { className: 'form-group' }, [h('label', { className: 'form-label', htmlFor: 'link-url-input' }, ['주소 (URL)']), urlInput]),
      h('div', { className: 'form-group' }, [h('label', { className: 'form-label', htmlFor: 'link-name-input' }, ['이름 (선택)']), nameInput]),
      h('div', { className: 'form-group' }, [h('span', { className: 'form-label' }, ['구분']), categoryRadios('linkCategory', v => { category = v; })])
    ],
    actions: [
      { label: '취소', className: 'btn btn--outline-ink', value: false },
      {
        label: '추가',
        className: 'btn btn--ink',
        value: true,
        onClick: async () => {
          const url = urlInput.value.trim();
          if (!isAllowedUrl(url)) {
            toast(URL_MESSAGE, { type: 'error' });
            urlInput.focus();
            return false;
          }
          try {
            await addLinkAttachment({ fieldId, date, category, name: nameInput.value, url });
            toast('링크를 추가했어요.');
            return true;
          } catch (err) {
            toast(err?.code === 'LIMIT_EXCEEDED' ? LIMIT_MESSAGE : '링크를 저장하지 못했어요. 다시 시도해 주세요.', { type: 'error' });
            return false;
          }
        }
      }
    ]
  });
  return Boolean(added);
}
