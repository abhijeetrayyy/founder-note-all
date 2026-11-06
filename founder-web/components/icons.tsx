/** The handful of icons the app uses, drawn in the Lucide style (24px grid, 2px stroke). */

type P = { className?: string; strokeWidth?: number };

function I({ className = "h-[18px] w-[18px]", strokeWidth = 2, children }: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const Check = (p: P) => <I {...p}><path d="M20 6 9 17l-5-5" /></I>;
export const Plus = (p: P) => <I {...p}><path d="M5 12h14" /><path d="M12 5v14" /></I>;
export const X = (p: P) => <I {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></I>;
export const Star = ({ filled, ...p }: P & { filled?: boolean }) => (
  <I {...p}>
    <polygon
      points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
      fill={filled ? "currentColor" : "none"}
    />
  </I>
);
export const Sun = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
  </I>
);
export const Back = (p: P) => <I {...p}><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></I>;
export const Moon = (p: P) => <I {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></I>;
export const Search = (p: P) => <I {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></I>;
export const Pin = (p: P) => (
  <I {...p}>
    <path d="M12 17v5" />
    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
  </I>
);
export const Trash = (p: P) => (
  <I {...p}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></I>
);
export const ChevronDown = (p: P) => <I {...p}><path d="m6 9 6 6 6-6" /></I>;
export const ChevronLeft = (p: P) => <I {...p}><path d="m15 18-6-6 6-6" /></I>;
export const ArrowRight = (p: P) => <I {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></I>;
export const Send = (p: P) => <I {...p}><path d="M7 7h10v10" /><path d="M7 17 17 7" /></I>;
export const Restore = (p: P) => <I {...p}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></I>;
export const ListIcon = (p: P) => (
  <I {...p}><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /></I>
);
export const NoteIcon = (p: P) => (
  <I {...p}>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" />
  </I>
);
export const Cloud = (p: P) => <I {...p}><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /></I>;
