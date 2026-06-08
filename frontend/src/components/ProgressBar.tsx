export function ProgressBar({ percent, label }: { percent: number; label?: string }) {
  return (
    <>
      <div className="progress-wrap">
        <div className="progress-bar" style={{ width: `${percent}%` }} />
      </div>
      {label && <div className="progress-label">{label}</div>}
    </>
  );
}
