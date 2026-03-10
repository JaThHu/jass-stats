interface JassTafelProps {
  points: number;
  label: string;
}

function ZTally({ points }: { points: number }) {
  const hunderter = Math.floor(points / 100);
  const rest50 = points % 100;
  const fuenfziger = Math.floor(rest50 / 50);
  const rest20 = rest50 % 50;
  const zwanziger = Math.floor(rest20 / 20);
  const rest = rest20 % 20;

  // Z layout: top line = 100er, diagonal = 50er, bottom line = 20er
  // Each line is ~200px wide. Marks are short perpendicular strokes on the line.
  const w = 160;
  const h = 80;
  const pad = 8;
  const topY = pad + 4;
  const botY = h - pad - 4;
  const markLen = 10;

  function lineMarks(
    count: number,
    x1: number, y1: number,
    x2: number, y2: number,
    maxMarks: number
  ) {
    if (count === 0) return null;
    const marks = [];
    for (let i = 0; i < Math.min(count, maxMarks); i++) {
      const t = (i + 1) / (maxMarks + 1);
      const cx = x1 + (x2 - x1) * t;
      const cy = y1 + (y2 - y1) * t;
      // Perpendicular direction
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / len;
      const ny = dx / len;
      marks.push(
        <line
          key={i}
          x1={cx - nx * markLen / 2}
          y1={cy - ny * markLen / 2}
          x2={cx + nx * markLen / 2}
          y2={cy + ny * markLen / 2}
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      );
    }
    return marks;
  }

  return (
    <div className="flex items-center gap-2">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="text-gray-700">
        {/* Z shape */}
        {/* Top horizontal */}
        <line x1={pad} y1={topY} x2={w - pad} y2={topY}
          stroke="#d1d5db" strokeWidth={1.5} />
        {/* Diagonal */}
        <line x1={w - pad} y1={topY} x2={pad} y2={botY}
          stroke="#d1d5db" strokeWidth={1.5} />
        {/* Bottom horizontal */}
        <line x1={pad} y1={botY} x2={w - pad} y2={botY}
          stroke="#d1d5db" strokeWidth={1.5} />

        {/* 100er marks on top line */}
        {lineMarks(hunderter, pad, topY, w - pad, topY, 10)}
        {/* 50er marks on diagonal */}
        {lineMarks(fuenfziger, w - pad, topY, pad, botY, 1)}
        {/* 20er marks on bottom line */}
        {lineMarks(zwanziger, pad, botY, w - pad, botY, 5)}
      </svg>
      {rest > 0 && (
        <span className="text-lg font-semibold text-gray-600 min-w-[2ch]">
          {rest}
        </span>
      )}
    </div>
  );
}

export default function JassTafel({ points, label }: JassTafelProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
      <ZTally points={points} />
      <p className="text-sm font-bold text-gray-800">{points} Punkte</p>
    </div>
  );
}
