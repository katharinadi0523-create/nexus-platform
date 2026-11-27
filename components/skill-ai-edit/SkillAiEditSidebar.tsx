'use client';

import React, { useEffect, useRef, useState } from 'react';
import { LoaderCircle, MessageSquare, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ClawConversationTimeline } from '@/components/claw-hub-next/conversation-timeline';
import type { ConversationTimelineItem } from '@/components/claw-hub-next/detail/utils';
import {
  SKILL_AI_EDIT_NEED_PLACEHOLDER,
  buildSkillAiEditPrompt,
} from './skillAiEditLink';
import './skillAiEdit.css';
import {
  type AiEditDecideKind,
  type AiEditMessage,
  type AiEditRoundKind,
  type InvisibleSkillRecord,
  type SkillZipSnapshot,
  createNewSlotFromCreator,
  createPrevSlotFromOriginal,
  downloadSkillZip,
  formatAiEditTime,
  parseModifyNeed,
  toInvisibleRecord,
} from './skillAiEditModel';

type ExitIntent = 'overwrite' | 'save_as' | null;
type ComplexityMode = 'simple' | 'complex';

export type AiEditRoundPhase = 'idle' | 'sending';

type SkillAiEditSidebarProps = {
  open: boolean;
  skillName: string;
  onCloseComplete: () => void;
  /** 写回原始可见 Skill（不触发发布） */
  onOverwrite: (zip: SkillZipSnapshot) => void;
  onSaveAs: (zip: SkillZipSnapshot, newName: string) => void;
  /** overlay：右侧抽屉；inline：嵌入当前页 */
  variant?: 'overlay' | 'inline';
  placement?: 'left' | 'right';
  preferredSendMode?: AiEditRoundKind;
  defaultComplexity?: ComplexityMode;
  /** sending：用户已发出、助手未完成；idle：轮次之间 */
  onRoundPhaseChange?: (phase: AiEditRoundPhase) => void;
  /** 开始/结束对话、关闭右侧栏时落盘左侧文件编辑 */
  onRequestFileSave?: () => void;
  /** 从创建对话跳入时带入的会话时间线，避免右侧栏被重置成空白修改模板 */
  seedTimeline?: ConversationTimelineItem[];
  /** 详情页右侧竖条与面板内关闭按钮共用同一套收起逻辑 */
  onBindClose?: (close: () => void) => void;
};

function SlotCard({
  label,
  zip,
  disabled,
  selected,
  onSelect,
}: {
  label: string;
  zip: SkillZipSnapshot | null;
  disabled?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  if (!zip || disabled) {
    return (
      <div className="sdp-ai-slot sdp-ai-slot--empty">
        <div className="sdp-ai-slot__label">{label}</div>
        <div className="sdp-ai-slot__empty-text">空 / 不可用</div>
        <div className="sdp-ai-slot__hint">等待下一轮修改填入</div>
      </div>
    );
  }

  const body = (
    <>
      <div className="sdp-ai-slot__label">{label}</div>
      <div className="sdp-ai-slot__name">{zip.catalogName}</div>
      <div className="sdp-ai-slot__meta">
        v{zip.version} · {zip.sizeLabel} · visible=false
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        className={`sdp-ai-slot${selected ? ' is-selected' : ''}`}
        onClick={onSelect}
      >
        {body}
      </button>
    );
  }

  return <div className="sdp-ai-slot">{body}</div>;
}

function SimpleFinalBlock({
  saved,
  savedAs,
  onSave,
  onSaveAs,
}: {
  saved: boolean;
  savedAs: boolean;
  onSave: () => void;
  onSaveAs: () => void;
}) {
  return (
    <div className="sdp-ai-decide sdp-ai-decide--simple">
      <button
        type="button"
        className={`sdp-ai-round__btn sdp-ai-round__btn--primary sdp-ai-round__btn--block${saved ? ' is-done' : ''}`}
        disabled={saved}
        onClick={onSave}
      >
        {saved ? '已保存为最终版' : '改好了，保存为最终版'}
      </button>
      <button
        type="button"
        className={`sdp-ai-round__btn sdp-ai-round__btn--ai sdp-ai-round__btn--block${savedAs ? ' is-done' : ''}`}
        disabled={savedAs}
        onClick={onSaveAs}
      >
        {savedAs ? '已另存 Skill' : '另存 Skill'}
      </button>
    </div>
  );
}

function DecideBlock({
  decided,
  decidedKind,
  canDecide,
  onKeepNew,
  onKeepPrev,
}: {
  decided: boolean;
  decidedKind: AiEditDecideKind | null;
  canDecide: boolean;
  onKeepNew: () => void;
  onKeepPrev: () => void;
}) {
  if (!canDecide && !decided) return null;

  return (
    <div className="sdp-ai-decide">
      <div className="sdp-ai-decide__title">定版（一次性，不可撤销）</div>
      <div className="sdp-ai-decide__actions">
        {decided && decidedKind === 'keep_prev' ? null : (
          <button
            type="button"
            className={`sdp-ai-round__btn sdp-ai-round__btn--primary${decided && decidedKind === 'keep_new' ? ' is-done' : ''}`}
            disabled={decided}
            onClick={onKeepNew}
          >
            {decided && decidedKind === 'keep_new' ? '已保存新版本' : '保存新版本'}
          </button>
        )}
        {decided && decidedKind === 'keep_new' ? null : (
          <button
            type="button"
            className={`sdp-ai-round__btn${decided && decidedKind === 'keep_prev' ? ' is-done' : ''}`}
            disabled={decided}
            onClick={onKeepPrev}
          >
            {decided && decidedKind === 'keep_prev' ? '已返回上一版本' : '返回上一版本'}
          </button>
        )}
      </div>
      <p className="sdp-ai-round__hint">
        保存新版本：新版覆盖进上一版槽，新版槽清空。返回上一版本：上一版不变，新版槽清空。
      </p>
    </div>
  );
}

function ExitModal({
  skillName,
  intent,
  prevZip,
  newZip,
  pick,
  onPick,
  onConfirm,
  onCancel,
}: {
  skillName: string;
  intent: 'overwrite' | 'save_as';
  prevZip: SkillZipSnapshot | null;
  newZip: SkillZipSnapshot | null;
  pick: 'prev' | 'new' | null;
  onPick: (p: 'prev' | 'new') => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const needPick = Boolean(prevZip && newZip);
  const title =
    intent === 'overwrite' ? '覆盖原始版本并退出' : '另存 Skill 并退出';
  const canConfirm = needPick ? pick != null : Boolean(prevZip || newZip);

  return (
    <div className="sdp-ai-modal" role="dialog" aria-modal="true" aria-labelledby="sdp-ai-exit-title">
      <button type="button" className="sdp-ai-modal__backdrop" aria-label="取消" onClick={onCancel} />
      <div className="sdp-ai-modal__panel">
        <h3 id="sdp-ai-exit-title" className="sdp-ai-modal__title">
          {title}
        </h3>
        <p className="sdp-ai-modal__desc">
          {intent === 'overwrite'
            ? `将所选版本写回「${skillName}」。不会自动更新发布版本，需在页面手动点击发布。`
            : `将所选版本另存为新 Skill（原型 toast 演示）。不会影响当前发布版本。`}
        </p>
        {needPick ? (
          <div className="sdp-ai-exit-pick">
            <div className="sdp-ai-exit-pick__label">请选择要使用的版本</div>
            <div className="sdp-ai-slots">
              <SlotCard
                label="上一版本"
                zip={prevZip}
                selected={pick === 'prev'}
                onSelect={() => onPick('prev')}
              />
              <SlotCard
                label="新版本"
                zip={newZip}
                selected={pick === 'new'}
                onSelect={() => onPick('new')}
              />
            </div>
          </div>
        ) : (
          <div className="sdp-ai-exit-pick">
            <div className="sdp-ai-exit-pick__label">将使用</div>
            <SlotCard
              label={prevZip ? '上一版本' : '新版本'}
              zip={prevZip ?? newZip}
            />
          </div>
        )}
        <div className="sdp-ai-modal__actions">
          <button
            type="button"
            className="sdp-btn sdp-btn--primary"
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            确认并退出
          </button>
          <button type="button" className="sdp-btn" onClick={onCancel}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

function CloseChooser({
  simple,
  onOverwrite,
  onDiscard,
  onCancel,
}: {
  simple?: boolean;
  onOverwrite: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="sdp-ai-modal" role="dialog" aria-modal="true" aria-labelledby="sdp-ai-close-title">
      <button type="button" className="sdp-ai-modal__backdrop" aria-label="取消" onClick={onCancel} />
      <div className="sdp-ai-modal__panel">
        <h3 id="sdp-ai-close-title" className="sdp-ai-modal__title">
          退出 AI 编辑？
        </h3>
        <p className="sdp-ai-modal__desc">
          {simple
            ? '当前修改尚未写回前台可见 Skill。请选择如何处理。'
            : '会话内两个版本均为 invisible，尚未影响前台可见 Skill。请选择如何处理。'}
        </p>
        <div className="sdp-ai-modal__actions">
          <button type="button" className="sdp-btn sdp-btn--primary" onClick={onOverwrite}>
            {simple ? '覆盖原始技能并退出' : '覆盖原始版本并退出'}
          </button>
          <button type="button" className="sdp-btn" onClick={onDiscard}>
            不保存直接退出
          </button>
        </div>
        <button type="button" className="sdp-ai-modal__cancel" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  );
}

export default function SkillAiEditSidebar({
  open,
  skillName,
  onCloseComplete,
  onOverwrite,
  onSaveAs,
  variant = 'overlay',
  placement = 'right',
  preferredSendMode,
  defaultComplexity,
  onRoundPhaseChange,
  onRequestFileSave,
  seedTimeline,
  onBindClose,
}: SkillAiEditSidebarProps) {
  const isInline = variant === 'inline';
  const [messages, setMessages] = useState<AiEditMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sendMode, setSendMode] = useState<AiEditRoundKind>(preferredSendMode ?? 'modify');
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  /** 顶部设置：简易无版本；复杂为当前双槽定版 */
  const [complexity, setComplexity] = useState<ComplexityMode>(
    defaultComplexity ?? (isInline ? 'simple' : 'complex'),
  );
  const preferredSendModeRef = useRef(preferredSendMode);
  preferredSendModeRef.current = preferredSendMode;

  /** 上一版本槽：打开时拷贝原始；保存新版本后被新版覆盖 */
  const [prevZip, setPrevZip] = useState<SkillZipSnapshot | null>(null);
  /** 新版本槽：修改轮填入；定版后清空 */
  const [newZip, setNewZip] = useState<SkillZipSnapshot | null>(null);
  /** 新版本槽是否禁用（定版清空后） */
  const [newSlotDisabled, setNewSlotDisabled] = useState(true);
  /** 隐式技能目录（原型展示） */
  const [catalog, setCatalog] = useState<InvisibleSkillRecord[]>([]);

  const [testTarget, setTestTarget] = useState<'prev' | 'new'>('new');
  const [decided, setDecided] = useState(false);
  const [decidedKind, setDecidedKind] = useState<AiEditDecideKind | null>(null);
  const [simpleSaved, setSimpleSaved] = useState(false);
  const [simpleSavedAs, setSimpleSavedAs] = useState(false);

  const [closeChooserOpen, setCloseChooserOpen] = useState(false);
  const [exitIntent, setExitIntent] = useState<ExitIntent>(null);
  const [exitPick, setExitPick] = useState<'prev' | 'new' | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const threadRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<number | null>(null);
  const roundTimerRef = useRef<number | null>(null);
  const onRoundPhaseChangeRef = useRef(onRoundPhaseChange);
  onRoundPhaseChangeRef.current = onRoundPhaseChange;
  const [generating, setGenerating] = useState(false);
  const isSimple = complexity === 'simple';
  const sendModeLabel = sendMode === 'modify' ? '修改' : isSimple ? '调试' : '测试';

  const clearRoundTimer = () => {
    if (roundTimerRef.current != null) {
      window.clearTimeout(roundTimerRef.current);
      roundTimerRef.current = null;
    }
  };

  const showToast = (text: string) => {
    setToast(text);
    if (toastTimerRef.current != null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2000);
  };

  const syncCatalog = (prev: SkillZipSnapshot | null, next: SkillZipSnapshot | null) => {
    const rows: InvisibleSkillRecord[] = [];
    if (prev) rows.push(toInvisibleRecord(prev));
    if (next) rows.push(toInvisibleRecord(next));
    setCatalog(rows);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current != null) window.clearTimeout(toastTimerRef.current);
      if (roundTimerRef.current != null) window.clearTimeout(roundTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!modeMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!modeMenuRef.current?.contains(e.target as Node)) setModeMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [modeMenuOpen]);

  const sessionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCloseChooserOpen(false);
      setExitIntent(null);
      setModeMenuOpen(false);
      return;
    }

    const sessionKey = `${skillName}::${seedTimeline?.length ?? 0}`;
    if (sessionKeyRef.current === sessionKey) return;
    sessionKeyRef.current = sessionKey;

    const prev = createPrevSlotFromOriginal(skillName);
    setPrevZip(prev);
    setNewZip(null);
    setNewSlotDisabled(true);
    syncCatalog(prev, null);
    setMessages([]);
    setSendMode(preferredSendModeRef.current ?? 'modify');
    setTestTarget('prev');
    setDecided(false);
    setDecidedKind(null);
    setSimpleSaved(false);
    setSimpleSavedAs(false);
    setExitPick(null);
    const fromCreate = Boolean(seedTimeline && seedTimeline.length > 0);
    setDraft(fromCreate ? '' : buildSkillAiEditPrompt(skillName));
    setGenerating(false);
    clearRoundTimer();
    onRoundPhaseChangeRef.current?.('idle');

    const t = window.setTimeout(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      if (fromCreate) {
        ta.setSelectionRange(0, 0);
        return;
      }
      const token = SKILL_AI_EDIT_NEED_PLACEHOLDER;
      const start = ta.value.indexOf(token);
      if (start >= 0) ta.setSelectionRange(start, start + token.length);
      else ta.setSelectionRange(ta.value.length, ta.value.length);
    }, 40);

    return () => window.clearTimeout(t);
  }, [open, skillName, seedTimeline]);

  useEffect(() => {
    if (!open || !preferredSendMode) return;
    setSendMode(preferredSendMode);
  }, [open, preferredSendMode]);

  useEffect(() => {
    if (!open) return;
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    // 确保最新一轮功能区滚入可视区
    requestAnimationFrame(() => {
      el.querySelector('.sdp-ai-round')?.scrollIntoView({ block: 'nearest' });
    });
  }, [messages, open, catalog, newZip, prevZip, decided, generating]);

  const closeImplRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    onBindClose?.(() => closeImplRef.current?.());
  }, [onBindClose]);

  if (!open) return null;

  const finishClose = () => {
    setCloseChooserOpen(false);
    setExitIntent(null);
    onCloseComplete();
  };

  const resolveExitZip = (): SkillZipSnapshot | null => {
    if (prevZip && newZip) {
      if (exitPick === 'prev') return prevZip;
      if (exitPick === 'new') return newZip;
      return null;
    }
    return newZip ?? prevZip;
  };

  const appendAssistantModify = (userText: string) => {
    if (!prevZip) return;
    const needDisplay = parseModifyNeed(userText, SKILL_AI_EDIT_NEED_PLACEHOLDER);
    const created = createNewSlotFromCreator(skillName, prevZip, needDisplay);
    setNewZip(created);
    setNewSlotDisabled(false);
    setDecided(false);
    setDecidedKind(null);
    setSimpleSaved(false);
    setSimpleSavedAs(false);
    setTestTarget('new');
    syncCatalog(prevZip, created);

    const aid = `a-${Date.now()}`;
    const simpleContent = `已按需求改好当前技能（直接写回了前台）。

需求理解
${needDisplay}

可继续改，或切到调试验证。修改会在发送、工具调用完成或关闭对话时自动保存。`;
    const complexContent = `已调用 **Skill Creator**，生成新版本 Skill（技能管理主目录，\`visible=false\`）。

同时保留上一版本拷贝（原始 Skill 副本，\`visible=false\`）。

**需求理解**
${needDisplay}

**目录（前台不可见）**
- 上一版本：\`${prevZip.catalogName}\` v${prevZip.version}
- 新版本：\`${created.catalogName}\` v${created.version}

两版本均不影响现有可见 Skill。可切到测试模式选版验证，或直接定版。`;

    setMessages((prev) => [
      ...prev,
      {
        id: aid,
        role: 'assistant',
        time: formatAiEditTime(),
        roundKind: 'modify',
        zip: created,
        showDecide: !isSimple,
        content: isSimple ? simpleContent : complexContent,
      },
    ]);
  };

  const resolveTestTarget = () => (isSimple ? (newZip ?? prevZip) : testTarget === 'new' ? newZip : prevZip);

  const appendAssistantTest = () => {
    const targetZip = resolveTestTarget();
    if (!targetZip) return;

    const aid = `a-${Date.now()}`;
    const simpleContent = `调试轮次（不变更 skill）

已对当前技能包做原型自检：
1. 包结构齐全
2. 权限声明正常
3. Mock 调用通过

调试不写回前台。可继续修改。修改会在发送、工具调用完成或关闭对话时自动保存。`;
    const complexContent = `**测试轮次**（不调用 Skill Creator，不变更 skill）

测试目标：${testTarget === 'new' ? '新版本' : '上一版本'}
- \`${targetZip.catalogName}\` v${targetZip.version}（visible=false）

原型自检：
1. 包结构齐全
2. 权限声明正常
3. Mock 调用通过

测试不写回前台可见 Skill。可继续定版，或再切修改轮产出新版。`;

    setMessages((prev) => [
      ...prev,
      {
        id: aid,
        role: 'assistant',
        time: formatAiEditTime(),
        roundKind: 'test',
        zip: targetZip,
        showDecide: !isSimple && Boolean(prevZip && newZip && !decided),
        content: isSimple ? simpleContent : complexContent,
      },
    ]);
  };

  const handleKeepNew = () => {
    if (!newZip || !prevZip || decided) return;
    // 新版覆盖进上一版槽；新版槽清空/disable
    const promoted: SkillZipSnapshot = {
      ...newZip,
      slot: 'prev',
      catalogName: `${skillName}.ai-prev`,
      fileName: `${skillName}.ai-prev.zip`,
      needNote: `由新版本 v${newZip.version} 晋升为上一版本`,
    };
    setPrevZip(promoted);
    setNewZip(null);
    setNewSlotDisabled(true);
    setDecided(true);
    setDecidedKind('keep_new');
    setTestTarget('prev');
    syncCatalog(promoted, null);
    showToast('已保存新版本 → 晋升为上一版本；新版槽已清空');
  };

  const handleSaveFinal = () => {
    const zip = newZip ?? prevZip;
    if (!zip || simpleSaved) return;
    onOverwrite(zip);
    setSimpleSaved(true);
    showToast('已保存为最终版。发布版本未自动更新');
  };

  const persistSession = () => {
    onRequestFileSave?.();
    if (!messages.some((msg) => msg.role === 'user')) return;
    const zip = newZip ?? prevZip;
    if (zip) {
      onOverwrite(zip);
      setSimpleSaved(true);
    }
  };

  const handleClose = () => {
    if (isInline) {
      persistSession();
      finishClose();
      return;
    }
    setCloseChooserOpen(true);
  };
  closeImplRef.current = handleClose;

  const handleSaveAsCopy = () => {
    const zip = newZip ?? prevZip;
    if (!zip || simpleSavedAs) return;
    onSaveAs(zip, `${skillName}-edited`);
    setSimpleSavedAs(true);
    showToast('已另存为新 Skill。发布版本未自动更新');
  };

  const handleKeepPrev = () => {
    if (!prevZip || decided) return;
    // 上一版不变；新版槽清空
    setNewZip(null);
    setNewSlotDisabled(true);
    setDecided(true);
    setDecidedKind('keep_prev');
    setTestTarget('prev');
    syncCatalog(prevZip, null);
    showToast('已返回上一版本；新版槽已清空');
  };

  const handleSend = () => {
    const text = draft.trim();
    if (!text || generating) return;
    if (sendMode === 'test' && !resolveTestTarget()) {
      showToast(
        isSimple
          ? '当前没有可调试的技能包'
          : testTarget === 'new'
            ? '新版本槽为空，请先修改或改测上一版本'
            : '上一版本不可用',
      );
      return;
    }
    if (sendMode === 'modify' && !prevZip) return;
    setDraft('');
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content: text, time: formatAiEditTime() },
    ]);
    setGenerating(true);
    onRoundPhaseChangeRef.current?.('sending');
    clearRoundTimer();
    roundTimerRef.current = window.setTimeout(() => {
      roundTimerRef.current = null;
      if (sendMode === 'test') appendAssistantTest();
      else appendAssistantModify(text);
      setGenerating(false);
      onRoundPhaseChangeRef.current?.('idle');
    }, 4000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canDecide = Boolean(prevZip && newZip && !decided);
  const latestActionMsgId = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant' && m.zip)?.id;

  const drawerClass = [
    'sdp-ai-drawer',
    isInline ? 'sdp-ai-drawer--inline sdp-ai-drawer--workbench' : '',
    placement === 'left' ? 'sdp-ai-drawer--left' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {isInline ? null : (
        <button type="button" className="sdp-ai-overlay" aria-label="关闭 AI 编辑" onClick={handleClose} />
      )}
      <aside className={drawerClass} aria-label="AI 编辑 Claw" data-unsaved-safe>
        <header className={isInline ? 'sdp-ai-drawer__head sdp-ai-drawer__head--workbench' : 'sdp-ai-drawer__head'}>
          {isInline ? (
            <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800">
              <MessageSquare className="h-4 w-4 shrink-0 text-[#2773ff]" />
              <span className="truncate">对话</span>
            </div>
          ) : (
          <div className="sdp-ai-drawer__brand">
            <span className="sdp-ai-drawer__claw" aria-hidden>
              ✦
            </span>
            <div>
              <div className="sdp-ai-drawer__title">Claw · AI 编辑</div>
              <div className="sdp-ai-drawer__sub">{skillName}</div>
            </div>
          </div>
          )}
          <div className="sdp-ai-drawer__head-actions">
            {isInline ? null : (
              <div className="sdp-ai-complexity" role="group" aria-label="设置编辑模式">
                <button
                  type="button"
                  className={`sdp-ai-complexity__btn${isSimple ? ' is-active' : ''}`}
                  aria-pressed={isSimple}
                  onClick={() => {
                    setComplexity('simple');
                    setModeMenuOpen(false);
                  }}
                >
                  简易
                </button>
                <button
                  type="button"
                  className={`sdp-ai-complexity__btn${isSimple ? '' : ' is-active'}`}
                  aria-pressed={!isSimple}
                  onClick={() => {
                    setComplexity('complex');
                    setModeMenuOpen(false);
                  }}
                >
                  复杂
                </button>
              </div>
            )}
            {isInline ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                data-unsaved-safe
                onClick={handleClose}
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : (
            <button
              type="button"
              className="sdp-ai-drawer__close"
              onClick={handleClose}
              aria-label="关闭"
            >
              ×
            </button>
            )}
          </div>
        </header>

        {!isSimple ? (
          <div className="sdp-ai-slots-bar" aria-label="会话版本槽">
            <SlotCard label="上一版本" zip={prevZip} />
            <SlotCard label="新版本" zip={newZip} disabled={newSlotDisabled && !newZip} />
          </div>
        ) : null}

        {!isSimple && catalog.length > 0 ? (
          <div className="sdp-ai-catalog" aria-label="隐式技能目录">
            <span className="sdp-ai-catalog__title">技能管理主目录（visible=false）</span>
            {catalog.map((r) => (
              <span key={r.id} className="sdp-ai-catalog__chip">
                {r.name} · {r.slot}
              </span>
            ))}
          </div>
        ) : null}

        <div
          className={isInline ? 'h-0 min-h-0 flex-1 overflow-y-auto overscroll-contain' : 'sdp-ai-drawer__thread'}
          ref={threadRef}
        >
          <div className={isInline ? 'space-y-4 p-4' : undefined}>
          {seedTimeline && seedTimeline.length > 0 ? (
            <ClawConversationTimeline items={seedTimeline} />
          ) : null}
          {messages.length === 0 && !(seedTimeline && seedTimeline.length > 0) ? (
            isInline ? null : (
            <div className="sdp-ai-drawer__empty">
              {isSimple ? (
                <>
                  <p>描述需求即可改当前技能。底部可切换修改 / 调试。</p>
                  <p className="sdp-ai-drawer__empty-hint">
                    没有版本槽，也不能回滚。改好后在卡片上保存为最终版，过程不影响已发布 Skill。
                  </p>
                </>
              ) : (
                <>
                  <p>已拷贝原始 Skill 到「上一版本」槽（invisible）。默认修改模式。</p>
                  <p className="sdp-ai-drawer__empty-hint">
                    发送需求后 Skill Creator 会写入「新版本」槽。过程不影响前台可见 Skill，也不会自动发布。
                  </p>
                </>
              )}
            </div>
            )
          ) : (
            messages.map((msg) => {
              const isLatestAction = msg.id === latestActionMsgId;
              const zipBlock = msg.role === 'assistant' && msg.zip && isLatestAction ? (
                    <div className={`sdp-ai-round${isSimple ? ' sdp-ai-round--simple' : ''}`}>
                      <div className="sdp-ai-round__zip">
                        <div className="sdp-ai-round__zip-icon" aria-hidden>
                          ⌗
                        </div>
                        <div className="sdp-ai-round__zip-meta">
                          <div className="sdp-ai-round__zip-name">
                            {isSimple ? `${skillName}.zip` : msg.zip.fileName}
                          </div>
                          <div className="sdp-ai-round__zip-sub">
                            {isSimple
                              ? msg.zip.sizeLabel
                              : `${msg.zip.slot === 'new' ? '新版本' : '上一版本'} · v${msg.zip.version} · ${msg.zip.sizeLabel}`}
                          </div>
                        </div>
                        {isSimple ? null : (
                          <button
                            type="button"
                            className="sdp-ai-round__btn"
                            onClick={() => downloadSkillZip(msg.zip!)}
                          >
                            下载
                          </button>
                        )}
                      </div>
                      {isSimple ? (
                        isInline ? null : (
                        <SimpleFinalBlock
                          saved={simpleSaved}
                          savedAs={simpleSavedAs}
                          onSave={handleSaveFinal}
                          onSaveAs={handleSaveAsCopy}
                        />
                        )
                      ) : canDecide || decided ? (
                        <DecideBlock
                          decided={decided}
                          decidedKind={decidedKind}
                          canDecide={canDecide}
                          onKeepNew={handleKeepNew}
                          onKeepPrev={handleKeepPrev}
                        />
                      ) : null}
                    </div>
              ) : null;
              if (isInline) {
                if (msg.role === 'user') {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[92%] rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                        <p className="whitespace-pre-wrap text-[13px] leading-6 text-slate-700">{msg.content}</p>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={msg.id} className="px-0.5">
                    {msg.roundKind ? (
                      <div className="mb-1.5">
                        <span className={`sdp-ai-msg__kind sdp-ai-msg__kind--${msg.roundKind}`}>
                          {msg.roundKind === 'modify' ? '修改' : isSimple ? '调试' : '测试'}
                        </span>
                      </div>
                    ) : null}
                    <p className="whitespace-pre-line text-sm leading-6 text-slate-800">{msg.content}</p>
                    {zipBlock}
                  </div>
                );
              }
              return (
              <div key={msg.id} className={`sdp-ai-msg sdp-ai-msg--${msg.role}`}>
                <div className={`sdp-ai-msg__avatar sdp-ai-msg__avatar--${msg.role}`} aria-hidden>
                  {msg.role === 'user' ? '郁' : 'C'}
                </div>
                <div className="sdp-ai-msg__body">
                  <div className="sdp-ai-msg__meta">
                    <span>{msg.role === 'user' ? '你' : 'Claw'}</span>
                    <span>{msg.time}</span>
                    {msg.roundKind ? (
                      <span className={`sdp-ai-msg__kind sdp-ai-msg__kind--${msg.roundKind}`}>
                        {msg.roundKind === 'modify' ? '修改' : isSimple ? '调试' : '测试'}
                      </span>
                    ) : null}
                  </div>
                  <div className="sdp-ai-msg__content">{msg.content}</div>
                  {zipBlock}
                </div>
              </div>
              );
            })
          )}
          {generating ? (
            isInline ? (
              <div className="flex max-w-[92%] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-500">
                <LoaderCircle className="h-4 w-4 animate-spin text-[#2773ff]" />
                Claw 正在处理…
              </div>
            ) : (
            <div className="sdp-ai-msg sdp-ai-msg--assistant">
              <div className="sdp-ai-msg__avatar sdp-ai-msg__avatar--assistant" aria-hidden>
                C
              </div>
              <div className="sdp-ai-msg__body">
                <div className="sdp-ai-msg__meta">
                  <span>Claw</span>
                </div>
                <div className="sdp-ai-msg__content sdp-ai-msg__content--pending">Claw 正在处理…</div>
              </div>
            </div>
            )
          ) : null}
          </div>
        </div>

        <div className={isInline ? 'shrink-0 border-t border-slate-200 bg-white p-3' : 'sdp-ai-drawer__composer'}>
          <div
            className={
              isInline
                ? 'sdp-ai-composer-inline rounded-lg border border-slate-200 bg-white focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100'
                : undefined
            }
          >
          {!isSimple && sendMode === 'test' ? (
            <div className="sdp-ai-test-pick" role="group" aria-label="测试目标">
              <span className="sdp-ai-test-pick__label">测试目标</span>
              <button
                type="button"
                className={`sdp-ai-test-pick__btn${testTarget === 'prev' ? ' is-active' : ''}`}
                disabled={!prevZip}
                onClick={() => setTestTarget('prev')}
              >
                上一版本
              </button>
              <button
                type="button"
                className={`sdp-ai-test-pick__btn${testTarget === 'new' ? ' is-active' : ''}`}
                disabled={!newZip || newSlotDisabled}
                onClick={() => setTestTarget('new')}
              >
                新版本
              </button>
            </div>
          ) : null}
          <Textarea
            ref={textareaRef}
            className={
              isInline
                ? 'min-h-24 w-full resize-none border-0 bg-transparent px-3 pt-3 text-sm leading-6 shadow-none focus-visible:ring-0'
                : 'sdp-ai-drawer__textarea min-h-0 resize-none border-0 p-0 shadow-none focus-visible:ring-0'
            }
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={generating}
            rows={3}
            placeholder={
              sendMode === 'test'
                ? isSimple
                  ? '描述调试要点后发送（不变更 skill）'
                  : '描述测试要点后发送（不变更 skill）'
                : seedTimeline && seedTimeline.length > 0
                  ? '补充创建 / 修改要求，例如：再加一条缺 type 列的异常用例…'
                : isSimple
                  ? '描述修改需求后发送'
                  : '描述修改需求后发送（Skill Creator）'
            }
          />
          <div className={isInline ? 'flex items-center justify-end gap-2 px-3 pb-3' : 'sdp-ai-drawer__composer-bar'}>
            {isInline ? null : (
            <div className="sdp-ai-mode" ref={modeMenuRef}>
              <button
                type="button"
                className={cn('sdp-ai-mode__trigger', isInline && 'sdp-ai-mode__trigger--workbench')}
                aria-haspopup="listbox"
                aria-expanded={modeMenuOpen}
                disabled={generating}
                onClick={() => {
                  if (generating) return;
                  setModeMenuOpen((v) => !v);
                }}
              >
                <span className={`sdp-ai-mode__dot sdp-ai-mode__dot--${sendMode}`} aria-hidden />
                {sendModeLabel}
                <span className="sdp-ai-mode__caret" aria-hidden>
                  ▾
                </span>
              </button>
              {modeMenuOpen ? (
                <ul className="sdp-ai-mode__menu" role="listbox" aria-label="模式">
                  <li role="option" aria-selected={sendMode === 'modify'}>
                    <button
                      type="button"
                      className={`sdp-ai-mode__option${sendMode === 'modify' ? ' is-active' : ''}`}
                      onClick={() => {
                        setSendMode('modify');
                        setModeMenuOpen(false);
                      }}
                    >
                      <span className="sdp-ai-mode__option-title">修改</span>
                      <span className="sdp-ai-mode__option-desc">
                        {isSimple ? '按需求改当前技能' : 'Skill Creator 写入新版本槽'}
                      </span>
                    </button>
                  </li>
                  <li role="option" aria-selected={sendMode === 'test'}>
                    <button
                      type="button"
                      className={`sdp-ai-mode__option${sendMode === 'test' ? ' is-active' : ''}`}
                      onClick={() => {
                        setSendMode('test');
                        setModeMenuOpen(false);
                        if (!newZip) setTestTarget('prev');
                      }}
                    >
                      <span className="sdp-ai-mode__option-title">{isSimple ? '调试' : '测试'}</span>
                      <span className="sdp-ai-mode__option-desc">
                        {isSimple ? '验证当前技能，不改包' : '选择上一版/新版验证，不改包'}
                      </span>
                    </button>
                  </li>
                </ul>
              ) : null}
            </div>
            )}
            {isInline ? (
              <Button
                type="button"
                size="sm"
                className="h-8 bg-[#2773ff] hover:bg-[#1f66f0]"
                disabled={!draft.trim() || generating}
                onClick={handleSend}
              >
                <Send className="h-3.5 w-3.5" />
                发送
              </Button>
            ) : (
            <button
              type="button"
              className="sdp-btn sdp-btn--primary"
              disabled={!draft.trim() || generating}
              onClick={handleSend}
            >
              发送
            </button>
            )}
          </div>
          </div>
        </div>

        {toast ? <div className="sdp-ai-toast">{toast}</div> : null}
      </aside>

      {closeChooserOpen && !exitIntent && !isInline ? (
        <CloseChooser
          simple={isSimple}
          onCancel={() => setCloseChooserOpen(false)}
          onDiscard={() => finishClose()}
          onOverwrite={() => {
            if (isSimple) {
              const zip = newZip ?? prevZip;
              if (zip) onOverwrite(zip);
              finishClose();
              return;
            }
            setExitPick(prevZip && newZip ? null : prevZip ? 'prev' : 'new');
            setExitIntent('overwrite');
          }}
        />
      ) : null}

      {exitIntent ? (
        <ExitModal
          skillName={skillName}
          intent={exitIntent}
          prevZip={prevZip}
          newZip={newZip}
          pick={exitPick}
          onPick={setExitPick}
          onCancel={() => {
            setExitIntent(null);
            setExitPick(null);
          }}
          onConfirm={() => {
            const zip = resolveExitZip();
            if (!zip) return;
            if (exitIntent === 'overwrite') {
              onOverwrite(zip);
            } else {
              onSaveAs(zip, `${skillName}-edited`);
            }
            finishClose();
          }}
        />
      ) : null}
    </>
  );
}
