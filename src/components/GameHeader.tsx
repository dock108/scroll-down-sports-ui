interface GameHeaderProps {
  awayTeam: string;
  homeTeam: string;
  venue: string;
  dateLabel: string;
}

const GameHeader = ({ awayTeam, homeTeam, venue, dateLabel }: GameHeaderProps) => {
  return (
    <header>
      <h2 className="mt-4 mb-2 text-xs uppercase tracking-[0.3em] text-gray-500 sm:mt-6 sm:text-sm">
        Game Replay
      </h2>
      <h1 className="mb-2 text-2xl font-semibold leading-tight sm:text-3xl">
        {awayTeam} at {homeTeam}
      </h1>
      <p className="text-sm text-gray-600 sm:text-base">
        {dateLabel} — {venue}
      </p>
      <hr className="my-6 border-gray-200" />
    </header>
  );
};

export default GameHeader;
