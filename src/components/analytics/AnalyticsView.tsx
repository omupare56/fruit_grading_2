import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ScanLine,
  Activity,
  Database,
  RefreshCw,
} from 'lucide-react';
import { api, SystemStats } from '../../services/api';

interface AnalyticsViewProps {
  onStartNewAnalysis: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  onStartNewAnalysis,
}) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.getStats();
      if (res.data) {
        setStats(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch analytics from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const totalFruits = stats?.total_fruits_detected || 0;
  const totalAnalyses = stats?.total_analyses || 0;
  const avgConf = stats?.average_quality_confidence || 0;
  const isEmpty = stats?.is_empty || totalAnalyses === 0;

  const fruitDistribution = stats?.fruit_distribution || {};
  const qualityDistribution = stats?.quality_distribution || {};

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>Inspection & Quality Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time analytics aggregated directly from MongoDB Atlas collection
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadStats}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onStartNewAnalysis}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-colors cursor-pointer"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>New Analysis</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
          <p className="text-xs text-slate-400">Querying database aggregation pipeline...</p>
        </div>
      )}

      {/* Error state */}
      {errorMsg && !loading && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={loadStats} className="underline font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Empty State Requirement: 'No analysis data available yet.' */}
      {!loading && !errorMsg && isEmpty && (
        <div className="p-16 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <Database className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              No analysis data available yet.
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No prediction sessions have been recorded in the database yet. Run an analysis or benchmark test to generate real distribution metrics.
            </p>
          </div>
          <button
            onClick={onStartNewAnalysis}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-all"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Start First Analysis</span>
          </button>
        </div>
      )}

      {/* Populated Analytics */}
      {!loading && !isEmpty && (
        <>
          {/* KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Total Analyses
              </span>
              <div className="text-3xl font-extrabold text-white mt-1">
                {totalAnalyses}
              </div>
              <span className="text-[11px] text-slate-400">MongoDB predictions</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Fruits Evaluated
              </span>
              <div className="text-3xl font-extrabold text-teal-400 mt-1">
                {totalFruits}
              </div>
              <span className="text-[11px] text-slate-400">Multi-fruit instances</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Average Confidence
              </span>
              <div className="text-3xl font-extrabold text-emerald-400 mt-1">
                {(avgConf * 100).toFixed(1)}%
              </div>
              <span className="text-[11px] text-slate-400">EfficientNet V2 mean score</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Fruit Classes
              </span>
              <div className="text-3xl font-extrabold text-cyan-400 mt-1">
                {Object.keys(fruitDistribution).length}
              </div>
              <span className="text-[11px] text-slate-400">Distinct categories</span>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quality Distribution Chart */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Quality Distribution</h3>
                  <p className="text-xs text-slate-400">
                    EfficientNet V2 classification distribution
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">{totalFruits} items</span>
              </div>

              <div className="space-y-4">
                {Object.entries(qualityDistribution).map(([cat, countVal]) => {
                  const count = Number(countVal) || 0;
                  const pct = totalFruits > 0 ? (count / totalFruits) * 100 : 0;
                  const barColors: Record<string, string> = {
                    Excellent: 'bg-emerald-500',
                    Good: 'bg-teal-500',
                    Fair: 'bg-amber-500',
                    Poor: 'bg-rose-500',
                  };

                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">{cat}</span>
                        <span className="font-mono text-slate-400">
                          {count} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColors[cat] || 'bg-slate-500'} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fruit Distribution Chart */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Fruit Class Distribution</h3>
                  <p className="text-xs text-slate-400">
                    YOLO localization frequencies
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {Object.keys(fruitDistribution).length} types
                </span>
              </div>

              <div className="space-y-4">
                {Object.entries(fruitDistribution).map(([fruit, countVal]) => {
                  const count = Number(countVal) || 0;
                  const pct = totalFruits > 0 ? (count / totalFruits) * 100 : 0;
                  return (
                    <div key={fruit} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">{fruit}</span>
                        <span className="font-mono text-slate-400">
                          {count} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
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
        </>
      )}
    </div>
  );
};
