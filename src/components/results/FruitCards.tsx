import React from 'react';
import {
  Sparkles,
  Eye,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  Maximize2,
  Cpu,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface FruitCardsProps {
  fruits: any[];
  selectedFruitId: string | number | null;
  onSelectFruit: (fruitId: string | number) => void;
  onViewCrop?: (fruit: any) => void;
  isDemo?: boolean;
}

export const FruitCards: React.FC<FruitCardsProps> = ({
  fruits,
  selectedFruitId,
  onSelectFruit,
  isDemo = true,
}) => {
  const getQualityBadge = (category: string) => {
    switch (category) {
      case 'Excellent':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Good':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'Fair':
      case 'Moderate':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Poor':
      case 'Spoiled':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getQualityIndex = (category: string): { label: 'High' | 'Medium' | 'Low'; color: string } => {
    switch (category) {
      case 'Excellent':
      case 'Good':
        return { label: 'High', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'Fair':
      case 'Moderate':
        return { label: 'Medium', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 'Poor':
      case 'Spoiled':
      default:
        return { label: 'Low', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
    }
  };

  const getShelfLife = (category: string): string => {
    switch (category) {
      case 'Excellent':
        return '7-10 days (Optimal freshness)';
      case 'Good':
        return '5-7 days (Store cool)';
      case 'Fair':
      case 'Moderate':
        return '2-3 days (Consume promptly)';
      case 'Poor':
      case 'Spoiled':
        return 'Expired / 0-1 days';
      default:
        return '3-5 days';
    }
  };

  const getRecommendedAction = (category: string): string => {
    switch (category) {
      case 'Excellent':
      case 'Good':
        return 'Safe to Consume / Premium Retail Shelf';
      case 'Fair':
      case 'Moderate':
        return 'Immediate Sale / Food Processing (Juice/Jam)';
      case 'Poor':
      case 'Spoiled':
        return 'Discard / Organic Compost';
      default:
        return 'Secondary Processing';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Individual Fruit Crops & Quality Analysis ({fruits.length})</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              YOLO Cropping → EfficientNet V2
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Each isolated bounding crop is resized, normalized, and classified into quality indices
          </p>
        </div>

        {isDemo && (
          <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1.5 shrink-0">
            <Info className="w-3.5 h-3.5" />
            <span>Quality Assessment: Evaluation Mode Output</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {fruits.map((fruit, idx) => {
          const fruitId = fruit.fruit_id || fruit.id || idx + 1;
          const isSelected = selectedFruitId === fruitId;
          const fruitType = fruit.fruit_type || fruit.fruitType || 'Fruit';
          const qualityObj = fruit.quality || {};
          const qClass = qualityObj.class || fruit.qualityCategory || 'Good';
          const cropUrl = fruit.crop_image_url || fruit.cropDataUrl;
          const qualityIdx = getQualityIndex(qClass);
          const shelfLife = getShelfLife(qClass);
          const recommendedAction = getRecommendedAction(qClass);

          return (
            <div
              key={fruitId}
              onClick={() => onSelectFruit(fruitId)}
              className={`rounded-2xl border p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xl'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header & Crop Thumbnail */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {cropUrl ? (
                      <img
                        src={cropUrl}
                        alt={`Fruit Crop #${fruitId}`}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0 bg-slate-950 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center font-bold text-white text-xs">
                        <span>Crop</span>
                        <span>#{fruitId}</span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-base">
                          Fruit Crop #{fruitId}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium mt-0.5">
                        Type: <span className="text-white font-semibold">{fruitType}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Input size: 224 × 224 px
                      </div>
                    </div>
                  </div>

                  {/* Quality Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${getQualityBadge(
                      qClass
                    )}`}
                  >
                    {qClass}
                  </span>
                </div>

                {/* Preprocessing Status Tag */}
                <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Preprocessing Status</span>
                  <span className="text-emerald-400 font-mono font-medium">
                    Normalized, Resized (224×224)
                  </span>
                </div>

                {/* Quality Score & Index (Requirement 6) */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Quality Index:</span>
                    <span className={`px-2 py-0.5 rounded font-bold border text-xs ${qualityIdx.color}`}>
                      {qualityIdx.label} Quality
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                    <span className="text-slate-400">Estimated Shelf Life:</span>
                    <span className="text-slate-200 font-semibold">{shelfLife}</span>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-slate-800/60">
                    <span className="text-slate-400 text-xs block">Recommended Action:</span>
                    <p className="text-xs font-semibold text-emerald-300">
                      {recommendedAction}
                    </p>
                  </div>
                </div>

                {/* Demo notice tag */}
                {isDemo && (
                  <div className="text-[10px] text-amber-400/90 font-mono text-center">
                    Evaluation Mode Output (Weights not loaded)
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
