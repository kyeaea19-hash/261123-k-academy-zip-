import { h, clear } from '../utils/dom.js';
import { postJson } from '../api.js';
import { getDay, updateDay, updateField, listDays, listTeamLogsByField } from '../store.js';
import { hashText, formatDateTime, countNonSpace } from '../utils/format.js';
import {
  AI_MIN_CHARS, AI_FIELD_MAX_ENTRIES,
  AI_ENTRY_LEARNED_CHARS, AI_ENTRY_REFLECTION_CHARS, AI_ENTRY_PROGRESS_CHARS
} from '../constants.js';

// 하루 기록의 내용 해시 (04 §5)
export function dayHash(day) {
  const notes = (day.growthNotes || []).map(n => `${n.kind}:${n.text}`).join('\n');
  return hashText(`${day.title || ''}\n${day.learned || ''}\n${day.reflection || ''}\n${notes}`);
}

// • 목록을 만든다
function bulletList(items) {
  return h('ul', { className: 'ai-panel__list' }, items.map(t => h('li', {}, [t])));
}

/**
 * AI 패널 공통 틀. 상태(결과 없음/입력 부족/생성 중/결과/오래됨/오류)를 그린다.
 * - getState(): { ai, canRun, disabledReason, isStale } 를 돌려주는 async 함수
 * - generate(): AI 를 부르고 저장까지 하는 async 함수
 * - renderResult(ai): 결과 본문 요소
 * 돌려주는 refresh() 로 다시 그릴 수 있다.
 */
function createPanel(container, { title, description, buttonLabel, getState, generate, renderResult }) {
  let busy = false;
  let errorMessage = '';

  // 패널을 다시 그린다
  async function refresh() {
    let state;
    try {
      state = await getState();
    } catch {
      state = { ai: null, canRun: false, disabledReason: '기록을 불러오지 못했어요. 새로고침해 주세요.', isStale: false };
    }
    const { ai, canRun, disabledReason, isStale } = state;
    clear(container);

    const runBtn = h('button', {
      type: 'button',
      className: ai ? 'btn btn--outline-ink btn--sm' : 'btn btn--primary',
      disabled: busy || !canRun,
      title: !canRun && disabledReason ? disabledReason : null,
      onClick: run
    }, [busy ? '요약하는 중… (최대 30초)' : (ai ? '다시 생성' : buttonLabel)]);

    const parts = [
      h('div', { className: 'ai-panel__head' }, [
        h('span', { className: 'badge badge--ai' }, ['AI']),
        h('h2', { className: 'ai-panel__title' }, [title])
      ])
    ];

    if (ai) {
      if (isStale) parts.push(h('p', { className: 'ai-panel__stale' }, ['기록이 바뀌었어요. 다시 생성하면 최신 내용으로 요약해요.']));
      parts.push(renderResult(ai));
      parts.push(h('div', { className: 'ai-panel__foot' }, [
        h('span', { className: 'ai-panel__time' }, [`${formatDateTime(ai.generatedAt)} 생성`]),
        runBtn
      ]));
    } else {
      parts.push(h('p', { className: 'ai-panel__desc' }, [description]));
      if (!canRun && disabledReason) parts.push(h('p', { className: 'ai-panel__hint' }, [disabledReason]));
      parts.push(runBtn);
    }

    if (errorMessage) {
      parts.push(h('div', { className: 'ai-panel__error', role: 'alert' }, [
        h('span', {}, [errorMessage]),
        h('button', { type: 'button', className: 'btn btn--text', disabled: busy, onClick: run }, ['다시 시도'])
      ]));
    }

    container.appendChild(h('section', {
      className: `ai-panel ${ai ? 'ai-panel--result' : ''}`,
      'aria-busy': busy ? 'true' : 'false',
      'aria-label': title
    }, parts));
  }

  // 버튼을 눌렀을 때만 AI 를 부른다 (자동 호출·자동 재시도 없음)
  async function run() {
    if (busy) return;
    busy = true;
    errorMessage = '';
    await refresh();
    try {
      await generate();
    } catch (err) {
      errorMessage = err?.message || 'AI 요약에 실패했어요. 잠시 후 다시 시도해 주세요';
    } finally {
      busy = false;
      await refresh();
    }
  }

  refresh();
  return { refresh };
}

// 하루 기록 화면 섹션 D — AI 하루 요약
export function renderDayAiPanel(container, { date, flush }) {
  return createPanel(container, {
    title: 'AI 하루 요약',
    description: '배운 내용·느낀 점·메모지를 3줄로 요약해요',
    buttonLabel: 'AI 하루 요약 만들기',
    getState: async () => {
      const day = await getDay(date);
      const enough = countNonSpace(day.learned || '') + countNonSpace(day.reflection || '') >= AI_MIN_CHARS;
      return {
        ai: day.ai,
        canRun: enough,
        disabledReason: enough ? '' : `${AI_MIN_CHARS}자 이상 기록하면 요약할 수 있어요`,
        isStale: Boolean(day.ai && day.ai.sourceHash !== dayHash(day))
      };
    },
    generate: async () => {
      if (flush) await flush();
      const day = await getDay(date);
      const data = await postJson('/api/summarize-day', {
        date,
        title: day.title || '',
        learned: day.learned || '',
        reflection: day.reflection || '',
        growthNotes: (day.growthNotes || []).map(n => ({ kind: n.kind, text: n.text }))
      });
      await updateDay(date, {
        ai: { summary: data.summary, keywords: data.keywords, generatedAt: new Date().toISOString(), sourceHash: dayHash(day) }
      });
    },
    renderResult: (ai) => h('div', {}, [
      bulletList(ai.summary || []),
      h('div', { className: 'ai-panel__keywords' }, (ai.keywords || []).map(k => h('span', { className: 'badge badge--ai' }, [`#${k}`])))
    ])
  });
}

// 분야 요약에 보낼 기록 목록을 만든다 (최신 30개를 골라 오래된 순으로)
async function buildFieldEntries(field) {
  const days = (await listDays()).filter(d => (d.fieldIds || []).includes(field.id));
  const picked = days.slice(-AI_FIELD_MAX_ENTRIES);
  const progressByDate = new Map();
  if (field.type === 'team') {
    for (const log of await listTeamLogsByField(field.id)) progressByDate.set(log.date, log.progress || '');
  }
  return picked.map(d => ({
    date: d.date,
    title: d.title || '',
    learned: (d.learned || '').slice(0, AI_ENTRY_LEARNED_CHARS),
    reflection: (d.reflection || '').slice(0, AI_ENTRY_REFLECTION_CHARS),
    notes: (d.growthNotes || []).slice(0, 10).map(n => n.text),
    teamProgress: field.type === 'team' ? (progressByDate.get(d.date) || '').slice(0, AI_ENTRY_PROGRESS_CHARS) : ''
  }));
}

// 분야 상세 화면 — AI 분야 요약 카드
export function renderFieldAiPanel(container, { field }) {
  let current = field;
  return createPanel(container, {
    title: 'AI 분야 요약',
    description: '이 분야가 붙은 기록을 모아 흐름·핵심·다음 주제로 정리해요',
    buttonLabel: 'AI 분야 요약 만들기',
    getState: async () => {
      const entries = await buildFieldEntries(current);
      return {
        ai: current.ai,
        canRun: entries.length > 0,
        disabledReason: entries.length > 0 ? '' : '이 분야가 붙은 기록이 있어야 요약할 수 있어요',
        isStale: Boolean(current.ai && current.ai.sourceHash !== hashText(JSON.stringify(entries)))
      };
    },
    generate: async () => {
      const entries = await buildFieldEntries(current);
      const t = current.team || {};
      const data = await postJson('/api/summarize-field', {
        fieldName: current.name,
        fieldType: current.type,
        team: current.type === 'team' ? { topic: t.topic || '', role: t.role || '', goal: t.goal || '', purpose: t.purpose || '' } : null,
        entries
      });
      current = await updateField(current.id, {
        ai: {
          overview: data.overview,
          keyPoints: data.keyPoints,
          nextTopics: data.nextTopics,
          generatedAt: new Date().toISOString(),
          sourceHash: hashText(JSON.stringify(entries)),
          entryCount: entries.length
        }
      });
    },
    renderResult: (ai) => h('div', {}, [
      h('h3', { className: 'ai-panel__sub' }, ['개요']),
      h('p', { className: 'ai-panel__overview' }, [ai.overview]),
      h('h3', { className: 'ai-panel__sub' }, ['핵심 포인트']),
      bulletList(ai.keyPoints || []),
      (ai.nextTopics || []).length ? h('h3', { className: 'ai-panel__sub' }, ['다음에 공부할 주제']) : null,
      (ai.nextTopics || []).length ? bulletList(ai.nextTopics) : null,
      h('p', { className: 'ai-panel__time' }, [`기록 ${ai.entryCount || 0}일 기준`])
    ])
  });
}
