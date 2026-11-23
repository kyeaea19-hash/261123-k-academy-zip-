import { h, clear } from '../utils/dom.js';
import { icon } from './icons.js';
import { toast } from './toast.js';
import { postJson } from '../api.js';
import { countNonSpace } from '../utils/format.js';
import { AI_MIN_CHARS } from '../constants.js';

/**
 * 하루 기록 섹션 C 의 `AI 추천` 버튼과 결과 박스.
 * - getDay(): 현재 Day, getFields(): 전체 분야 목록
 * - onAttach(ids): 고른 분야를 붙인다 (사용자가 `붙이기` 를 눌렀을 때만)
 * 돌려주는 { button, box, update } — update() 로 버튼 활성 상태를 다시 계산한다.
 */
export function createAiSuggest({ getDay, getFields, onAttach, flush }) {
  let busy = false;
  let suggested = []; // 분야 객체 배열

  const box = h('div', {});
  const button = h('button', {
    type: 'button',
    className: 'btn btn--outline-ink btn--sm',
    onClick: run
  }, [icon('sparkle', { size: 16 }), 'AI 추천']);

  // 버튼을 쓸 수 있는지 다시 계산한다 (이유는 title 로 보여 줌)
  function update() {
    const day = getDay();
    let reason = '';
    if (getFields().length === 0) reason = '분야를 먼저 만들어 주세요';
    else if (countNonSpace(day.learned || '') < AI_MIN_CHARS) reason = `배운 내용을 ${AI_MIN_CHARS}자 이상 적으면 추천받을 수 있어요`;
    button.disabled = busy || Boolean(reason);
    button.title = reason;
    // 이미 붙은 분야는 추천에서 뺀다
    const tagged = new Set(day.fieldIds || []);
    suggested = suggested.filter(f => !tagged.has(f.id) && getFields().some(x => x.id === f.id));
    drawBox();
  }

  // 추천 결과 박스를 그린다
  function drawBox() {
    clear(box);
    if (suggested.length === 0) return;
    box.appendChild(h('div', { className: 'ai-suggest', role: 'region', 'aria-label': 'AI 분야 추천' }, [
      h('span', { className: 'ai-suggest__label' }, ['AI 추천:']),
      ...suggested.map(f => h('span', { className: 'ai-suggest__item' }, [
        h('span', {}, [`● ${f.name}`]),
        h('button', { type: 'button', className: 'btn btn--text', onClick: () => attach([f.id]) }, ['붙이기'])
      ])),
      suggested.length > 1
        ? h('button', { type: 'button', className: 'btn btn--text', onClick: () => attach(suggested.map(f => f.id)) }, ['모두 붙이기'])
        : null,
      h('button', {
        type: 'button', className: 'icon-btn', 'aria-label': 'AI 추천 닫기',
        onClick: () => { suggested = []; drawBox(); button.focus(); }
      }, [icon('close', { size: 16 })])
    ]));
  }

  // 고른 분야를 붙이고 추천 목록에서 뺀다
  async function attach(ids) {
    try {
      await onAttach(ids);
      suggested = suggested.filter(f => !ids.includes(f.id));
      drawBox();
    } catch {
      toast('분야를 붙이지 못했어요. 다시 시도해 주세요.', { type: 'error' });
    }
  }

  // AI 에 추천을 요청한다 (이미 붙은 분야는 보내지 않음)
  async function run() {
    if (busy) return;
    if (flush) await flush();
    const day = getDay();
    const tagged = new Set(day.fieldIds || []);
    const candidates = getFields().filter(f => !tagged.has(f.id));
    if (candidates.length === 0) {
      toast('이미 모든 분야를 붙였어요.');
      return;
    }
    busy = true;
    update();
    clear(button);
    button.append(icon('sparkle', { size: 16 }), '추천받는 중…');
    try {
      const data = await postJson('/api/suggest-fields', {
        text: `${day.title || ''}\n${day.learned || ''}`,
        fields: candidates.map(f => ({ id: f.id, name: f.name }))
      });
      const ids = Array.isArray(data.fieldIds) ? data.fieldIds : [];
      suggested = ids.map(id => candidates.find(f => f.id === id)).filter(Boolean);
      if (suggested.length === 0) toast('어울리는 분야를 찾지 못했어요');
    } catch (err) {
      toast(err.message, { type: 'error' });
    } finally {
      busy = false;
      clear(button);
      button.append(icon('sparkle', { size: 16 }), 'AI 추천');
      update();
    }
  }

  update();
  return { button, box, update };
}
