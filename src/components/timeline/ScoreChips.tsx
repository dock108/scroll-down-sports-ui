interface ScoreChipsProps {
  periodLabel: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
}

export const ScoreChips = ({
  periodLabel,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
}: ScoreChipsProps) => {
  if (homeScore === undefined || awayScore === undefined) {
    return null;
  }

  return (
    <div className="score-chip-divider" role="group" aria-label={`Score after ${periodLabel}`}>
      <span className="score-chip-divider__label">Score after {periodLabel}</span>
      <div className="score-chip-divider__chips">
        <span className="score-chip" aria-label={`${awayTeam} score ${awayScore}`}>
          {awayTeam} {awayScore}
        </span>
        <span className="score-chip" aria-label={`${homeTeam} score ${homeScore}`}>
          {homeTeam} {homeScore}
        </span>
      </div>
    </div>
  );
};
