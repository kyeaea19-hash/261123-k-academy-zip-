import { h, clear } from '../utils/dom.js';
import { icon } from './icons.js';
import { confirmDialog } from './modal.js';
import { toast } from './toast.js';
import { listAttachments, deleteAttachment, getFileBlob } from '../store.js';
import { getFileTypeInfo, ACCEPT_ATTR } from '../utils/fileTypes.js';
import { formatBytes } from '../utils/format.js';
import { uploadFiles, openLinkModal } from './attachmentUpload.js';

// 화면에 그려진 썸네일 Object URL 목록 (화면 destroy() 에서 모두 해제)
let activeObjectUrls = [];

// 썸네일 Object URL 을 모두 해제한다 (페이지 destroy 에서 호출)
export function cleanupAttachmentUrls() {
  while (activeObjectUrls.length > 0) {
    const url = activeObjectUrls.pop();
    try { URL.revokeObjectURL(url); } catch {}
  }
}

// 첨부 파일/링크를 연다 (형식에 따라 새 탭 또는 다운로드)
async function openAttachment(att) {
  if (att.kind === 'link') {
    const a = h('a', { href: att.url, target: '_blank', rel: 'noopener noreferrer' });
    a.click();
    return;
  }
  try {
    const blob = await getFileBlob(att.id);
    if (!blob) {
      toast('파일을 찾을 수 없어요. 첨부를 지우고 다시 올려 주세요.', { type: 'error' });
      return;
    }
    const url = URL.createObjectURL(blob);
    if (getFileTypeInfo(att.name).openMode === 'tab') {
      window.open(url, '_blank', 'noopener');
    } else {
      h('a', { href: url, download: att.name }).click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    toast('파일을 열지 못했어요. 다시 시도해 주세요.', { type: 'error' });
  }
}

// 링크의 도메인 이름을 구한다 (잘못된 주소면 '링크')
function hostOf(url) {
  try { return new URL(url).hostname; } catch { return '링크'; }
}

// 첨부 1개 줄을 그린다 (썸네일/아이콘 + 이름 + 삭제 버튼)
function renderItem(att, { readOnly, onDeleted }) {
  let leading;
  if (att.kind === 'link') {
    leading = icon('link', { size: 24 });
  } else if (getFileTypeInfo(att.name).isImage) {
    leading = h('img', { alt: '', className: 'attachment__thumb' });
    getFileBlob(att.id).then(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      activeObjectUrls.push(url);
      leading.src = url;
    }).catch(() => {});
  } else {
    leading = icon('file', { size: 24 });
  }

  const meta = att.kind === 'file'
    ? `${getFileTypeInfo(att.name).ext.toUpperCase()} · ${formatBytes(att.size)}`
    : hostOf(att.url);

  const openBtn = h('button', {
    type: 'button',
    className: 'attachment__open',
    title: att.name,
    onClick: () => openAttachment(att)
  }, [
    h('span', { className: 'attachment__icon' }, [leading]),
    h('span', { className: 'attachment__text' }, [
      h('span', { className: 'attachment__name' }, [att.name]),
      h('span', { className: 'attachment__meta' }, [meta])
    ])
  ]);

  const deleteBtn = readOnly ? null : h('button', {
    type: 'button',
    className: 'icon-btn',
    'aria-label': `${att.name} 삭제`,
    onClick: async () => {
      const ok = await confirmDialog({
        title: '첨부 삭제',
        message: `'${att.name}'을(를) 삭제할까요?`,
        confirmLabel: '삭제',
        danger: true
      });
      if (!ok) return;
      try {
        await deleteAttachment(att.id);
        toast('첨부를 삭제했어요.');
        onDeleted();
      } catch {
        toast('첨부를 삭제하지 못했어요. 다시 시도해 주세요.', { type: 'error' });
      }
    }
  }, [icon('close', { size: 16 })]);

  return h('li', { className: 'attachment' }, [openBtn, deleteBtn]);
}

// 한 구분(자료/결과물) 열을 그린다
function renderColumn(title, items, opts) {
  return h('div', { className: 'attachment-col' }, [
    h('h4', { className: 'attachment-col__title' }, [`${title} ${items.length}`]),
    items.length > 0
      ? h('ul', { className: 'attachment-col__list' }, items.map(a => renderItem(a, opts)))
      : h('p', { className: 'attachment-col__empty' }, ['아직 없어요'])
  ]);
}

/**
 * 첨부 목록(+ 편집 모드에서는 업로드 줄)을 그린다.
 * - readOnly: true 면 삭제·업로드 없이 열기만 (팀플 상세 타임라인)
 * - atts: 미리 읽어 둔 첨부 배열 (없으면 DB 에서 읽음)
 * - category: 'material' | 'output' 이면 그 구분 1열만 그림
 * - dropTarget: 끌어다 놓기를 받을 요소 (보통 팀플 카드)
 */
export function renderAttachmentList(container, {
  fieldId, date, readOnly = false, atts = null, category = null, dropTarget = null, onUpdated = null
}) {
  let current = [];

  // 첨부를 다시 읽고 그린다
  async function reload() {
    try {
      current = await listAttachments(`${fieldId}__${date}`);
    } catch {
      clear(container);
      container.appendChild(h('p', { className: 'form-error' }, ['첨부 목록을 불러오지 못했어요. 새로고침해 주세요.']));
      return;
    }
    draw();
    if (onUpdated) onUpdated(current);
  }

  // 현재 첨부 배열로 화면을 그린다
  function draw() {
    clear(container);
    const opts = { readOnly, onDeleted: reload };
    const materials = current.filter(a => a.category === 'material');
    const outputs = current.filter(a => a.category === 'output');

    if (category === 'material') container.appendChild(renderColumn('자료', materials, opts));
    else if (category === 'output') container.appendChild(renderColumn('결과물', outputs, opts));
    else {
      container.appendChild(h('div', { className: 'attachment-grid' }, [
        renderColumn('자료', materials, opts),
        renderColumn('결과물', outputs, opts)
      ]));
    }

    if (readOnly) return;

    const fileInput = h('input', {
      type: 'file',
      multiple: true,
      accept: ACCEPT_ATTR,
      hidden: true,
      onChange: async () => {
        const files = Array.from(fileInput.files || []);
        fileInput.value = '';
        if (files.length > 0 && await uploadFiles(files, { fieldId, date, currentCount: current.length })) reload();
      }
    });

    container.appendChild(h('div', { className: 'attachment-actions' }, [
      fileInput,
      h('button', { type: 'button', className: 'btn btn--outline-ink btn--sm', onClick: () => fileInput.click() },
        [icon('upload', { size: 16 }), '파일 추가']),
      h('button', {
        type: 'button',
        className: 'btn btn--outline-ink btn--sm',
        onClick: async () => {
          if (await openLinkModal({ fieldId, date, currentCount: current.length })) reload();
        }
      }, [icon('link', { size: 16 }), '링크 추가']),
      h('span', { className: 'attachment-actions__hint' }, ['또는 파일을 여기로 끌어다 놓으세요'])
    ]));
  }

  // 끌어다 놓기 (한 번만 연결)
  if (!readOnly && dropTarget) {
    let depth = 0;
    const setDragging = (on) => dropTarget.classList.toggle('is-dragover', on);
    dropTarget.addEventListener('dragenter', (e) => {
      if (!e.dataTransfer?.types?.includes('Files')) return;
      e.preventDefault();
      depth++;
      setDragging(true);
    });
    dropTarget.addEventListener('dragover', (e) => {
      if (e.dataTransfer?.types?.includes('Files')) e.preventDefault();
    });
    dropTarget.addEventListener('dragleave', () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    });
    dropTarget.addEventListener('drop', async (e) => {
      e.preventDefault();
      depth = 0;
      setDragging(false);
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length > 0 && await uploadFiles(files, { fieldId, date, currentCount: current.length })) reload();
    });
  }

  if (atts) {
    current = atts;
    draw();
  } else {
    reload();
  }
}
