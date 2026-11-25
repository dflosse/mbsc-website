// Hero landscape: the Bogong high plains behind Les Peart Oval.
// Pure SVG so it scales to any screen and needs no photo rights.
export default function Valley() {
  return (
    <svg className="valley" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d7e3e6" />
          <stop offset="0.6" stopColor="#eef2ee" />
        </linearGradient>
        <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b7a4c" />
          <stop offset="1" stopColor="#2a5c39" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#sky)" />
      <g transform="translate(0 70)">
      {/* far range – Mt Bogong massif */}
      <path d="M0 520 L120 470 L230 488 L360 420 L470 440 L590 360 L700 318 L790 330 L860 300 L930 322 L1030 300 L1120 352 L1230 380 L1340 360 L1460 410 L1600 392 L1600 640 L0 640 Z" fill="#a7b9bc" />
      <path d="M700 318 L790 330 L860 300 L930 322 L1030 300 L1000 318 L940 336 L870 318 L800 344 L740 334 Z" fill="#f4f7f6" opacity=".9" />
      {/* mid ridges */}
      <path d="M0 580 L140 540 L260 556 L400 500 L520 520 L640 476 L760 500 L900 470 L1040 506 L1180 484 L1320 520 L1470 500 L1600 520 L1600 700 L0 700 Z" fill="#7c9a8b" />
      {/* near hills */}
      <path d="M0 650 L180 610 L340 630 L520 596 L700 624 L880 600 L1060 628 L1260 604 L1440 630 L1600 612 L1600 760 L0 760 Z" fill="#4f7c62" />
      {/* tree line */}
      <path d="M0 690 Q 60 672 120 688 T 240 684 T 360 690 T 480 680 T 600 690 T 720 682 T 840 690 T 960 680 T 1080 690 T 1200 682 T 1320 690 T 1440 680 T 1600 688 L1600 730 L0 730 Z" fill="#355f45" />
      {/* the oval */}
      <path d="M0 720 L1600 700 L1600 900 L0 900 Z" fill="url(#grass)" />
      <g fill="none" stroke="#ffffff" strokeOpacity=".75" strokeWidth="3">
        <path d="M300 900 L520 742 L1120 734 L1360 900" />
        <path d="M820 738 L840 900" />
        <ellipse cx="830" cy="812" rx="120" ry="34" />
        <path d="M600 742 L560 790 L1080 784 L1050 736" />
      </g>
      <g fill="none" stroke="#ffffff" strokeWidth="4">
        <path d="M740 738 L740 712 L920 708 L920 735" />
      </g>
      </g>
    </svg>
  )
}
