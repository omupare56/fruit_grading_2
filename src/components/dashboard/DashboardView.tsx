import React, { useEffect, useState } from 'react';
import {
  ScanLine,
  History,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Database,
  Activity,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { api, SystemStats, HealthStatus } from '../../services/api';
import { BENCHMARK_CASES } from '../../utils/benchmarkData';
import { BenchmarkCase } from '../../types';

interface DashboardViewProps {
  onStartAnalysis: () => void;
  onViewHistory: () => void;
  onSelectBenchmark: (benchmark: BenchmarkCase) => void;
  onViewResult: (result: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStartAnalysis,
  onViewHistory,
  onSelectBenchmark,
  onViewResult,
}) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const [statsRes, healthRes] = await Promise.all([
          api.getStats().catch(() => ({ success: true, data: null })),
          api.getHealth().catch(() => ({ success: true, data: null })),
        ]);

        if (isMounted) {
          if (statsRes.data) {
            setStats(statsRes.data);
          }
          if (healthRes.data) {
            setHealth(healthRes.data);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message || 'Failed to connect to backend.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalAnalyses = stats?.total_analyses ?? (health?.demo_mode ? 3 : 0);
  const totalFruits = stats?.total_fruits_detected ?? (health?.demo_mode ? 8 : 0);
  const goodQuality = stats?.quality_distribution?.Good ?? (health?.demo_mode ? 5 : 0);
  const moderateQuality = stats?.quality_distribution?.Moderate ?? (health?.demo_mode ? 3 : 0);
  const isEmpty = !stats || stats?.is_empty;

  const yoloStatus = health?.models?.yolo === 'configured' 
    ? 'Configured' 
    : 'Not Configured (Demo Mode Active)';
  const effStatus = health?.models?.efficientnet_v2 === 'configured' 
    ? 'Configured' 
    : 'Not Configured (Demo Mode Active)';
  const mongoStatus = health?.database === 'connected' 
    ? 'Connected' 
    : 'Not Connected';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>FruitVision DL • B.Tech Final Year Academic Project</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Intelligent Vision-Based Fruit Quality Assessment
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Two-stage deep learning pipeline combining YOLO fruit localization, individual fruit cropping, and EfficientNet V2 quality grading.
            </p>

            {/* Health & Status Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                health?.api === 'healthy' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}>
                <Activity className="w-3 h-3" />
                <span>REST API: {health?.api || 'Operational'}</span>
              </span>

              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                health?.database === 'connected' ? 'bg-teal-500/10 text-teal-300 border-teal-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                <Database className="w-3 h-3" />
                <span>MongoDB: {mongoStatus}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Mode: Review Demo Mode</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="dash-start-analysis-btn"
              onClick={onStartAnalysis}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
            >
              <ScanLine className="w-4 h-4" />
              <span>Start Analysis</span>
            </button>
            <button
              id="dash-view-history-btn"
              onClick={onViewHistory}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <History className="w-4 h-4 text-slate-400" />
              <span>View History</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid (Requirement 9) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Analyses */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Analyses</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {totalAnalyses}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Review session records</p>
        </div>

        {/* Fruits Detected */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Fruits Detected</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <ScanLine className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {totalFruits}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">YOLO detected instances</p>
        </div>

        {/* Good Quality */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Good Quality</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">
            {goodQuality}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">EfficientNet V2 classified</p>
        </div>

        {/* Moderate Quality */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Moderate Quality</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-400 tracking-tight">
            {moderateQuality}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Consume soon category</p>
        </div>
      </div>

      {/* Model Status Section (Requirement 9) */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Model Status</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Academic Project Review Mode</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              YOLO Detection Model
            </span>
            <p className="text-xs font-bold text-amber-400">
              {yoloStatus}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">Expected: models/yolo/best.pt</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              EfficientNet V2 Model
            </span>
            <p className="text-xs font-bold text-amber-400">
              {effStatus}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">Expected: models/efficientnet/efficientnet_v2.pth</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Database Connection
            </span>
            <p className={`text-xs font-bold ${health?.database === 'connected' ? 'text-emerald-400' : 'text-slate-400'}`}>
              MongoDB: {mongoStatus}
            </p>
            <p className="text-[11px] text-slate-500">
              {health?.database === 'connected' ? 'MongoDB Atlas Cluster Connected' : 'Demo Session In-Memory Fallback'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Database Inspection / Empty State Handling */}
      {isEmpty ? (
        <div className="p-10 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <Database className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No analysis data available yet.</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              The predictions collection in MongoDB has no records yet. Upload an image or select a benchmark dataset below to run your first evaluation and populate the database.
            </p>
          </div>
          <button
            onClick={onStartAnalysis}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-all"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Launch First Analysis</span>
          </button>
        </div>
      ) : (
        /* Real Distribution & Metrics */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quality Distribution */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Quality Distribution (EfficientNet V2)</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">{totalFruits} fruits</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(stats?.quality_distribution || {}).map(([category, countVal]) => {
                const count = Number(countVal) || 0;
                const pct = totalFruits > 0 ? Math.round((count / totalFruits) * 100) : 0;
                const colors: Record<string, string> = {
                  Excellent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                  Good: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
                  Fair: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                  Poor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                };
                return (
                  <div
                    key={category}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between ${colors[category] || 'text-slate-300 bg-slate-800/50 border-slate-700'}`}
                  >
                    <span className="text-xs font-semibold">{category}</span>
                    <div className="pt-2">
                      <span className="text-xl font-bold">{count}</span>
                      <span className="text-[10px] ml-1 opacity-70">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fruit Distribution */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-400" />
                <span>Fruit Class Distribution</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {Object.keys(stats?.fruit_distribution || {}).length} classes
              </span>
            </div>

            <div className="space-y-2">
              {Object.entries(stats?.fruit_distribution || {}).map(([fruit, countVal]) => {
                const count = Number(countVal) || 0;
                const pct = totalFruits > 0 ? Math.round((count / totalFruits) * 100) : 0;
                return (
                  <div key={fruit} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-300">{fruit}</span>
                      <span className="text-slate-400 font-mono">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Benchmark Datasets Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Pre-Annotated Benchmark Datasets</h3>
            <p className="text-xs text-slate-400">
              Verified ground-truth multi-fruit test cases for pipeline validation and B.Tech viva testing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BENCHMARK_CASES.map((bench) => (
            <div
              key={bench.id}
              className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
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
                <p className="text-xs text-slate-400 line-clamp-2">{bench.description}</p>
              </div>

              <button
                onClick={() => onSelectBenchmark(bench)}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <span>Evaluate Benchmark Case</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Analyses from MongoDB */}
      {stats?.recent_analyses && stats.recent_analyses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Recent Analyses from Database</h3>
            <button
              onClick={onViewHistory}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80 rounded-xl bg-slate-900/60 border border-slate-800/80 overflow-hidden">
            {stats.recent_analyses.map((rec) => (
              <div
                key={rec.prediction_id}
                onClick={() => onViewResult(rec)}
                className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-emerald-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                      {rec.filename || 'Fruit Analysis'}
                    </h5>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(rec.timestamp || rec.created_at).toLocaleString()} • {rec.fruit_count} fruits detected
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {rec.prediction_id}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
