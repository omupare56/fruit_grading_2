import React, { useState, useEffect } from 'react';
import {
  History as HistoryIcon,
  Trash2,
  Eye,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  AlertCircle,
  ScanLine,
  Calendar,
  Database,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';

interface HistoryViewProps {
  onSelectResult: (result: any) => void;
  onStartNewAnalysis: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onSelectResult,
  onStartNewAnalysis,
}) => {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.getPredictions();
      if (res.data?.predictions) {
        setPredictions(res.data.predictions);
      } else {
        setPredictions([]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load predictions from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete prediction record #${id}?`)) return;

    setDeletingId(id);
    try {
      await api.deletePrediction(id);
      setPredictions((prev) => prev.filter((p) => (p.prediction_id || p.id) !== id));
    } catch (err: any) {
      alert(`Could not delete record: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = predictions.filter((item) => {
    const idStr = (item.prediction_id || item.id || '').toLowerCase();
    const nameStr = (item.filename || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return idStr.includes(query) || nameStr.includes(query);
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-emerald-400" />
            <span>Inspection History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {predictions.length} records stored in MongoDB Atlas database
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchHistory}
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

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by prediction ID or filename..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
          <p className="text-xs text-slate-400">Loading prediction history from MongoDB Atlas...</p>
        </div>
      )}

      {/* Error state */}
      {errorMsg && !loading && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={fetchHistory}
            className="underline font-semibold hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state requirement: 'No past prediction records found in MongoDB.' */}
      {!loading && !errorMsg && predictions.length === 0 && (
        <div className="p-16 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <Database className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              No past prediction records found in MongoDB.
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When fruit images are analyzed using the two-stage pipeline, your predictions and individual fruit quality scores will be recorded here automatically.
            </p>
          </div>
          <button
            onClick={onStartNewAnalysis}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-all"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Start Analysis Now</span>
          </button>
        </div>
      )}

      {/* Record List */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const id = item.prediction_id || item.id;
            const fruitCount = item.fruit_count || item.fruits?.length || 0;
            const timestamp = item.timestamp || item.created_at;
            const preview = item.preview_url || item.image_url;

            // Compute quality summary counts
            const summaryMap: Record<string, number> = {};
            (item.fruits || []).forEach((f: any) => {
              const q = f.quality?.class || f.qualityCategory || 'Good';
              summaryMap[q] = (summaryMap[q] || 0) + 1;
            });

            return (
              <div
                key={id}
                onClick={() => onSelectResult(item)}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {preview ? (
                        <img
                          src={preview}
                          alt="Fruit Thumbnail"
                          className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0 bg-slate-950"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                          <HistoryIcon className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-sm truncate max-w-[180px]">
                            {item.filename || 'Fruit Analysis'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono block">
                          ID: {id}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                      {fruitCount} {fruitCount === 1 ? 'fruit' : 'fruits'}
                    </span>
                  </div>

                  {/* Quality Summary Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {Object.entries(summaryMap).map(([q, cnt]) => {
                      const colors: Record<string, string> = {
                        Excellent: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
                        Good: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
                        Fair: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
                        Poor: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
                      };
                      return (
                        <span
                          key={q}
                          className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                            colors[q] || 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {cnt} {q}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Actions: View and Delete */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Database className="w-3 h-3 text-teal-400" />
                    <span>MongoDB record</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(id, e)}
                      disabled={deletingId === id}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete record from database"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{deletingId === id ? 'Deleting...' : 'Delete'}</span>
                    </button>

                    <button
                      onClick={() => onSelectResult(item)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
