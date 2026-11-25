// Topographic contour lines (a nod to Mt Bogong) used behind the forest-green sign panels.
export default function Contours() {
  return (
    <svg className="contours" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g fill="none" stroke="#3d6b55" strokeWidth="1.6">
        <path d="M-20 300 C120 240 220 280 340 200 S580 140 820 180" />
        <path d="M-20 330 C140 270 240 310 360 230 S600 175 820 212" />
        <path d="M-20 360 C160 300 260 340 380 262 S620 210 820 246" />
        <path d="M-20 270 C100 212 200 248 320 170 S560 104 820 146" />
        <path d="M-20 240 C80 186 180 216 300 140 S540 70 820 112" />
        <path d="M-20 210 C60 160 160 186 280 112 S520 40 820 80" />
        <path d="M440 120 C480 70 580 58 620 92 S600 160 548 156 S420 162 440 120" />
        <path d="M476 116 C500 88 566 82 590 102 S574 138 542 136 S462 140 476 116" />
        <path d="M512 112 C524 98 556 96 566 106 S556 122 540 122 S506 124 512 112" />
      </g>
    </svg>
  )
}
