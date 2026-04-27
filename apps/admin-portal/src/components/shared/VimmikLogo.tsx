'use client';

import { motion } from 'framer-motion';

interface VimmikLogoProps {
  /** Tailwind sizing classes, e.g. "w-8 h-8". Takes priority over size. */
  className?: string;
  /** Explicit pixel size (width = height). Used when className is omitted. */
  size?: number;
}

/*
 * VIMMIK Falcon — advanced low-poly Peregrine Falcon, upright soaring pose.
 *
 * Coordinate space: 680×720 (viewBox), rendered at `size` px or via `className`.
 * Structure:
 *   Head + neck — 9 facets, beak pointing right
 *   Body        — 11 torso facets, torpedo shape
 *   Wings       — right: 7 panels / left: 7 mirror panels
 *   Tail        — 5 forked feather polygons
 *   Talons      — 6 small polygons
 *
 * Fill: deep navy facets with per-face rgba variation.
 * Stroke: #3BA3E8 at variable opacity.
 * Extras: halo rings, crosshair guides, eye pulse ring, particle dots, constellation.
 */

// [points, fill rgba string, stroke opacity]
type Poly = [string, string, number];

const TAIL: Poly[] = [
  ['340,490 356,510 348,600 332,600 324,510', 'rgba(8,18,34,0.85)',  0.65],
  ['356,510 378,500 390,580 362,592 348,600', 'rgba(9,20,38,0.75)',  0.55],
  ['324,510 302,500 292,580 318,592 332,600', 'rgba(9,20,38,0.75)',  0.55],
  ['378,500 398,488 410,560 390,580',         'rgba(10,22,40,0.65)', 0.45],
  ['302,500 284,488 272,560 292,580',         'rgba(10,22,40,0.65)', 0.45],
];

const RIGHT_WING: Poly[] = [
  ['380,260 420,240 440,290 400,310 370,300', 'rgba(11,24,44,0.80)', 0.70],
  ['420,240 476,200 500,248 460,280 440,290', 'rgba(12,26,48,0.78)', 0.72],
  ['476,200 534,168 554,218 510,250 500,248', 'rgba(13,28,50,0.75)', 0.68],
  ['534,168 594,148 608,196 562,222 554,218', 'rgba(14,30,54,0.72)', 0.65],
  ['594,148 638,142 640,180 608,196',         'rgba(15,32,56,0.70)', 0.70],
  ['460,280 510,250 520,298 474,316',         'rgba(9,20,36,0.55)',  0.45],
  ['400,310 460,280 474,316 420,334',         'rgba(8,18,34,0.50)',  0.40],
];

const LEFT_WING: Poly[] = [
  ['300,260 262,240 242,290 282,310 312,300', 'rgba(11,24,44,0.80)', 0.70],
  ['262,240 206,200 182,248 222,280 242,290', 'rgba(12,26,48,0.78)', 0.72],
  ['206,200 148,168 128,218 172,250 182,248', 'rgba(13,28,50,0.75)', 0.68],
  ['148,168 88,148 74,196 120,222 128,218',   'rgba(14,30,54,0.72)', 0.65],
  ['88,148 44,142 42,180 74,196',             'rgba(15,32,56,0.70)', 0.70],
  ['222,280 172,250 162,298 208,316',         'rgba(9,20,36,0.55)',  0.45],
  ['282,310 222,280 208,316 262,334',         'rgba(8,18,34,0.50)',  0.40],
];

const BODY: Poly[] = [
  ['340,190 390,220 400,280 370,320 340,330 310,320 282,280 292,220', 'rgba(14,30,56,0.88)', 0.80],
  ['390,220 420,240 412,300 390,320 370,320 400,280',                 'rgba(13,28,52,0.82)', 0.70],
  ['292,220 262,240 270,300 292,320 310,320 282,280',                 'rgba(12,26,50,0.80)', 0.70],
  ['400,280 412,300 404,360 386,380 370,370 380,320',                 'rgba(11,24,46,0.78)', 0.65],
  ['282,280 270,300 278,360 296,380 312,370 302,320',                 'rgba(10,22,44,0.76)', 0.65],
  ['370,320 340,330 312,320 302,370 312,420 340,436 368,420 380,370', 'rgba(12,26,48,0.84)', 0.75],
  ['380,320 400,310 412,360 404,400 380,420 368,420 380,370',         'rgba(11,24,46,0.74)', 0.60],
  ['302,320 282,310 270,360 278,400 302,420 312,420 302,370',         'rgba(10,22,44,0.72)', 0.60],
  ['368,420 340,436 312,420 320,470 340,490 360,470',                 'rgba(10,22,42,0.82)', 0.70],
  ['380,420 404,400 398,450 374,468 360,470 368,420',                 'rgba(9,20,38,0.68)',  0.55],
  ['302,420 278,400 284,450 308,468 322,470 312,420',                 'rgba(9,20,38,0.68)',  0.55],
];

const NECK: Poly[] = [
  ['340,130 362,150 368,190 340,200 314,190 320,150', 'rgba(13,28,52,0.85)', 0.72],
  ['362,150 382,158 384,200 368,210 368,190',          'rgba(12,26,48,0.78)', 0.65],
  ['320,150 300,158 298,200 314,210 314,190',          'rgba(11,24,46,0.76)', 0.63],
];

const HEAD: Poly[] = [
  ['340,80 364,90 368,118 348,128 340,130 332,128 314,118 318,90', 'rgba(10,22,42,0.90)', 0.80],
  ['364,90 384,100 390,128 374,142 362,150 362,118 368,118',        'rgba(7,16,30,0.92)',  0.70],
  ['318,90 298,100 294,128 308,142 320,150 320,118 314,118',        'rgba(7,16,30,0.90)',  0.68],
  ['340,80 364,90 360,78 340,68 322,78 318,90',                     'rgba(12,26,50,0.85)', 0.72],
  ['368,118 390,128 382,148 362,150 368,118',                       'rgba(9,20,38,0.80)',  0.60],
  ['314,118 294,128 300,148 320,150 314,118',                       'rgba(9,20,38,0.78)',  0.58],
];

const BEAK: Poly[] = [
  ['384,100 408,104 414,120 396,128 384,120', 'rgba(16,34,62,0.88)', 0.80],
  ['408,104 428,114 422,128 414,120',          'rgba(18,38,68,0.82)', 0.75],
  ['384,120 396,128 414,120 416,132 400,140 382,134', 'rgba(14,30,56,0.78)', 0.68],
  ['390,128 374,142 368,136 382,124',          'rgba(20,42,72,0.70)', 0.60],
];

const TALONS: Poly[] = [
  ['316,468 328,480 322,510 308,508 306,478', 'rgba(10,22,42,0.70)', 0.55],
  ['364,468 354,480 360,510 374,508 376,478', 'rgba(10,22,42,0.70)', 0.55],
  ['308,508 290,514 282,524 296,526 310,518', 'rgba(12,26,46,0.65)', 0.50],
  ['308,508 306,522 298,534 310,534 316,522', 'rgba(12,26,46,0.60)', 0.48],
  ['374,508 392,514 400,524 386,526 372,518', 'rgba(12,26,46,0.65)', 0.50],
  ['374,508 376,522 384,534 372,534 366,522', 'rgba(12,26,46,0.60)', 0.48],
];

const PARTICLES = [
  { cx: 100, cy: 100, r: 2.5, opacity: 0.60, dur: '2.8s' },
  { cx: 580, cy: 130, r: 1.8, opacity: 0.45, dur: '3.2s' },
  { cx: 70,  cy: 420, r: 2.0, opacity: 0.55, dur: '2.5s' },
  { cx: 620, cy: 400, r: 1.6, opacity: 0.40, dur: '3.5s' },
  { cx: 190, cy: 620, r: 2.2, opacity: 0.50, dur: '2.9s' },
  { cx: 500, cy: 600, r: 1.5, opacity: 0.38, dur: '3.1s' },
  { cx: 130, cy: 260, r: 1.4, opacity: 0.30, dur: '2.6s' },
  { cx: 560, cy: 260, r: 1.4, opacity: 0.30, dur: '2.7s' },
];

const ALL_GROUPS = [TAIL, RIGHT_WING, LEFT_WING, BODY, NECK, HEAD, BEAK, TALONS];
const GROUP_OFFSETS = ALL_GROUPS.reduce<number[]>((acc, _, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + ALL_GROUPS[i - 1].length);
  return acc;
}, []);

function polyVariants(delay: number) {
  return {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.30, delay } },
  };
}

function PolyGroup({ polys, groupIdx }: { polys: Poly[]; groupIdx: number }) {
  const base = GROUP_OFFSETS[groupIdx];
  return (
    <>
      {polys.map(([pts, fill, sOpacity], i) => (
        <motion.polygon
          key={`g${groupIdx}-${i}`}
          points={pts}
          fill={fill}
          stroke="#3BA3E8"
          strokeWidth="1.5"
          strokeOpacity={Math.min(sOpacity * 1.6, 1)}
          strokeLinejoin="round"
          variants={polyVariants((base + i) * 0.04)}
          initial="hidden"
          animate="visible"
        />
      ))}
    </>
  );
}

export function VimmikLogo({ className, size = 420 }: VimmikLogoProps) {
  const totalPolys = ALL_GROUPS.reduce((s, g) => s + g.length, 0);
  const eyeDelay = totalPolys * 0.04 + 0.1;

  // When className is provided (Tailwind w-X h-X), let Tailwind control size.
  // Otherwise use the explicit `size` number.
  const sizeProps = className ? {} : { width: size, height: size };

  return (
    <motion.svg
      {...sizeProps}
      className={className}
      viewBox="0 0 680 720"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="VIMMIK falcon — low-poly geometric illustration"
      style={{
        filter: 'drop-shadow(0 0 28px rgba(59,163,232,0.60)) drop-shadow(0 0 8px rgba(59,163,232,0.40))',
        maxWidth: '100%',
      }}
      whileHover={{
        scale: 1.05,
        filter: 'drop-shadow(0 0 28px rgba(59,163,232,0.65)) drop-shadow(0 0 10px rgba(59,163,232,0.40))',
      }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
    >
      <defs>
        <filter id="vl-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0 0 0 0 0.23  0 0 0 0 0.64  0 0 0 0 0.91  0 0 0 0.9 0"
            result="cb"
          />
          <feMerge>
            <feMergeNode in="cb" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Halo rings */}
      <circle cx="340" cy="340" r="290" stroke="#3BA3E8" strokeWidth="1.2"  strokeOpacity="0.28" fill="none" />
      <circle cx="340" cy="340" r="260" stroke="#3BA3E8" strokeWidth="0.6"  strokeDasharray="4 10" strokeOpacity="0.15" fill="none" />
      <circle cx="340" cy="340" r="220" stroke="#3BA3E8" strokeWidth="0.5"  strokeDasharray="2 14" strokeOpacity="0.10" fill="none" />

      {/* Crosshair guides */}
      <line x1="340" y1="60"  x2="340" y2="100" stroke="#3BA3E8" strokeWidth="0.5" strokeOpacity="0.20" />
      <line x1="340" y1="580" x2="340" y2="620" stroke="#3BA3E8" strokeWidth="0.5" strokeOpacity="0.20" />
      <line x1="60"  y1="340" x2="100" y2="340" stroke="#3BA3E8" strokeWidth="0.5" strokeOpacity="0.20" />
      <line x1="580" y1="340" x2="620" y2="340" stroke="#3BA3E8" strokeWidth="0.5" strokeOpacity="0.20" />

      {/* Polygon groups — tail → wings → body → neck → head → beak → talons */}
      <g filter="url(#vl-glow)">
        <PolyGroup polys={TAIL}       groupIdx={0} />
        <PolyGroup polys={RIGHT_WING} groupIdx={1} />
        <PolyGroup polys={LEFT_WING}  groupIdx={2} />
        <PolyGroup polys={BODY}       groupIdx={3} />
        <PolyGroup polys={NECK}       groupIdx={4} />
        <PolyGroup polys={HEAD}       groupIdx={5} />
        <PolyGroup polys={BEAK}       groupIdx={6} />
        <PolyGroup polys={TALONS}     groupIdx={7} />
      </g>

      {/* Eye */}
      <ellipse cx="362" cy="106" rx="11" ry="9" fill="none" stroke="#3BA3E8" strokeWidth="1.5" strokeOpacity="0.90" />
      <ellipse cx="362" cy="106" rx="8"  ry="7" fill="rgba(20,42,72,0.60)" stroke="#3BA3E8" strokeWidth="0.8" strokeOpacity="0.50" />
      <motion.circle
        cx={362} cy={106} r="5.5"
        fill="rgba(8,16,28,0.95)"
        stroke="#3BA3E8" strokeWidth="0.6" strokeOpacity="0.70"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: eyeDelay, duration: 0.3 }}
      />
      <motion.circle
        cx={362} cy={106} r="2.8"
        fill="#020810"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: eyeDelay + 0.1, duration: 0.2 }}
      />
      <circle cx="364" cy="103" r="1.2" fill="rgba(59,163,232,0.85)" />
      {/* Eye pulse ring */}
      <circle cx="362" cy="106" r="9" fill="none" stroke="rgba(59,163,232,0.5)" strokeWidth="0.8">
        <animate attributeName="r"       values="9;16;9"    dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* Particle dots */}
      {PARTICLES.map((p, i) => (
        <motion.circle
          key={`pt-${i}`}
          cx={p.cx} cy={p.cy} r={p.r}
          fill="#3BA3E8"
          initial={{ opacity: 0 }}
          animate={{ opacity: p.opacity }}
          transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
        >
          <animate
            attributeName="opacity"
            values={`${p.opacity};${+(p.opacity * 0.2).toFixed(2)};${p.opacity}`}
            dur={p.dur}
            repeatCount="indefinite"
          />
        </motion.circle>
      ))}

      {/* Constellation lines */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
      >
        <line x1="100" y1="100" x2="70"  y2="420" stroke="rgba(59,163,232,0.08)" strokeWidth="0.7" strokeDasharray="3 6" />
        <line x1="580" y1="130" x2="620" y2="400" stroke="rgba(59,163,232,0.08)" strokeWidth="0.7" strokeDasharray="3 6" />
        <line x1="190" y1="620" x2="500" y2="600" stroke="rgba(59,163,232,0.06)" strokeWidth="0.6" strokeDasharray="3 8" />
      </motion.g>
    </motion.svg>
  );
}

export default VimmikLogo;
