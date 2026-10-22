'use client'

export default function AmbientField() {
  return (
    <div className="ambient-field" aria-hidden="true">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="marginTrace" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8ba4ff" stopOpacity=".48" />
            <stop offset="55%" stopColor="#6e7dca" stopOpacity=".14" />
            <stop offset="100%" stopColor="#f08c72" stopOpacity=".35" />
          </linearGradient>
          <radialGradient id="marginGlow">
            <stop offset="0%" stopColor="#5576ee" stopOpacity=".19" />
            <stop offset="100%" stopColor="#5576ee" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle className="ambient-glow ambient-glow-a" cx="1180" cy="160" r="390" fill="url(#marginGlow)" />
        <circle className="ambient-glow ambient-glow-b" cx="190" cy="730" r="350" fill="url(#marginGlow)" />
        <g className="ambient-orbit" fill="none" stroke="url(#marginTrace)" strokeWidth="1">
          <ellipse cx="1080" cy="250" rx="450" ry="155" transform="rotate(-24 1080 250)" />
          <ellipse cx="1080" cy="250" rx="360" ry="120" transform="rotate(-24 1080 250)" />
          <ellipse cx="1080" cy="250" rx="270" ry="88" transform="rotate(-24 1080 250)" />
          <path d="M700 410 C830 160 1080 70 1390 110 S1570 390 1270 470 S820 580 760 370 S1110 60 1350 220" />
          <path d="M0 650 C230 560 350 720 510 670 S750 450 910 550 S1150 770 1440 610" />
        </g>
        <g className="ambient-nodes" fill="#9bb0ff">
          <circle cx="785" cy="367" r="2.5" />
          <circle cx="1265" cy="469" r="2.5" />
          <circle cx="910" cy="550" r="2" />
          <circle cx="510" cy="670" r="2" />
        </g>
      </svg>
    </div>
  )
}
