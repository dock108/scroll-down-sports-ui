interface GameHeaderProps {
  awayTeam: string;
  homeTeam: string;
  venue: string;
  dateLabel: string;
}

const GameHeader = ({ awayTeam, homeTeam, venue, dateLabel }: GameHeaderProps) => {
  return (
    <header>
      <h2 className="mt-6 mb-2 text-sm tracking-wide text-gray-500 uppercase">Game Replay</h2>
      <h1 className="text-3xl font-semibold mb-2">
        {awayTeam} at {homeTeam}
      </h1>
      <p className="text-gray-600">
        {dateLabel} — {venue}
      </p>
      <hr className="my-6 border-gray-200" />
    </header>
  );
};

export default GameHeader;
