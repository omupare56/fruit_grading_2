import React from 'react';
import {
  Menu,
  User as UserIcon,
  Sparkles,
  ChevronRight,
  ScanLine,
  LogIn,
  UserPlus,
  Cpu,
} from 'lucide-react';
import { AuthUser } from '../../services/api';

interface TopBarProps {
  currentView: string;
  currentUser: AuthUser | null;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  onLogout: () => void;
  onToggleMobile: () => void;
  onNavigate: (view: string) => void;
}

const VIEW_TITLES: Record<string, { title: string; subtitle: string }> = {
  landing: {
    title: 'FruitVision DL Project Presentation',
    subtitle: 'Two-stage deep learning pipeline for automated fruit quality assessment',
  },
  dashboard: {
    title: 'Dashboard Overview',
    subtitle: 'System health, live database metrics, and benchmark datasets',
  },
  upload: {
    title: 'Fruit Quality Analysis Engine',
    subtitle: 'Execute two-stage YOLO detection + cropping + EfficientNet V2 quality grading',
  },
  detection: {
    title: 'Detection & Quality Results',
    subtitle: 'Interactive YOLO bounding boxes, individual fruit crops, and grading reports',
  },
  history: {
    title: 'Prediction History',
    subtitle: 'Saved multi-fruit assessments and records stored in MongoDB Atlas',
  },
  analytics: {
    title: 'Quality & Fruit Distribution Analytics',
    subtitle: 'Real-time database aggregations and confidence distribution curves',
  },
  viva: {
    title: 'Architecture & Viva Voce Defense',
    subtitle: 'B.Tech final-year technical review: two-stage pipeline, loss functions, and defense Q&A',
  },
  settings: {
    title: 'System Settings & Diagnostics',
    subtitle: 'Neural network weight verification, MongoDB connectivity, and REST API reference',
  },
};

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  currentUser,
  onOpenLogin,
  onOpenSignup,
  onLogout,
  onToggleMobile,
  onNavigate,
}) => {
  const currentMeta = VIEW_TITLES[currentView] || {
    title: 'FruitVision DL',
    subtitle: 'Intelligent Vision-Based Fruit Quality Assessment',
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobile}
            className="p-2 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 lg:hidden cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-bold text-emerald-400">FruitVision DL</span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
              <span className="capitalize text-slate-300 font-medium">
                {currentView === 'upload' ? 'Analysis' : currentView}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              {currentMeta.title}
            </h1>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('upload')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>New Analysis</span>
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div
                onClick={onOpenLogin}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                </div>
                <span className="hidden md:inline">{currentUser.name}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenLogin}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
              <button
                onClick={onOpenSignup}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 hover:text-emerald-300 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
