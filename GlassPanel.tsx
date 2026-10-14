interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function GlassPanel({ children, className = "", onClick }: GlassPanelProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl ${className}`}
    >
      {children}
    </div>
  );
}

export function Panel({ children, className = "", onClick }: GlassPanelProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-slate-200 bg-white/80 backdrop-blur-xl shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}
