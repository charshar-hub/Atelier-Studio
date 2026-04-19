export default function OnboardingIntro({ onDismiss }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] animate-fade-up overflow-hidden rounded-[14px] border border-whisper bg-paper shadow-[0_20px_60px_-20px_rgba(58,46,38,0.22)]">
      <div className="px-5 pb-5 pt-4">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[10px] tracking-[0.25em] text-accent">WELCOME</span>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss welcome"
            className="flex h-6 w-6 items-center justify-center rounded-full text-ink-muted transition hover:bg-whisper hover:text-ink"
          >
            <span className="text-base leading-none">×</span>
          </button>
        </div>
        <h3 className="mb-2 font-serif text-[20px] leading-[1.25] tracking-tight text-ink">
          Your first lesson is ready.
        </h3>
        <p className="mb-4 text-[13px] leading-[1.65] text-ink-soft">
          Edit any field directly, or use the AI Actions on the right to regenerate, rewrite in
          your tone, or improve content. Every change auto-saves.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="h-9 w-full rounded-md bg-ink text-[13px] tracking-wide text-canvas transition hover:bg-[#2A1F18]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
