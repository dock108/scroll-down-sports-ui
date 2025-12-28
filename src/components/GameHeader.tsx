interface GameHeaderProps {
  awayTeam: string;
  homeTeam: string;
  venue: string;
  dateLabel: string;
}

const GameHeader = ({ awayTeam, homeTeam, venue, dateLabel }: GameHeaderProps) => {
  return (
    <header className="space-y-3">
      <h1 className="text-3xl font-semibold text-gray-900">
        {awayTeam} at {homeTeam}
      </h1>
      <p className="text-sm text-gray-600">
        {dateLabel} — {venue}
      </p>
      <hr className="border-gray-100" />
    </header>
  );
};

export default GameHeader;
