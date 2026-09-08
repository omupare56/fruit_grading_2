import React from 'react';
import {
  Cpu,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Crop,
  Sparkles,
  BarChart3,
  Database,
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  Play,
  LogIn,
} from 'lucide-react';

interface LandingViewProps {
  onStartAnalysis: () => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  onExploreViva: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onStartAnalysis,
  onOpenLogin,
  onOpenSignup,
  onExploreViva,
}) => {
  return (
    <div className="space-y-16 pb-12">
      {/* Hero Presentation Header */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 p-8 sm:p-14">
        {/* Glow backdrop decoration */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          {/* Academic Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>B.Tech IT Final Year Capstone Project</span>
          </div>

          {/* Project Brand & Title */}
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-bold tracking-widest text-emerald-400 uppercase">
              FruitVision DL
            </h2>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Intelligent Vision-Based Fruit Quality Assessment System
            </h1>
          </div>

          {/* Subtitle with Two-Stage Pipeline */}
          <div className="pt-2 max-w-2xl mx-auto">
            <p className="text-slate-300 text-base sm:text-lg font-medium">
              Two-Stage Deep Learning Pipeline
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-200">
              <span className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-400" />
                YOLO Detection
              </span>
              <span className="text-emerald-400 font-mono font-bold text-base">→</span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center gap-1.5">
                <Crop className="w-4 h-4 text-teal-400" />
                Individual Fruit Cropping
              </span>
              <span className="text-emerald-400 font-mono font-bold text-base">→</span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" />
                EfficientNet V2 Quality Assessment
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onOpenSignup}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-950 flex items-center gap-2 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onStartAnalysis}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition-all border border-slate-700 flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Try Analysis</span>
            </button>
            <button
              onClick={onOpenLogin}
              className="px-6 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-semibold transition-all border border-slate-800 flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
          </div>
        </div>
      </section>

      {/* Two-Stage Architectural Breakdown */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Architecture Blueprint
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How The Pipeline Operates
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Unlike simplistic single-network classifiers, our decoupled design guarantees that individual fruits in a multi-fruit basket are localized first, isolated independently, and then graded with high precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stage 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">Stage 1</span>
              <h3 className="text-lg font-bold text-white">YOLO Localization</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Responsible strictly for fruit detection, bounding-box generation, and fruit class localization. It handles arbitrary multi-fruit images without predicting quality grades.
            </p>
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-fruit simultaneous detection</span>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Crop className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-teal-400 tracking-wider uppercase">Stage 2</span>
              <h3 className="text-lg font-bold text-white">Individual Fruit Cropping</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Each bounding box is clamped to image boundaries and extracted into an isolated fruit tensor. The full multi-fruit image is never passed to the classifier, preventing background clutter.
            </p>
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-teal-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Normalized 224x224 RGB crop pipeline</span>
            </div>
          </div>

          {/* Stage 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-cyan-400 tracking-wider uppercase">Stage 3</span>
              <h3 className="text-lg font-bold text-white">EfficientNet V2 Quality Scoring</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Processes the isolated fruit crop through fused-MBConv feature extractors. Computes categorical quality probabilities (Excellent, Good, Fair, Poor) and domain-specific recommendations.
            </p>
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-cyan-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Configurable 4-class quality head</span>
            </div>
          </div>
        </div>
      </section>

      {/* Production Tech Stack */}
      <section className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Production-Grade Full-Stack Specification</h3>
            <p className="text-xs text-slate-400">
              Complies with B.Tech IT viva standards and Vercel serverless deployment specifications.
            </p>
          </div>
          <button
            onClick={onExploreViva}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-2"
          >
            <span>View Viva Voce Defense Guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Frontend</span>
            <p className="text-sm font-bold text-white">React 19 + Vite</p>
            <p className="text-[11px] text-slate-400">Tailwind CSS + HTML5 Canvas</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Backend REST API</span>
            <p className="text-sm font-bold text-white">Python Flask</p>
            <p className="text-[11px] text-slate-400">Vercel Serverless WSGI</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Database</span>
            <p className="text-sm font-bold text-white">MongoDB Atlas</p>
            <p className="text-[11px] text-slate-400">fruit_quality_db (Users & Preds)</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Security</span>
            <p className="text-sm font-bold text-white">JWT + Bcrypt</p>
            <p className="text-[11px] text-slate-400">Salted password hashes</p>
          </div>
        </div>
      </section>
    </div>
  );
};
