'use client';

const CLAW_NAV_ITEMS = [
  { id: 'new', label: '新对话', icon: 'plus' as const },
  { id: 'agents', label: '智能体', icon: 'grid' as const },
  { id: 'skills', label: '技能', icon: 'compass' as const },
  { id: 'plugins', label: '插件', icon: 'puzzle' as const },
  { id: 'automation', label: '自动化', icon: 'clock' as const },
] as const;

export function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function IconCompass() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="m14.8 9.2-2.2 5.2-5.2 2.2 2.2-5.2 5.2-2.2Z" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function IconPuzzle() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <path
        d="M10 4h4v2.2a1.8 1.8 0 1 0 2.6 1.6V10h2.2a1.8 1.8 0 1 1 0 3.6H16.6V16a1.8 1.8 0 1 0-3.6 0v2H10v-2.2A1.8 1.8 0 1 0 7.4 14.2V10H5.2a1.8 1.8 0 1 1 0-3.6H7.4V4H10Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconClock() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v4.5l3 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="m16 16 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconPaperclip() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <path
        d="m15.5 7.5-6.2 6.2a2.2 2.2 0 0 0 3.1 3.1l7-7a3.8 3.8 0 0 0-5.4-5.4l-7.4 7.4a5.2 5.2 0 0 0 7.4 7.4l5.5-5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconMic() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <rect x="9" y="3.5" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconSend() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
      <path
        d="M12 19V5M12 5l-5.5 5.5M12 5l5.5 5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconMore() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
      <circle cx="6" cy="12" r="1.4" fill="currentColor" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      <circle cx="18" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function IconDocSparkle() {
  return (
    <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-hidden>
      <rect x="6" y="4" width="16" height="22" rx="3" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.4" />
      <path d="M11 11h8M11 15h8M11 19h5" stroke="#3b82f6" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="m22.5 20.5.8 1.8 1.9.4-1.5 1.3.5 1.9-1.7-1-1.7 1 .5-1.9-1.5-1.3 1.9-.4.8-1.8Z"
        fill="#60a5fa"
      />
    </svg>
  );
}

export type ClawNavIconName = (typeof CLAW_NAV_ITEMS)[number]['icon'];

export function NavIcon({ name }: { name: ClawNavIconName }) {
  switch (name) {
    case 'plus':
      return <IconPlus />;
    case 'grid':
      return <IconGrid />;
    case 'compass':
      return <IconCompass />;
    case 'puzzle':
      return <IconPuzzle />;
    case 'clock':
      return <IconClock />;
    default:
      return null;
  }
}

export function ClawLogoMark() {
  return (
    <span className="claw-logo-mark" aria-hidden>
      <svg viewBox="0 0 28 28" width="22" height="22">
        <circle cx="14" cy="14" r="14" fill="#e11d48" />
        <path
          d="M8.5 16.5c1.2 2.8 3.4 4.2 5.5 4.2s4.3-1.4 5.5-4.2c-1.6.7-3.5 1-5.5 1s-3.9-.3-5.5-1Z"
          fill="#fff"
          opacity="0.95"
        />
        <circle cx="10.2" cy="12.2" r="1.3" fill="#fff" />
        <circle cx="17.8" cy="12.2" r="1.3" fill="#fff" />
        <path
          d="M9.2 8.2c1.1-1.6 2.4-2.4 3.4-2.2M18.8 8.2c-1.1-1.6-2.4-2.4-3.4-2.2"
          stroke="#fff"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function LobsterHero() {
  return (
    <div className="claw-hero-avatar" aria-hidden>
      <svg viewBox="0 0 120 120" width="88" height="88">
        <defs>
          <radialGradient id="claw-lob-bg" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fff1f2" />
            <stop offset="100%" stopColor="#ffe4e6" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#claw-lob-bg)" />
        <ellipse cx="60" cy="68" rx="28" ry="32" fill="#e11d48" />
        <ellipse cx="60" cy="52" rx="22" ry="20" fill="#f43f5e" />
        <ellipse cx="48" cy="48" rx="7" ry="8" fill="#fff" />
        <ellipse cx="72" cy="48" rx="7" ry="8" fill="#fff" />
        <circle cx="49.5" cy="49" r="3.2" fill="#1f2937" />
        <circle cx="73.5" cy="49" r="3.2" fill="#1f2937" />
        <path d="M52 58c4 4 12 4 16 0" stroke="#9f1239" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d="M38 40c-8-10-14-8-16-4 6 2 10 8 12 14" fill="#e11d48" />
        <path d="M82 40c8-10 14-8 16-4-6 2-10 8-12 14" fill="#e11d48" />
        <rect x="42" y="42" width="14" height="4" rx="2" fill="#94a3b8" opacity="0.85" transform="rotate(-12 49 44)" />
        <rect x="64" y="42" width="14" height="4" rx="2" fill="#94a3b8" opacity="0.85" transform="rotate(12 71 44)" />
      </svg>
    </div>
  );
}
