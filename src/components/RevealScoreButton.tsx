interface RevealScoreButtonProps {
  onReveal: () => void;
}

const RevealScoreButton = ({ onReveal }: RevealScoreButtonProps) => {
  return (
    <div className="sticky bottom-4 z-20 flex flex-col items-center gap-3 pb-4">
      <button
        type="button"
        onClick={onReveal}
        aria-label="Reveal final score"
        className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-200"
      >
        Reveal Final Score
      </button>
      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
        Scrolling won’t reveal the score — click when ready.
      </p>
    </div>
  );
};

export default RevealScoreButton;
