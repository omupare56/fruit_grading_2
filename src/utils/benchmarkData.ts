import { BenchmarkCase } from '../types';

/**
 * Procedurally draws Test Case 1: Standard Benchmark — Apple, Banana, Orange
 */
function drawBenchmark1(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Background studio lighting surface
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#0F172A');
  grad.addColorStop(0.5, '#1E293B');
  grad.addColorStop(1, '#0B0F19');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Soft reflective wooden table surface
  const tableGrad = ctx.createLinearGradient(0, height * 0.65, 0, height);
  tableGrad.addColorStop(0, '#292524');
  tableGrad.addColorStop(1, '#1C1917');
  ctx.fillStyle = tableGrad;
  ctx.beginPath();
  ctx.ellipse(width * 0.5, height * 0.82, width * 0.52, height * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shadow for Apple
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.ellipse(width * 0.22, height * 0.72, 60, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw Fresh Apple (Red)
  ctx.save();
  ctx.translate(width * 0.22, height * 0.52);
  const appleGrad = ctx.createRadialGradient(-15, -20, 10, 0, 0, 75);
  appleGrad.addColorStop(0, '#EF4444');
  appleGrad.addColorStop(0.5, '#DC2626');
  appleGrad.addColorStop(0.85, '#991B1B');
  appleGrad.addColorStop(1, '#450A0A');
  ctx.fillStyle = appleGrad;

  ctx.beginPath();
  ctx.moveTo(0, -50);
  ctx.bezierCurveTo(45, -58, 65, -15, 60, 30);
  ctx.bezierCurveTo(55, 65, 25, 75, 0, 65);
  ctx.bezierCurveTo(-25, 75, -55, 65, -60, 30);
  ctx.bezierCurveTo(-65, -15, -45, -58, 0, -50);
  ctx.fill();

  // Apple Specular highlight
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(-22, -22, 18, 10, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  // Stem & leaf
  ctx.strokeStyle = '#573315';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -48);
  ctx.quadraticCurveTo(8, -68, 16, -72);
  ctx.stroke();

  ctx.fillStyle = '#22C55E';
  ctx.beginPath();
  ctx.ellipse(14, -62, 14, 6, Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Shadow for Banana
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.ellipse(width * 0.52, height * 0.74, 90, 25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw Banana (Yellow)
  ctx.save();
  ctx.translate(width * 0.52, height * 0.48);
  ctx.rotate(-0.08);

  const bananaGrad = ctx.createLinearGradient(-75, -40, 85, 45);
  bananaGrad.addColorStop(0, '#EAB308');
  bananaGrad.addColorStop(0.4, '#FDE047');
  bananaGrad.addColorStop(0.8, '#FACC15');
  bananaGrad.addColorStop(1, '#CA8A04');
  ctx.fillStyle = bananaGrad;

  ctx.beginPath();
  ctx.moveTo(-90, -45);
  ctx.bezierCurveTo(-30, -5, 30, 10, 85, -20);
  ctx.bezierCurveTo(92, -10, 90, 8, 75, 25);
  ctx.bezierCurveTo(15, 65, -55, 35, -95, -25);
  ctx.closePath();
  ctx.fill();

  // Banana tips and ridge
  ctx.strokeStyle = '#65A30D';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-90, -45);
  ctx.lineTo(-100, -52);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(161, 98, 7, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-80, -28);
  ctx.bezierCurveTo(-20, 15, 30, 25, 78, 15);
  ctx.stroke();
  ctx.restore();

  // Shadow for Orange
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.ellipse(width * 0.81, height * 0.73, 58, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw Orange
  ctx.save();
  ctx.translate(width * 0.81, height * 0.52);

  const orangeGrad = ctx.createRadialGradient(-12, -18, 12, 0, 0, 70);
  orangeGrad.addColorStop(0, '#FDBA74');
  orangeGrad.addColorStop(0.4, '#F97316');
  orangeGrad.addColorStop(0.8, '#EA580C');
  orangeGrad.addColorStop(1, '#9A3412');
  ctx.fillStyle = orangeGrad;

  ctx.beginPath();
  ctx.arc(0, 0, 62, 0, Math.PI * 2);
  ctx.fill();

  // Texture dots (citrus pores)
  ctx.fillStyle = 'rgba(234, 88, 12, 0.35)';
  for (let i = 0; i < 45; i++) {
    const rx = (Math.sin(i * 3.7) * 48);
    const ry = (Math.cos(i * 2.3) * 48);
    ctx.beginPath();
    ctx.arc(rx, ry, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Specular sheen
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.ellipse(-18, -20, 15, 9, -Math.PI / 5, 0, Math.PI * 2);
  ctx.fill();

  // Little green calyx at top
  ctx.fillStyle = '#15803D';
  ctx.beginPath();
  ctx.arc(0, -60, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Procedurally draws Test Case 2: Quality Contrast — Fresh Apple vs Defective Apple
 */
function drawBenchmark2(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Dark studio backdrop
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#090D16');
  grad.addColorStop(0.5, '#131D31');
  grad.addColorStop(1, '#080C14');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Bench surface
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(0, height * 0.72, width, height * 0.28);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.72);
  ctx.lineTo(width, height * 0.72);
  ctx.stroke();

  // Fresh Apple (Left, Fresh Grade A)
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.ellipse(width * 0.3, height * 0.76, 68, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(width * 0.3, height * 0.48);

  const freshGrad = ctx.createRadialGradient(-18, -22, 10, 0, 0, 80);
  freshGrad.addColorStop(0, '#F87171');
  freshGrad.addColorStop(0.35, '#EF4444');
  freshGrad.addColorStop(0.75, '#DC2626');
  freshGrad.addColorStop(1, '#7F1D1D');
  ctx.fillStyle = freshGrad;

  ctx.beginPath();
  ctx.moveTo(0, -60);
  ctx.bezierCurveTo(55, -68, 75, -20, 70, 36);
  ctx.bezierCurveTo(62, 80, 28, 88, 0, 76);
  ctx.bezierCurveTo(-28, 88, -62, 80, -70, 36);
  ctx.bezierCurveTo(-75, -20, -55, -68, 0, -60);
  ctx.fill();

  // Glossy reflection
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.beginPath();
  ctx.ellipse(-26, -26, 22, 12, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  // Stem
  ctx.strokeStyle = '#451A03';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, -58);
  ctx.quadraticCurveTo(10, -80, 20, -85);
  ctx.stroke();
  ctx.restore();

  // Defective Apple (Right, Bruised and wrinkled)
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.ellipse(width * 0.7, height * 0.76, 68, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(width * 0.7, height * 0.48);

  // Dull, browned gradient
  const badGrad = ctx.createRadialGradient(-10, -10, 10, 0, 0, 80);
  badGrad.addColorStop(0, '#9A3412');
  badGrad.addColorStop(0.4, '#78350F');
  badGrad.addColorStop(0.75, '#451A03');
  badGrad.addColorStop(1, '#291102');
  ctx.fillStyle = badGrad;

  ctx.beginPath();
  ctx.moveTo(0, -58);
  ctx.bezierCurveTo(52, -62, 68, -15, 62, 36);
  ctx.bezierCurveTo(54, 76, 25, 84, 0, 72);
  ctx.bezierCurveTo(-25, 84, -54, 76, -62, 36);
  ctx.bezierCurveTo(-68, -15, -52, -62, 0, -58);
  ctx.fill();

  // Necrotic dark bruised patches (rot spots)
  ctx.fillStyle = 'rgba(20, 10, 5, 0.85)';
  ctx.beginPath();
  ctx.ellipse(18, 12, 28, 22, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(35, 18, 8, 0.75)';
  ctx.beginPath();
  ctx.ellipse(-24, 26, 22, 16, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Wrinkle texture lines
  ctx.strokeStyle = 'rgba(20, 8, 3, 0.6)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(15, 10, 18, 0.2, Math.PI * 0.9);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(15, 12, 24, 0.4, Math.PI * 0.8);
  ctx.stroke();

  // Decayed stem
  ctx.strokeStyle = '#291102';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -56);
  ctx.lineTo(8, -74);
  ctx.stroke();
  ctx.restore();
}

/**
 * Procedurally draws Test Case 3: Tropical Harvest — Mango and Orange
 */
function drawBenchmark3(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Deep tropical studio palette
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#061727');
  grad.addColorStop(0.5, '#0B243B');
  grad.addColorStop(1, '#05121F');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Surface
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.ellipse(width * 0.5, height * 0.84, width * 0.5, height * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mango (Left)
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.ellipse(width * 0.32, height * 0.76, 80, 24, -0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(width * 0.32, height * 0.5);
  ctx.rotate(-0.18);

  const mangoGrad = ctx.createRadialGradient(-20, -25, 15, 0, 0, 95);
  mangoGrad.addColorStop(0, '#FDE047');
  mangoGrad.addColorStop(0.35, '#F59E0B');
  mangoGrad.addColorStop(0.7, '#D97706');
  mangoGrad.addColorStop(0.9, '#EF4444');
  mangoGrad.addColorStop(1, '#991B1B');
  ctx.fillStyle = mangoGrad;

  ctx.beginPath();
  ctx.moveTo(-15, -75);
  ctx.bezierCurveTo(45, -75, 75, -25, 68, 35);
  ctx.bezierCurveTo(62, 85, 15, 95, -35, 75);
  ctx.bezierCurveTo(-75, 55, -85, -15, -60, -55);
  ctx.bezierCurveTo(-45, -75, -30, -75, -15, -75);
  ctx.closePath();
  ctx.fill();

  // Mango highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.beginPath();
  ctx.ellipse(-20, -30, 24, 14, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Orange (Right)
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.ellipse(width * 0.72, height * 0.76, 60, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(width * 0.72, height * 0.52);

  const orangeGrad = ctx.createRadialGradient(-15, -20, 10, 0, 0, 72);
  orangeGrad.addColorStop(0, '#FED7AA');
  orangeGrad.addColorStop(0.45, '#F97316');
  orangeGrad.addColorStop(0.8, '#EA580C');
  orangeGrad.addColorStop(1, '#9A3412');
  ctx.fillStyle = orangeGrad;

  ctx.beginPath();
  ctx.arc(0, 0, 65, 0, Math.PI * 2);
  ctx.fill();

  // Pores
  ctx.fillStyle = 'rgba(154, 52, 18, 0.4)';
  for (let i = 0; i < 40; i++) {
    const rx = (Math.cos(i * 4.1) * 50);
    const ry = (Math.sin(i * 2.7) * 50);
    ctx.beginPath();
    ctx.arc(rx, ry, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Specular sheen
  ctx.fillStyle = 'rgba(255,255,255,0.32)';
  ctx.beginPath();
  ctx.ellipse(-18, -22, 16, 9, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Creates a Data URL for a benchmark case
 */
export function generateBenchmarkImage(
  benchmark: BenchmarkCase,
  width = 800,
  height = 500
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  benchmark.canvasDrawer(ctx, width, height);
  return canvas.toDataURL('image/jpeg', 0.92);
}

export const BENCHMARK_CASES: BenchmarkCase[] = [
  {
    id: 'benchmark-1',
    title: 'Standard Benchmark — Apple, Banana, Orange',
    category: 'Multi-Fruit Batch Analysis',
    badge: 'Multi-Fruit Demo',
    description:
      'Standard triple-fruit evaluation demonstrating multi-object region bounding boxes, color variance discrimination, and individual crop quality analysis.',
    canvasDrawer: drawBenchmark1,
    fruits: [
      {
        fruitNumber: 1,
        fruitType: 'Apple',
        boundingBox: { x: 12, y: 22, width: 22, height: 58 },
        qualityScore: 91,
        qualityCategory: 'Excellent',
        factors: {
          brightness: 74,
          colorConsistency: 88,
          saturation: 82,
          darkRegionProportion: 3,
          textureVariation: 68,
          sharpness: 84,
        },
        recommendation:
          'Suitable for premium retail display or direct consumption. Minimal skin variation observed.',
        explanation:
          'High luminance balance (74%) and minimal dark regions (3%). Stable pigmentation matches benchmark Grade A Red Delicious profile.',
      },
      {
        fruitNumber: 2,
        fruitType: 'Banana',
        boundingBox: { x: 38, y: 24, width: 32, height: 56 },
        qualityScore: 82,
        qualityCategory: 'Good',
        factors: {
          brightness: 80,
          colorConsistency: 79,
          saturation: 86,
          darkRegionProportion: 7,
          textureVariation: 55,
          sharpness: 76,
        },
        recommendation:
          'Ideal table ripeness. Minor natural sugar spotting along peel surface with sound structural firmness.',
        explanation:
          'Strong golden chromaticity with minor speckling (7% dark proportion). Characteristic of mature Cavendish specimen.',
      },
      {
        fruitNumber: 3,
        fruitType: 'Orange',
        boundingBox: { x: 70, y: 26, width: 22, height: 54 },
        qualityScore: 89,
        qualityCategory: 'Excellent',
        factors: {
          brightness: 76,
          colorConsistency: 85,
          saturation: 89,
          darkRegionProportion: 2,
          textureVariation: 74,
          sharpness: 88,
        },
        recommendation:
          'Fresh citrus standard. Clean flavedo with uniform oil gland distribution and vibrant orange color.',
        explanation:
          'Optimal saturation (89%) and high sharpness (88%). Very low dark region proportion (2%).',
      },
    ],
  },
  {
    id: 'benchmark-2',
    title: 'Quality Contrast — Fresh Apple vs Defective Apple',
    category: 'Comparative Defect Contrast',
    badge: 'Fresh vs Defective',
    description:
      'Side-by-side demonstration contrasting a fresh Grade-A specimen against a severely bruised, oxidised, and wrinkled apple with high dark-region percentage.',
    canvasDrawer: drawBenchmark2,
    fruits: [
      {
        fruitNumber: 1,
        fruitType: 'Apple',
        boundingBox: { x: 18, y: 20, width: 26, height: 62 },
        qualityScore: 93,
        qualityCategory: 'Excellent',
        factors: {
          brightness: 78,
          colorConsistency: 92,
          saturation: 85,
          darkRegionProportion: 2,
          textureVariation: 66,
          sharpness: 90,
        },
        recommendation:
          'Flawless surface cuticle. Firm, unblemished skin with vibrant anthocyanin pigmentation.',
        explanation:
          'Peak visual freshness score (93/100). High color consistency and negligible blemish index.',
      },
      {
        fruitNumber: 2,
        fruitType: 'Apple',
        boundingBox: { x: 58, y: 20, width: 26, height: 62 },
        qualityScore: 36,
        qualityCategory: 'Poor',
        factors: {
          brightness: 38,
          colorConsistency: 34,
          saturation: 42,
          darkRegionProportion: 38,
          textureVariation: 86,
          sharpness: 65,
        },
        recommendation:
          'Pronounced rot and discoloration detected. Severe bruising; physically degraded skin, not recommended for consumption.',
        explanation:
          'High dark region concentration (38%) accompanied by suppressed luminance (38%) and skin degradation.',
      },
    ],
  },
  {
    id: 'benchmark-3',
    title: 'Tropical Harvest — Mango and Orange',
    category: 'Tropical Crop Evaluation',
    badge: 'Tropical Demo',
    description:
      'High-saturation tropical fruits analysis showcasing asymmetric shape handling (mango) alongside spherical citrus metrics.',
    canvasDrawer: drawBenchmark3,
    fruits: [
      {
        fruitNumber: 1,
        fruitType: 'Mango',
        boundingBox: { x: 16, y: 22, width: 34, height: 58 },
        qualityScore: 84,
        qualityCategory: 'Good',
        factors: {
          brightness: 72,
          colorConsistency: 77,
          saturation: 90,
          darkRegionProportion: 6,
          textureVariation: 62,
          sharpness: 80,
        },
        recommendation:
          'Naturally ripe mango. Rich beta-carotene yellow hues with slight blush and minimal handling marks.',
        explanation:
          'Strong saturation (90%) and balanced luminance (72%). Natural surface tone variance expected in ripe cultivars.',
      },
      {
        fruitNumber: 2,
        fruitType: 'Orange',
        boundingBox: { x: 62, y: 26, width: 22, height: 54 },
        qualityScore: 66,
        qualityCategory: 'Fair',
        factors: {
          brightness: 62,
          colorConsistency: 60,
          saturation: 74,
          darkRegionProportion: 16,
          textureVariation: 70,
          sharpness: 72,
        },
        recommendation:
          'Fair visual quality. Localized peel drying and mild brown scuffing. Recommended for juice extraction or immediate eating.',
        explanation:
          'Color consistency suppressed to 60% with 16% dark/blemished pixel ratio on flavedo.',
      },
    ],
  },
];
