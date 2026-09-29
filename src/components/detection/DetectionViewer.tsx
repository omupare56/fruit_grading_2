import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  Tag,
  CheckCircle,
  Scan,
  Maximize2,
  Cpu,
} from 'lucide-react';

interface DetectionViewerProps {
  imageUrl: string;
  fruits: any[];
  selectedFruitId: string | number | null;
  onSelectFruit: (fruitId: string | number) => void;
  imageWidth?: number;
  imageHeight?: number;
  isDemo?: boolean;
}

export const DetectionViewer: React.FC<DetectionViewerProps> = ({
  imageUrl,
  fruits,
  selectedFruitId,
  onSelectFruit,
  imageWidth = 800,
  imageHeight = 600,
  isDemo = true,
}) => {
  const [showBoxes, setShowBoxes] = useState(true);
  const [showConfidence, setShowConfidence] = useState(true);
  const [showQualityTags, setShowQualityTags] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleReset = () => setZoomLevel(1);

  const getQualityClass = (fruit: any): string => {
    return fruit.quality?.class || fruit.qualityCategory || 'Good';
  };

  const getCoordinates = (fruit: any): [number, number, number, number] => {
    if (fruit.bounding_box) {
      const b = fruit.bounding_box;
      if ('x1' in b && 'x2' in b) {
        return [Math.round(b.x1), Math.round(b.y1), Math.round(b.x2), Math.round(b.y2)];
      }
      if ('x' in b && 'width' in b) {
        const x1 = Math.round((b.x / 100) * imageWidth);
        const y1 = Math.round((b.y / 100) * imageHeight);
        const x2 = Math.round(((b.x + b.width) / 100) * imageWidth);
        const y2 = Math.round(((b.y + b.height) / 100) * imageHeight);
        return [x1, y1, x2, y2];
      }
    }
    if (fruit.boundingBox) {
      const b = fruit.boundingBox;
      const x1 = Math.round((b.x / 100) * imageWidth);
      const y1 = Math.round((b.y / 100) * imageHeight);
      const x2 = Math.round(((b.x + b.width) / 100) * imageWidth);
      const y2 = Math.round(((b.y + b.height) / 100) * imageHeight);
      return [x1, y1, x2, y2];
    }
    return [0, 0, 0, 0];
  };

  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'Excellent':
        return 'bg-emerald-500/90 text-white border-emerald-400';
      case 'Good':
        return 'bg-teal-500/90 text-white border-teal-400';
      case 'Fair':
      case 'Moderate':
        return 'bg-amber-500/90 text-white border-amber-400';
      case 'Poor':
      case 'Spoiled':
        return 'bg-rose-500/90 text-white border-rose-400';
      default:
        return 'bg-slate-700 text-white border-slate-600';
    }
  };

  const getBorderColor = (category: string, isSelected: boolean) => {
    if (isSelected) {
      return 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)] ring-2 ring-emerald-300';
    }
    switch (category) {
      case 'Excellent':
        return 'border-emerald-500/80 hover:border-emerald-400';
      case 'Good':
        return 'border-teal-500/80 hover:border-teal-400';
      case 'Fair':
      case 'Moderate':
        return 'border-amber-500/80 hover:border-amber-400';
      case 'Poor':
      case 'Spoiled':
        return 'border-rose-500/80 hover:border-rose-400';
      default:
        return 'border-emerald-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Toggle Bounding Boxes */}
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              showBoxes
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Bounding Boxes {showBoxes ? 'ON' : 'OFF'}</span>
          </button>

          {/* Toggle Confidence */}
          <button
            onClick={() => setShowConfidence(!showConfidence)}
            className={`px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              showConfidence
                ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Confidence Tags {showConfidence ? 'ON' : 'OFF'}</span>
          </button>

          {/* Toggle Quality Tags */}
          <button
            onClick={() => setShowQualityTags(!showQualityTags)}
            className={`px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              showQualityTags
                ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Quality Tags {showQualityTags ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.75}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-mono text-slate-400 px-1.5 min-w-[45px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 2.5}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[380px] sm:min-h-[460px] p-2 sm:p-4 select-none">
        <div
          className="relative transition-transform duration-200 origin-center max-w-full"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Base image */}
          <img
            src={imageUrl}
            alt="Analyzed Fruit Batch"
            className="max-h-[480px] max-w-full rounded-xl object-contain shadow-2xl block"
          />

          {/* Bounding Boxes Layer */}
          {showBoxes &&
            fruits.map((fruit, idx) => {
              const fruitId = fruit.fruit_id || fruit.id || idx + 1;
              const isSelected = selectedFruitId === fruitId;
              const qClass = getQualityClass(fruit);
              const fruitType = fruit.fruit_type || fruit.fruitType || 'Unknown/Low Confidence';

              // Calculate bounding box percentages
              let left = 10;
              let top = 10;
              let width = 20;
              let height = 20;

              if (fruit.bounding_box) {
                const b = fruit.bounding_box;
                if ('x1' in b && 'x2' in b) {
                  left = (b.x1 / imageWidth) * 100;
                  top = (b.y1 / imageHeight) * 100;
                  width = ((b.x2 - b.x1) / imageWidth) * 100;
                  height = ((b.y2 - b.y1) / imageHeight) * 100;
                } else if ('x' in b && 'width' in b) {
                  left = b.x;
                  top = b.y;
                  width = b.width;
                  height = b.height;
                }
              } else if (fruit.boundingBox) {
                left = fruit.boundingBox.x;
                top = fruit.boundingBox.y;
                width = fruit.boundingBox.width;
                height = fruit.boundingBox.height;
              }

              return (
                <div
                  key={fruitId}
                  onClick={() => onSelectFruit(fruitId)}
                  style={{
                    left: `${Math.max(0, Math.min(95, left))}%`,
                    top: `${Math.max(0, Math.min(95, top))}%`,
                    width: `${Math.max(4, Math.min(100 - left, width))}%`,
                    height: `${Math.max(4, Math.min(100 - top, height))}%`,
                  }}
                  className={`absolute border-2 rounded-lg cursor-pointer transition-all duration-150 group z-20 ${getBorderColor(
                    qClass,
                    isSelected
                  )} ${isSelected ? 'bg-emerald-500/15' : 'hover:bg-white/10'}`}
                >
                  {/* Top Tag Header */}
                  <div className="absolute -top-7 left-0 flex items-center gap-1 z-30 pointer-events-none whitespace-nowrap">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900/90 text-white text-[10px] font-bold border border-slate-700 shadow">
                      #{fruit.fruit_id || fruit.fruitNumber || idx + 1} {fruitType}
                    </span>

                    {showConfidence && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-900/90 text-emerald-300 text-[9px] font-mono border border-emerald-500/30 shadow">
                        {fruit.detection_confidence != null
                          ? `${Math.round(fruit.detection_confidence * 100)}% conf`
                          : fruit.confidence != null
                            ? `${Math.round(fruit.confidence * 100)}% conf`
                            : 'YOLO'}
                      </span>
                    )}

                    {showQualityTags && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shadow ${getBadgeColor(
                          qClass
                        )}`}
                      >
                        {qClass}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Requirement 4: Detected Fruits List Table */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>YOLO Fruit Localization Table</span>
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">
            {fruits.length} detected instances
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2 px-3">Fruit ID</th>
                <th className="py-2 px-3">Detected Type</th>
                <th className="py-2 px-3">Detection Confidence</th>
                <th className="py-2 px-3">Bounding Box [x1, y1, x2, y2]</th>
                <th className="py-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {fruits.map((fruit, idx) => {
                const fruitId = fruit.fruit_id || fruit.id || idx + 1;
                const isSelected = selectedFruitId === fruitId;
                const fruitType = fruit.fruit_type || fruit.fruitType || 'Unknown/Low Confidence';
                const coords = getCoordinates(fruit);

                return (
                  <tr
                    key={fruitId}
                    onClick={() => onSelectFruit(fruitId)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-white">
                      #{fruitId}
                    </td>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                      {fruitType}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 font-mono">
                        {fruit.detection_confidence != null
                          ? `${Math.round(fruit.detection_confidence * 100)}%`
                          : fruit.confidence != null
                            ? `${Math.round(fruit.confidence * 100)}%`
                            : 'YOLO detect'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      [{coords[0]}, {coords[1]}, {coords[2]}, {coords[3]}]
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFruit(fruitId);
                        }}
                        className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isSelected ? 'Active' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
