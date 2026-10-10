// The "Visual learning path" flowchart on the Roadmap tab.

const STAGES = [
  { x: 2, w: 98, fill: "#E1F5EE", stroke: "#0F6E56", title: "Beginner", titleFill: "#085041", sub: "Python + ML" },
  { x: 118, w: 98, fill: "#E6F1FB", stroke: "#185FA5", title: "Data skills", titleFill: "#0C447C", sub: "NumPy · Pandas" },
  { x: 234, w: 108, fill: "#EEEDFE", stroke: "#534AB7", title: "Deep Learning", titleFill: "#3C3489", sub: "CNNs · Transformers" },
  { x: 360, w: 90, fill: "#FAEEDA", stroke: "#854F0B", title: "Projects", titleFill: "#633806", sub: "Build + Deploy" },
  { x: 468, w: 100, fill: "#FAECE7", stroke: "#993C1D", title: "Advanced AI", titleFill: "#712B13", sub: "LLMs · Research" },
  { x: 586, w: 116, fill: "#EAF3DE", stroke: "#3B6D11", title: "AI Expert", titleFill: "#27500A", sub: "Contribute + Teach" },
];

export default function LearningPath() {
  return (
    <svg width="100%" viewBox="0 0 710 84" style={{ minWidth: 480 }} role="img" aria-labelledby="path-title">
      <title id="path-title">AI learning path from beginner to expert</title>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>
      {STAGES.map((s, i) => {
        const cx = s.x + s.w / 2;
        return (
          <g key={s.title} fontFamily="var(--font-inter), Inter, sans-serif">
            <rect x={s.x} y="16" width={s.w} height="52" rx="10" fill={s.fill} stroke={s.stroke} strokeWidth=".8" />
            <text x={cx} y="38" textAnchor="middle" fontSize="11" fontWeight="600" fill={s.titleFill}>
              {s.title}
            </text>
            <text x={cx} y="56" textAnchor="middle" fontSize="10" fill={s.stroke}>
              {s.sub}
            </text>
            {i < STAGES.length - 1 && (
              <line x1={s.x + s.w} y1="42" x2={s.x + s.w + 16} y2="42" stroke="#ccc" strokeWidth="1" markerEnd="url(#arrow)" />
            )}
          </g>
        );
      })}
    </svg>
  );
}
