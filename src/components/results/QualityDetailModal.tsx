import React from 'react';
import {
  X,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Award,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DetectedFruit } from '../../types';

interface QualityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  fruit: DetectedFruit | null;
}

export const QualityDetailModal: React.FC<QualityDetailModalProps> = ({
  isOpen,
  onClose,
  fruit,
}) => {
  if (!isOpen || !fruit) return null;

  const factors = fruit.factors;

  const factorList = [
    {
      name: 'Luminance / Brightness',
      val: factors.brightness,
      desc: 'Average perceptual luminance across crop pixels. Healthy specimens typically fall in the 50-80% band.',
      benchmark: '65%',
    },
    {
      name: 'Color Consistency',
      val: factors.colorConsistency,
      desc: 'Standard chromatic uniformity. Measures pigment stability across RGB color distribution.',
      benchmark: '80%',
    },
    {
      name: 'Color Saturation',
      val: factors.saturation,
      desc: 'Color purity and richness calculated in HSL color space. Key ripeness indicator.',
      benchmark: '75%',
    },
    {
      name: 'Dark-Region / Blemish Ratio',
      val: factors.darkRegionProportion,
      desc: 'Percentage of pixels classified as dark, necrotic brown, or heavily discolored lesions.',
      benchmark: '< 5%',
      isPenalty: true,
    },
    {
      name: 'Texture Variation',
      val: factors.textureVariation,
      desc: 'Spatial gradient variance across adjacent pixel boundaries (roughness vs smoothness).',
      benchmark: '60%',
    },
    {
      name: 'Sharpness / Edge Definition',
      val: factors.sharpness,
      desc: 'High-frequency contour gradient intensity to evaluate capture clarity.',
      benchmark: '70%',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Quality Factor Inspection — Fruit #{fruit.fruitNumber} ({fruit.fruitType})
              </h3>
              <p className="text-xs text-slate-400">
                Local Visual Quality Estimate • Client-Side Heuristic
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Main Visual Profile Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
            {fruit.cropDataUrl ? (
              <img
                src={fruit.cropDataUrl}
                alt={`Fruit #${fruit.fruitNumber} Crop`}
                className="w-28 h-28 rounded-xl object-cover border border-slate-700 shadow-md shrink-0 bg-slate-900"
              />
            ) : (
              <div className="w-28 h-28 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-white shrink-0">
                #{fruit.fruitNumber}
              </div>
            )}

            <div className="space-y-2 text-center sm:text-left min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {fruit.isUserAssisted ? 'User-Assisted Classification' : 'Benchmark Ground-Truth'}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded border ${
                    fruit.qualityCategory === 'Excellent'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : fruit.qualityCategory === 'Good'
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                      : fruit.qualityCategory === 'Fair'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {fruit.qualityCategory} Quality
                </span>
              </div>

              <div className="flex items-baseline justify-center sm:justify-start gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {fruit.qualityScore}
                </span>
                <span className="text-sm text-slate-400 font-medium">/ 100 Visual Score</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {fruit.recommendation}
              </p>
            </div>
          </div>

          {/* Transparent AI Honesty Disclosure */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Local Visual Quality Estimate (Not a trained EfficientNet V2 prediction)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              This score is calculated mathematically from browser-side image processing characteristics. It is a visual quality estimate and not an actual trained neural-network freshness prediction.
            </p>
          </div>

          {/* Detailed Factors Breakdown with Progress Bars */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Calculated Image Parameters
            </h4>

            <div className="space-y-3">
              {factorList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{item.name}</span>
                    <span
                      className={`font-mono font-bold ${
                        item.isPenalty && item.val > 15
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {item.val}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.isPenalty
                          ? item.val > 15
                            ? 'bg-rose-500'
                            : 'bg-emerald-400'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      }`}
                      style={{ width: `${Math.min(100, item.val)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>{item.desc}</span>
                    <span className="font-mono text-slate-400 shrink-0 ml-2">
                      Ref: {item.benchmark}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* "How was this estimate generated?" Section */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-400" />
              <span>How was this estimate generated?</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              The browser extracted the individual fruit crop using HTML5 Canvas and inspected pixel RGB arrays directly in local memory. It evaluated luminance consistency, color distribution variance, and detected blemish/dark-pixel percentages against standard freshness ranges.
            </p>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-medium">
              <strong>Architecture Note:</strong> EfficientNet V2 integration is planned for the production AI backend.
            </div>
          </div>

          {/* Coming Soon Features / Modules */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Planned AI Capabilities (Production Roadmap)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Defect Detection */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Defect Detection</span>
                </div>
                <div className="text-[10px] text-amber-300 font-semibold">Coming Soon</div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  A trained defect-detection model and labeled defect dataset are required.
                </p>
              </div>

              {/* Shelf-Life Prediction */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Shelf-Life Prediction</span>
                </div>
                <div className="text-[10px] text-blue-300 font-semibold">Coming Soon</div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Reliable shelf-life prediction requires time-series / storage-condition labeled data.
                </p>
              </div>

              {/* Market Grade */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Market Grade</span>
                </div>
                <div className="text-[10px] text-emerald-300 font-semibold">Coming Soon</div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Defined grading standards (e.g. USDA / AGMARK) and labeled training datasets are required.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Offline Demo Heuristic • Safe for Academic Defense
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
