import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Cpu,
  Layers,
  Crop,
  Database,
  XCircle,
  ChevronDown,
  Info,
  Sliders,
  Check,
} from 'lucide-react';
import { api, HealthStatus } from '../../services/api';
import { BENCHMARK_CASES, generateBenchmarkImage } from '../../utils/benchmarkData';
import { BenchmarkCase, FruitType } from '../../types';

interface AnalysisViewProps {
  onAnalysisComplete: (result: any) => void;
  initialBenchmark?: BenchmarkCase | null;
}

const SUPPORTED_FORMATS = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

// Pipeline Visual Steps for Requirement 8
const ARCHITECTURE_PIPELINE = [
  { id: 'img', label: 'Uploaded Image', desc: 'Input validation' },
  { id: 'yolo', label: 'YOLO Detection', desc: 'Object detection' },
  { id: 'loc', label: 'Fruit Localization', desc: 'Bounding box extraction' },
  { id: 'crop', label: 'Individual Fruit Cropping', desc: 'Region extraction' },
  { id: 'eff', label: 'EfficientNet V2', desc: 'Deep feature analysis' },
  { id: 'qual', label: 'Quality Classification', desc: 'Grade assessment' },
  { id: 'ind', label: 'Individual Results', desc: 'Multi-fruit cards' },
  { id: 'rep', label: 'Final Report', desc: 'Aggregated analytics' },
];

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  onAnalysisComplete,
  initialBenchmark,
}) => {
  const [activeMode, setActiveMode] = useState<'custom' | 'benchmark'>(
    initialBenchmark ? 'benchmark' : 'custom'
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Benchmark selection
  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkCase>(
    initialBenchmark || BENCHMARK_CASES[0]
  );

  // Model and System Health State
  const [health, setHealth] = useState<HealthStatus | null>(null);

  // Pipeline Execution State
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStage, setActiveStage] = useState<'idle' | 'step1' | 'step2' | 'complete'>('idle');
  const [activeSubStep, setActiveSubStep] = useState<string>('');
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    api.getHealth()
      .then((res) => {
        if (res.data) setHealth(res.data);
      })
      .catch(() => {});
  }, []);

  const handleFileSelect = (file: File) => {
    setFileError(null);
    setPipelineError(null);

    if (!SUPPORTED_FORMATS.includes(file.type)) {
      setFileError('Unsupported image format. Allowed formats: PNG, JPG, JPEG, WEBP.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setFileError('Image file is too large. Maximum size is 15MB.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError(null);
    setPipelineError(null);
    setIsProcessing(false);
    setActiveStage('idle');
    setActiveSubStep('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper to crop individual fruit regions from the uploaded image via HTML5 Canvas
  const cropFruitImage = (
    imageSrc: string,
    box: { x: number; y: number; width: number; height: number }
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const iw = img.naturalWidth || 800;
        const ih = img.naturalHeight || 600;
        const sx = Math.max(0, (box.x / 100) * iw);
        const sy = Math.max(0, (box.y / 100) * ih);
        const sw = Math.min(iw - sx, (box.width / 100) * iw);
        const sh = Math.min(ih - sy, (box.height / 100) * ih);

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(Math.round(sw), 80);
        canvas.height = Math.max(Math.round(sh), 80);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.88));
        } else {
          resolve(imageSrc);
        }
      };
      img.onerror = () => resolve(imageSrc);
      img.src = imageSrc;
    });
  };

  // Execute Two-Stage Analysis
  const handleExecuteAnalysis = async () => {
    setIsProcessing(true);
    setPipelineError(null);
    setActiveStage('step1');

    try {
      let fileToUpload: File | Blob;
      let isBenchmark = false;
      let benchmarkData: any[] = [];
      let baseImageSrc = previewUrl;

      if (activeMode === 'custom') {
        if (!selectedFile || !previewUrl) {
          throw new Error('Please select an image file to analyze.');
        }
        fileToUpload = selectedFile;
        baseImageSrc = previewUrl;
      } else {
        isBenchmark = true;
        const benchmarkDataUrl = generateBenchmarkImage(selectedBenchmark);
        baseImageSrc = benchmarkDataUrl;
        const res = await fetch(benchmarkDataUrl);
        const blob = await res.blob();
        fileToUpload = new File([blob], `${selectedBenchmark.id}.jpg`, { type: 'image/jpeg' });

        benchmarkData = selectedBenchmark.fruits.map((f) => ({
          fruit_type: f.fruitType,
          detection_confidence: 0.94,
          bounding_box: f.boundingBox,
          quality_class: f.qualityCategory,
          quality_confidence: Number((f.qualityScore / 100).toFixed(2)),
          probabilities: {
            [f.qualityCategory]: Number((f.qualityScore / 100).toFixed(2)),
          },
        }));
      }

      // STEP 1: YOLO Fruit Detection Animation
      setActiveStage('step1');
      setActiveSubStep('Detecting fruits');
      await new Promise((r) => setTimeout(r, 450));
      setActiveSubStep('Localizing fruits');
      await new Promise((r) => setTimeout(r, 450));
      setActiveSubStep('Creating bounding boxes');
      await new Promise((r) => setTimeout(r, 450));
      setActiveSubStep('Cropping individual fruits');
      await new Promise((r) => setTimeout(r, 450));

      // STEP 2: EfficientNet V2 Quality Analysis Animation
      setActiveStage('step2');
      setActiveSubStep('Analyzing each fruit crop');
      await new Promise((r) => setTimeout(r, 500));
      setActiveSubStep('Quality classification');
      await new Promise((r) => setTimeout(r, 500));
      setActiveSubStep('Generating individual fruit results');
      await new Promise((r) => setTimeout(r, 450));

      // Call Backend API
      const res = await api.predict(fileToUpload, {
        isBenchmark,
        benchmarkData,
      });

      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'Pipeline execution failed.');
      }

      // Generate actual canvas crops from uploaded image for each fruit
      const resultData = { ...res.data };
      if (baseImageSrc && Array.isArray(resultData.fruits)) {
        const fruitsWithCrops = await Promise.all(
          resultData.fruits.map(async (fruit: any) => {
            const box = fruit.bounding_box || fruit.boundingBox;
            if (box && typeof box.x === 'number' && typeof box.width === 'number') {
              try {
                const cropUrl = await cropFruitImage(baseImageSrc, box);
                return { ...fruit, crop_image_url: cropUrl, cropDataUrl: cropUrl };
              } catch {
                return fruit;
              }
            }
            return fruit;
          })
        );
        resultData.fruits = fruitsWithCrops;
      }

      // Ensure base image URL is attached
      if (baseImageSrc) {
        resultData.image_url = baseImageSrc;
        resultData.imageUrl = baseImageSrc;
      }

      // Step Complete
      setActiveStage('complete');
      setActiveSubStep('Analysis Complete');
      await new Promise((r) => setTimeout(r, 400));

      // Deliver to parent
      onAnalysisComplete(resultData);
    } catch (err: any) {
      const msg = err.message || 'Analysis could not be completed.';
      setPipelineError(msg);
      setActiveStage('idle');
      setActiveSubStep('');
    } finally {
      setIsProcessing(false);
    }
  };

  const yoloConfigured = health?.models?.yolo === 'configured';

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Cpu className="w-3.5 h-3.5" />
          <span>FruitVision DL • Pipeline Execution</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Fruit Quality Analysis Engine
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
          Upload an image containing single or multiple fruits to execute the two-stage deep learning pipeline.
        </p>
      </div>

      {/* REVIEW DEMO MODE Banner (Requirement 1) */}
      <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 text-slate-200 text-xs flex items-start gap-3 shadow-lg">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
          <Cpu className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[11px] tracking-wider uppercase">
              REVIEW DEMO MODE
            </span>
            <span className="text-[11px] text-slate-400 font-medium">B.Tech Project Review</span>
          </div>
          <p className="text-white font-medium text-sm pt-0.5">
            Model weights are not currently configured. This mode demonstrates the complete two-stage analysis workflow.
          </p>
          <p className="text-slate-400 text-xs leading-relaxed">
            Demo mode is active because trained YOLO and EfficientNet V2 model weights are not configured. Results shown are sample outputs for workflow demonstration.
          </p>
        </div>
      </div>

      {/* Visual Pipeline Architecture Diagram (Requirement 8) */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Two-Stage Deep Learning Pipeline Architecture</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Stage 1: YOLO • Stage 2: EfficientNet V2
          </span>
        </div>

        {/* Pipeline Nodes Flow */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2">
          {ARCHITECTURE_PIPELINE.map((item, idx) => {
            let isCurrent = false;
            let isDone = false;

            if (isProcessing) {
              if (activeStage === 'step1') {
                if (idx <= 3) isCurrent = true;
              } else if (activeStage === 'step2') {
                if (idx <= 3) isDone = true;
                if (idx >= 4 && idx <= 6) isCurrent = true;
              } else if (activeStage === 'complete') {
                isDone = true;
              }
            }

            return (
              <div
                key={item.id}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50 shadow-sm'
                    : isDone
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    0{idx + 1}
                  </span>
                  {isCurrent ? (
                    <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
                  ) : isDone ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  )}
                </div>
                <p className="text-xs font-bold leading-snug">{item.label}</p>
                <p className="text-[9px] text-slate-400 mt-0.5 truncate">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => {
            setActiveMode('custom');
            setPipelineError(null);
          }}
          className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeMode === 'custom'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Custom Image Upload</span>
        </button>

        <button
          onClick={() => {
            setActiveMode('benchmark');
            setPipelineError(null);
          }}
          className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeMode === 'benchmark'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Verified Benchmark Datasets</span>
        </button>
      </div>

      {/* Main Mode Content */}
      {activeMode === 'custom' ? (
        /* Custom Upload Mode */
        <div className="space-y-6">
          {!previewUrl ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-10 sm:p-16 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-4 ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-500/5'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Upload className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Drag and drop fruit image here, or click to browse
                </h3>
                <p className="text-xs text-slate-400">
                  Supports PNG, JPG, JPEG, and WEBP formats up to 15MB.
                </p>
                <p className="text-[11px] text-slate-400">
                  Supports single fruit, two fruits, or complex multi-fruit scenes.
                </p>
              </div>

              {fileError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}
            </div>
          ) : (
            /* Uploaded Image Preview Card - Remains visible throughout analysis (Requirement 2) */
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                      {selectedFile?.name || 'Selected Fruit Image'}
                    </h4>
                    <span className="text-xs text-slate-400 font-mono">
                      {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : ''} • {selectedFile?.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Replace</span>
                  </button>
                  <button
                    onClick={handleRemoveImage}
                    disabled={isProcessing}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition-all border border-rose-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {/* Preview Image display - ALWAYS VISIBLE THROUGHOUT ANALYSIS */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center max-h-96">
                <img
                  src={previewUrl}
                  alt="Fruit preview"
                  className="max-h-96 w-auto object-contain"
                />

                {isProcessing && (
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center">
                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 text-center space-y-2 shadow-2xl">
                      <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
                      <p className="text-sm font-bold text-white">Analyzing Image...</p>
                      <p className="text-xs text-emerald-400 font-mono">{activeSubStep}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleExecuteAnalysis}
                  disabled={isProcessing}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Execute Two-Stage Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Benchmark Evaluation Mode */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BENCHMARK_CASES.map((bench) => {
              const isSelected = selectedBenchmark.id === bench.id;
              return (
                <div
                  key={bench.id}
                  onClick={() => setSelectedBenchmark(bench)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        {bench.badge}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {bench.fruits.length} Fruits
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{bench.title}</h4>
                    <p className="text-xs text-slate-400">{bench.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                    <span>{bench.category}</span>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-emerald-500 bg-emerald-500 text-black' : 'border-slate-600'
                    }`}>
                      {isSelected && '✓'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Active Benchmark: {selectedBenchmark.title}
                </h4>
                <p className="text-xs text-slate-400">
                  Ground-truth test case containing {selectedBenchmark.fruits.length} fruit instances for validating the multi-fruit cropping pipeline and MongoDB storage.
                </p>
              </div>

              <button
                onClick={handleExecuteAnalysis}
                disabled={isProcessing}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Cpu className="w-4 h-4" />
                <span>Run Benchmark Evaluation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two-Stage Animated Execution Visualizer (Requirement 3) */}
      {isProcessing && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Executing Two-Stage Deep Learning Pipeline</span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {activeStage === 'step1' ? 'Stage 1 of 2' : activeStage === 'step2' ? 'Stage 2 of 2' : 'Completed'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* STEP 1: YOLO Fruit Detection */}
            <div
              className={`p-4 rounded-xl border transition-all space-y-3 ${
                activeStage === 'step1'
                  ? 'bg-slate-800/80 border-emerald-500 ring-1 ring-emerald-500/40'
                  : activeStage === 'step2' || activeStage === 'complete'
                  ? 'bg-emerald-950/10 border-emerald-500/30'
                  : 'bg-slate-950/40 border-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold">
                    STEP 1
                  </span>
                  <h4 className="text-sm font-bold text-white">YOLO Fruit Detection</h4>
                </div>
                {activeStage === 'step1' ? (
                  <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                ) : activeStage === 'step2' || activeStage === 'complete' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : null}
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className={`flex items-center gap-2 ${activeSubStep === 'Detecting fruits' ? 'text-emerald-300 font-bold' : ''}`}>
                  <span>→ Detecting fruits</span>
                </div>
                <div className={`flex items-center gap-2 ${activeSubStep === 'Localizing fruits' ? 'text-emerald-300 font-bold' : ''}`}>
                  <span>→ Localizing fruits</span>
                </div>
                <div className={`flex items-center gap-2 ${activeSubStep === 'Creating bounding boxes' ? 'text-emerald-300 font-bold' : ''}`}>
                  <span>→ Creating bounding boxes</span>
                </div>
                <div className={`flex items-center gap-2 ${activeSubStep === 'Cropping individual fruits' ? 'text-emerald-300 font-bold' : ''}`}>
                  <span>→ Cropping individual fruits</span>
                </div>
              </div>
            </div>

            {/* STEP 2: EfficientNet V2 Quality Analysis */}
            <div
              className={`p-4 rounded-xl border transition-all space-y-3 ${
                activeStage === 'step2'
                  ? 'bg-slate-800/80 border-emerald-500 ring-1 ring-emerald-500/40'
                  : activeStage === 'complete'
                  ? 'bg-emerald-950/10 border-emerald-500/30'
                  : 'bg-slate-950/40 border-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 font-mono text-xs font-bold">
                    STEP 2
                  </span>
                  <h4 className="text-sm font-bold text-white">EfficientNet V2 Quality Analysis</h4>
                </div>
                {activeStage === 'step2' ? (
                  <RefreshCw className="w-4 h-4 text-teal-400 animate-spin" />
                ) : activeStage === 'complete' ? (
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                ) : null}
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className={`flex items-center gap-2 ${activeSubStep === 'Analyzing each fruit crop' ? 'text-teal-300 font-bold' : ''}`}>
                  <span>→ Analyzing each fruit crop</span>
                </div>
                <div className={`flex items-center gap-2 ${activeSubStep === 'Quality classification' ? 'text-teal-300 font-bold' : ''}`}>
                  <span>→ Quality classification</span>
                </div>
                <div className={`flex items-center gap-2 ${activeSubStep === 'Generating individual fruit results' ? 'text-teal-300 font-bold' : ''}`}>
                  <span>→ Generating individual fruit results</span>
                </div>
              </div>
            </div>
          </div>

          {activeStage === 'complete' && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Analysis Complete</span>
            </div>
          )}
        </div>
      )}

      {/* Pipeline Error Display */}
      {pipelineError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
          <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-sm text-rose-200">
              Pipeline Execution Error
            </span>
            <p className="leading-relaxed text-rose-300/90">{pipelineError}</p>
          </div>
        </div>
      )}
    </div>
  );
};
