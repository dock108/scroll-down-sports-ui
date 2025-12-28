interface RevealScoreButtonProps {
  onReveal: () => void;
}

const RevealScoreButton = ({ onReveal }: RevealScoreButtonProps) => {
  return (
    <div className="sticky bottom-0 z-20 flex flex-col items-center gap-3 bg-gradient-to-t from-white/95 via-white/85 to-transparent px-4 pb-6 pt-4 backdrop-blur">
      <button
        type="button"
        onClick={onReveal}
        aria-label="Reveal final score"
        className="min-h-[48px] rounded-full bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-md transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-200"
      >
        Reveal Final Score
      </button>
      <p className="text-xs uppercase tracking-[0.3em] text-gray-500 sm:text-sm">
        Scrolling won’t reveal the score — click when ready.
      </p>
    </div>
  );
};

export default RevealScoreButton;
