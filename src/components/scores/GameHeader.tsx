interface GameHeaderProps {
  awayTeam: string;
  homeTeam: string;
  venue: string;
  dateLabel: string;
}

export const GameHeader = ({ awayTeam, homeTeam, venue, dateLabel }: GameHeaderProps) => {
  return (
    <header className="space-y-3">
      <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
        {awayTeam} at {homeTeam}
      </h1>
      <p className="text-sm text-gray-600">
        {dateLabel} — {venue}
      </p>
      <hr className="border-gray-100" />
    </header>
  );
};
