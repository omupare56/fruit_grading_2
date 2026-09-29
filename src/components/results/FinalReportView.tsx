import React, { useState, useEffect } from 'react';
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
  ZoomIn,
  Eye,
  Scan,
  Activity,
  Award,
  Target,
  ShieldCheck,
} from 'lucide-react';
import { DetectionViewer } from '../detection/DetectionViewer';
import { FruitCards } from './FruitCards';

interface FinalReportViewProps {
  result: any;
  onStartNewAnalysis: () => void;
  onBackToHistory: () => void;
}

// Animated confidence bar
const ConfidenceBar: React.FC<{ value: number; color?: string }> = ({ value, color = 'bg-emerald-500' }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.round(value * 100)), 120);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

// Analysis view card — same image, different CSS treatment
const AnalysisViewCard: React.FC<{
  label: string;
  icon: React.ReactNode;
  imageUrl: string;
  tag: string;
  filterStyle?: string;
  overlayClass?: string;
  delay?: number;
}> = ({ label, icon, imageUrl, tag, filterStyle = '', overlayClass = '', delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 group transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={label}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${filterStyle}`}
        />
        {/* Overlay */}
        {overlayClass && <div className={`absolute inset-0 ${overlayClass}`} />}

        {/* Scan line animation for AI Detection view */}
        {label === 'AI Detection View' && (
          <div
            className="absolute left-0 right-0 h-0.5 bg-emerald-400/60 shadow-[0_0_12px_3px_rgba(52,211,153,0.5)]"
            style={{ animation: 'scanline 2.5s ease-in-out infinite', top: '40%' }}
          />
        )}

        {/* Corner focus markers for Detailed Inspection */}
        {label === 'Detailed Inspection View' && (
          <>
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-teal-400/80 rounded-tl" />
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-teal-400/80 rounded-tr" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-teal-400/80 rounded-bl" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-teal-400/80 rounded-br" />
          </>
        )}

        {/* Tag */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950/80 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
            {tag}
          </span>
        </div>
      </div>

      {/* Label */}
      <div className="flex items-center gap-2 p-3 border-t border-slate-800">
        <span className="text-emerald-400">{icon}</span>
        <span className="text-xs font-semibold text-slate-200">{label}</span>
      </div>
    </div>
  );
};

export const FinalReportView: React.FC<FinalReportViewProps> = ({
  result,
  onStartNewAnalysis,
  onBackToHistory,
}) => {
  const fruits: any[] = result.fruits || [];
  const [selectedFruitId, setSelectedFruitId] = useState<string | number | null>(
    fruits[0]?.fruit_id || fruits[0]?.id || 1
  );
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const reportId = result.prediction_id || result.id || 'PRED-REPORT';
  const timestamp = result.timestamp || result.created_at || new Date().toISOString();
  const imageUrl = result.image_url || result.preview_url || result.imageUrl || '';
  const totalFruits = result.fruit_count || fruits.length;

  // Primary fruit data (first / only fruit)
  const primaryFruit = fruits[0] || {};
  const primaryType = primaryFruit.fruit_type || primaryFruit.fruitType || 'Unknown/Low Confidence';
  const primaryQuality = primaryFruit.quality?.class || primaryFruit.qualityCategory || '—';
  const primaryDetectionConf = primaryFruit.detection_confidence ?? primaryFruit.confidence ?? null;
  const primaryQualityConf = primaryFruit.quality?.confidence ?? null;
  const primaryDefects: string[] = primaryFruit.defects || primaryFruit.detected_defects || [];

  const qualityColor: Record<string, string> = {
    Excellent: 'text-emerald-400',
    Good: 'text-teal-300',
    Fair: 'text-amber-300',
    Moderate: 'text-amber-300',
    Poor: 'text-rose-400',
    Spoiled: 'text-rose-500',
  };

  const qualityBg: Record<string, string> = {
    Excellent: 'bg-emerald-500/10 border-emerald-500/30',
    Good: 'bg-teal-500/10 border-teal-500/30',
    Fair: 'bg-amber-500/10 border-amber-500/30',
    Moderate: 'bg-amber-500/10 border-amber-500/30',
    Poor: 'bg-rose-500/10 border-rose-500/30',
    Spoiled: 'bg-rose-600/10 border-rose-600/30',
  };

  // Quality Breakdown
  const qualityBreakdown = fruits.reduce((acc: Record<string, number>, f: any) => {
    const q = f.quality?.class || f.qualityCategory || 'Good';
    acc[q] = (acc[q] || 0) + 1;
    return acc;
  }, {});

  const breakdownString =
    Object.entries(qualityBreakdown)
      .map(([cls, count]) => `${count} ${cls}`)
      .join(', ') || `${totalFruits} Good`;

  const hasSpoiled = (qualityBreakdown['Poor'] || 0) + (qualityBreakdown['Spoiled'] || 0) > 0;
  const hasModerate = (qualityBreakdown['Moderate'] || 0) + (qualityBreakdown['Fair'] || 0) > 0;
  let batchRecommendation = 'Approved for Retail Distribution (Grade A Fresh)';
  if (hasSpoiled) {
    batchRecommendation = 'Segregation Required: Remove spoiled fruit prior to shipment/processing';
  } else if (hasModerate) {
    batchRecommendation = 'Secondary Processing / Priority Immediate Sale (Consume within 2-3 days)';
  }

  const handlePrint = () => window.print();

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
    <>
      {/* Scan-line keyframe */}
      <style>{`
        @keyframes scanline {
          0%   { top: 10%; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="space-y-8 pb-16 print:p-0 print:space-y-4">

        {/* ── Header & Action Bar ─────────────────────────────────────── */}
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

        {/* ── PRIMARY RESULT HERO ─────────────────────────────────────── */}
        <div
          className={`rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 transition-all duration-700 ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {/* Completed badge */}
          <div className="flex items-center gap-2 px-6 pt-5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              AI Analysis Complete
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left: Large image */}
            <div className="relative p-6">
              {imageUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl bg-slate-950 group">
                  <img
                    src={imageUrl}
                    alt="Analyzed fruit"
                    className="w-full max-h-72 object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Subtle scan overlay */}
                  <div
                    className="absolute left-0 right-0 h-px bg-emerald-400/50 shadow-[0_0_8px_2px_rgba(52,211,153,0.4)]"
                    style={{ animation: 'scanline 3s ease-in-out infinite' }}
                  />
                  {/* Detection dots for each detected fruit */}
                  {fruits.map((f, i) => {
                    const box = f.bounding_box || f.boundingBox;
                    if (!box) return null;
                    const cx = box.x != null ? box.x + box.width / 2 : 50;
                    const cy = box.y != null ? box.y + box.height / 2 : 50;
                    return (
                      <div
                        key={i}
                        className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 z-10"
                        style={{ left: `${cx}%`, top: `${cy}%` }}
                      >
                        <div className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow" />
                        <div
                          className="absolute inset-0 rounded-full bg-emerald-400"
                          style={{ animation: 'pulse-ring 1.8s ease-out infinite' }}
                        />
                      </div>
                    );
                  })}
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950/80 text-emerald-300 border border-emerald-500/30">
                      IMAGE ANALYSIS
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-64 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-sm">
                  No image available
                </div>
              )}
            </div>

            {/* Right: Primary result hierarchy */}
            <div className="flex flex-col justify-center gap-5 px-6 pb-6 lg:pt-6">

              {/* FRUIT DETECTED */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Object Identified
                </p>
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    {primaryType}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {totalFruits} detected
                  </span>
                </div>
                {primaryDetectionConf != null && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Detection Confidence</span>
                      <span className="font-mono text-emerald-300">
                        {Math.round(primaryDetectionConf * 100)}%
                      </span>
                    </div>
                    <ConfidenceBar value={primaryDetectionConf} color="bg-emerald-500" />
                  </div>
                )}
              </div>

              {/* QUALITY GRADE */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Quality Grade
                </p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${qualityBg[primaryQuality] || 'bg-slate-800 border-slate-700'}`}>
                  <Award className={`w-5 h-5 ${qualityColor[primaryQuality] || 'text-slate-300'}`} />
                  <span className={`text-2xl font-extrabold ${qualityColor[primaryQuality] || 'text-white'}`}>
                    {primaryQuality}
                  </span>
                </div>
                {primaryQualityConf != null && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Quality Assessment Confidence</span>
                      <span className="font-mono text-teal-300">
                        {Math.round(primaryQualityConf * 100)}%
                      </span>
                    </div>
                    <ConfidenceBar value={primaryQualityConf} color="bg-teal-400" />
                  </div>
                )}
              </div>

              {/* DEFECTS / VISUAL FINDINGS */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Defect Inspection
                </p>
                {primaryDefects.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {primaryDefects.map((d, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/25"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>No defects detected</span>
                  </div>
                )}
              </div>

              {/* Batch recommendation */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px]">
                <span className="text-slate-400 block mb-0.5 uppercase tracking-wider font-semibold text-[10px]">
                  Batch Recommendation
                </span>
                <span className="text-teal-300 font-semibold">{batchRecommendation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── ANALYSIS PROCESS STEPS ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Image Analysis', icon: <Scan className="w-4 h-4" />, status: 'complete' },
            { label: 'Fruit Identification', icon: <Target className="w-4 h-4" />, status: 'complete' },
            { label: 'Quality Assessment', icon: <Activity className="w-4 h-4" />, status: 'complete' },
            { label: 'Defect Inspection', icon: <ShieldAlert className="w-4 h-4" />, status: 'complete' },
          ].map((step, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-900 border border-emerald-500/20 text-center"
              style={{ animation: `fadeInUp 0.5s ease-out ${i * 100 + 200}ms both` }}
            >
              <span className="text-emerald-400">{step.icon}</span>
              <span className="text-[11px] font-semibold text-slate-300 leading-snug">{step.label}</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <CheckCircle2 className="w-3 h-3" /> Done
              </span>
            </div>
          ))}
        </div>

        {/* ── MULTI-ANGLE ANALYSIS VIEWS ──────────────────────────────── */}
        {imageUrl && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Analysis Views
              </h3>
              <span className="text-[11px] text-slate-500 font-normal normal-case tracking-normal">
                — visual analysis of uploaded image
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <AnalysisViewCard
                label="Original View"
                icon={<Eye className="w-3.5 h-3.5" />}
                imageUrl={imageUrl}
                tag="ORIGINAL"
                delay={100}
              />
              <AnalysisViewCard
                label="AI Detection View"
                icon={<Cpu className="w-3.5 h-3.5" />}
                imageUrl={imageUrl}
                tag="AI DETECTION"
                filterStyle="brightness-110 contrast-110 saturate-110"
                overlayClass="bg-emerald-950/20"
                delay={250}
              />
              <AnalysisViewCard
                label="Detailed Inspection View"
                icon={<ZoomIn className="w-3.5 h-3.5" />}
                imageUrl={imageUrl}
                tag="INSPECTION"
                filterStyle="brightness-105 saturate-120 contrast-105"
                overlayClass="bg-teal-950/15"
                delay={400}
              />
            </div>
          </div>
        )}

        {/* ── SUMMARY METRICS ─────────────────────────────────────────── */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Analysis Summary & Quality Gate</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                Total Fruits Analyzed
              </span>
              <span className="text-2xl font-bold text-white font-mono">{totalFruits}</span>
              <p className="text-[11px] text-slate-400">YOLO Localization instances</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                Overall Assessment
              </span>
              <span className="text-sm font-bold text-teal-300 block leading-snug">
                {batchRecommendation}
              </span>
              <p className="text-[11px] text-slate-400">Automated quality decision</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                Quality Breakdown
              </span>
              <span className="text-base font-bold text-emerald-400 font-sans block">
                {breakdownString}
              </span>
              <p className="text-[11px] text-slate-400">EfficientNet V2 classification</p>
            </div>
          </div>
        </div>

        {/* ── INDIVIDUAL RESULTS ──────────────────────────────────────── */}
        <div className="border-t border-slate-800 pt-6">
          <h3 className="text-xl font-extrabold text-white tracking-tight mb-4 flex items-center gap-2">
            <span>Individual Results</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {totalFruits} detected fruits
            </span>
          </h3>
        </div>

        {/* Stage 1: YOLO Detection */}
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
            isDemo={false}
          />
        </div>

        {/* Stage 2: EfficientNet Quality */}
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
            isDemo={false}
          />
        </div>
      </div>
    </>
  );
};
