import React, { useState } from 'react';
import {
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ScanLine,
  Sliders,
  ShieldAlert,
  Printer,
  FileCode,
  Share2,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DetectionViewer } from '../detection/DetectionViewer';
import { FruitCards } from './FruitCards';

interface FinalReportViewProps {
  result: any;
  onStartNewAnalysis: () => void;
  onBackToHistory: () => void;
}

export const FinalReportView: React.FC<FinalReportViewProps> = ({
  result,
  onStartNewAnalysis,
  onBackToHistory,
}) => {
  const fruits: any[] = result.fruits || [];
  const [selectedFruitId, setSelectedFruitId] = useState<string | number | null>(
    fruits[0]?.fruit_id || fruits[0]?.id || 1
  );

  const reportId = result.prediction_id || result.id || 'PRED-REPORT';
  const timestamp = result.timestamp || result.created_at || new Date().toISOString();
  const imageUrl = result.image_url || result.preview_url || result.imageUrl || '';
  const totalFruits = result.fruit_count || fruits.length;

  // Quality Breakdown Calculation (Requirement 7)
  const qualityBreakdown = fruits.reduce((acc: Record<string, number>, f: any) => {
    const q = f.quality?.class || f.qualityCategory || 'Good';
    acc[q] = (acc[q] || 0) + 1;
    return acc;
  }, {});

  const breakdownString = Object.entries(qualityBreakdown)
    .map(([cls, count]) => `${count} ${cls}`)
    .join(', ') || `${totalFruits} Good`;

  // Batch Action Recommendation (Requirement 7)
  const hasSpoiled = (qualityBreakdown['Poor'] || 0) + (qualityBreakdown['Spoiled'] || 0) > 0;
  const hasModerate = (qualityBreakdown['Moderate'] || 0) + (qualityBreakdown['Fair'] || 0) > 0;
  let batchRecommendation = 'Approved for Retail Distribution (Grade A Fresh)';
  if (hasSpoiled) {
    batchRecommendation = 'Segregation Required: Remove spoiled fruit prior to shipment/processing';
  } else if (hasModerate) {
    batchRecommendation = 'Secondary Processing / Priority Immediate Sale (Consume within 2-3 days)';
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fruitvision_report_${reportId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-16 print:p-0 print:space-y-4">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 print:border-none print:p-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              REPORT #{reportId}
            </span>
            <span className="text-xs text-slate-400">
              {new Date(timestamp).toLocaleString()}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Fruit Quality Assessment Final Report
          </h2>
          <p className="text-xs text-slate-400">
            {result.filename || 'Fruit Sample Batch'} • {totalFruits} fruits localized & evaluated
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md transition-all cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Export PDF</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            title="Download structured JSON report"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={onStartNewAnalysis}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>New Analysis</span>
          </button>

          <button
            onClick={onBackToHistory}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* Requirement 7: Executive Summary Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Executive Batch Assessment Summary</span>
          </h3>
          <span className="text-xs text-amber-400 font-mono font-semibold">
            Review Demo Mode Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Fruits Analyzed */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
              Total Fruits Analyzed
            </span>
            <span className="text-2xl font-bold text-white font-mono">{totalFruits}</span>
            <p className="text-[11px] text-slate-400">YOLO Localization instances</p>
          </div>

          {/* Quality Breakdown */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
              Quality Breakdown
            </span>
            <span className="text-base font-bold text-emerald-400 font-sans block">
              {breakdownString}
            </span>
            <p className="text-[11px] text-slate-400">EfficientNet V2 classification</p>
          </div>

          {/* Batch Action Recommendation */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
              Batch Action Recommendation
            </span>
            <span className="text-xs font-bold text-teal-300 block leading-snug">
              {batchRecommendation}
            </span>
            <p className="text-[11px] text-slate-400">Automated quality gate</p>
          </div>
        </div>
      </div>

      {/* Stage 1: Interactive YOLO Detection Viewer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span>Stage 1: YOLO Detection & Interactive Bounding Boxes</span>
          </h3>
          <span className="text-xs text-slate-400">Click any box or list row to highlight</span>
        </div>

        <DetectionViewer
          imageUrl={imageUrl}
          fruits={fruits}
          selectedFruitId={selectedFruitId}
          onSelectFruit={(id) => setSelectedFruitId(id)}
          isDemo={true}
        />
      </div>

      {/* Stage 2: Individual Fruit Crops & EfficientNet V2 Quality Results */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-400" />
            <span>Stage 2: Individual Fruit Crops & EfficientNet V2 Quality</span>
          </h3>
        </div>

        <FruitCards
          fruits={fruits}
          selectedFruitId={selectedFruitId}
          onSelectFruit={(id) => setSelectedFruitId(id)}
          isDemo={true}
        />
      </div>
    </div>
  );
};
