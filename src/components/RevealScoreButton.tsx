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
        className="btn-primary btn-primary--lg btn-primary--pill btn-shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-200"
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
