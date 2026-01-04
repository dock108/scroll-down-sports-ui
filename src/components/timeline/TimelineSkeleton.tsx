export const TimelineSkeleton = () => (
  <div className="timeline-skeleton">
    {Array.from({ length: 3 }, (_, index) => (
      <div key={`skeleton-${index}`} className="timeline-skeleton__section">
        <div className="timeline-skeleton__highlight">
          <div className="timeline-skeleton__media" aria-hidden="true" />
          <div className="timeline-skeleton__caption">
            <div className="timeline-skeleton__bar" />
            <div className="timeline-skeleton__bar timeline-skeleton__bar--short" />
          </div>
        </div>
        <div className="timeline-skeleton__event">
          <div className="timeline-skeleton__time" />
          <div className="timeline-skeleton__text">
            <div className="timeline-skeleton__line" />
            <div className="timeline-skeleton__line timeline-skeleton__line--short" />
          </div>
        </div>
      </div>
    ))}
  </div>
);
