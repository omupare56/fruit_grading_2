import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  RefreshCw,
  Cpu,
  Layers,
  Activity,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Server,
  FileCode2,
  ExternalLink,
} from 'lucide-react';
import { api, HealthStatus } from '../../services/api';

interface SettingsViewProps {
  onRefreshData: () => void;
}

const API_ENDPOINTS = [
  { method: 'GET', path: '/api/health', purpose: 'Comprehensive system, database, and model diagnostic health check' },
  { method: 'POST', path: '/api/auth/signup', purpose: 'Register new student/researcher account with bcrypt password hashing' },
  { method: 'POST', path: '/api/auth/login', purpose: 'Authenticate user credentials and issue signed JWT bearer token' },
  { method: 'POST', path: '/api/auth/logout', purpose: 'Invalidate current user session and reset security credentials' },
  { method: 'GET', path: '/api/auth/me', purpose: 'Verify JWT and return current active user profile' },
  { method: 'POST', path: '/api/predict', purpose: 'Execute two-stage YOLO detection + cropping + EfficientNet V2 evaluation' },
  { method: 'GET', path: '/api/predictions', purpose: 'Fetch saved prediction history from MongoDB Atlas collection' },
  { method: 'GET', path: '/api/predictions/<id>', purpose: 'Retrieve single prediction record and individual crops by ID' },
  { method: 'DELETE', path: '/api/predictions/<id>', purpose: 'Permanently remove a prediction record from MongoDB' },
  { method: 'GET', path: '/api/stats', purpose: 'Return live MongoDB aggregation statistics and distributions' },
  { method: 'POST', path: '/api/upload', purpose: 'Validate image format, dimensions, and multipart stream integrity' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefreshData }) => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.getHealth();
      if (res.data) {
        setHealth(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect to /api/health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const yoloConfigured = health?.models?.yolo === 'configured';
  const effConfigured = health?.models?.efficientnet_v2 === 'configured';
  const dbConnected = health?.database === 'connected';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-emerald-400" />
            <span>System Settings & Architecture Diagnostics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time verification of backend services, neural network weights, and MongoDB Atlas connectivity
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Diagnostics</span>
        </button>
      </div>

      {/* Model Status Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
          Neural Network Weights Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* YOLO Model */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Stage 1: YOLO Detector</h4>
                  <span className="text-[11px] text-slate-400 font-mono">models/yolo/best.pt</span>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                  yoloConfigured
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}
              >
                {yoloConfigured ? 'Weights Loaded' : 'Weights Missing'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Responsible for fruit localization and bounding-box region proposals.
              {!yoloConfigured && ' Upload trained PyTorch (.pt) weights to enable full-resolution custom image detection.'}
            </p>
          </div>

          {/* EfficientNet V2 Model */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Stage 2: EfficientNet V2</h4>
                  <span className="text-[11px] text-slate-400 font-mono">models/efficientnet/efficientnet_v2.pth</span>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                  effConfigured
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}
              >
                {effConfigured ? 'Weights Loaded' : 'Weights Missing'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluates individual fruit crops and outputs 4-class categorical quality scores.
              {!effConfigured && ' Upload trained PyTorch state_dict (.pth) to activate neural grading.'}
            </p>
          </div>
        </div>
      </div>

      {/* Database & Infrastructure Status */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
          Database & Cloud Infrastructure
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* MongoDB Atlas */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">MongoDB Atlas</h4>
                  <span className="text-[11px] text-slate-400 font-mono">Database: fruit_quality_db</span>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                  dbConnected
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}
              >
                {dbConnected ? 'Connected' : 'Connection Standby'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Persists user credentials with salted bcrypt hashes and stores full multi-fruit analysis records and crops.
            </p>
          </div>

          {/* Vercel Serverless WSGI */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Vercel WSGI Handler</h4>
                  <span className="text-[11px] text-slate-400 font-mono">api/index.py (Flask Entrypoint)</span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                Active
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Stateless WSGI handler compatible with Vercel serverless execution limits. Automatically loads on request.
            </p>
          </div>
        </div>
      </div>

      {/* Complete API Endpoint Reference Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
          REST API Endpoint Reference
        </h3>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden divide-y divide-slate-800/80">
          {API_ENDPOINTS.map((ep) => (
            <div key={`${ep.method}-${ep.path}`} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                    ep.method === 'GET'
                      ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                      : ep.method === 'POST'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {ep.method}
                </span>
                <span className="font-mono text-white font-medium">{ep.path}</span>
              </div>
              <span className="text-slate-400 text-[11px] sm:text-right max-w-md">
                {ep.purpose}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
