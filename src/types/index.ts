export type FruitType =
  | 'Apple'
  | 'Banana'
  | 'Orange'
  | 'Mango'
  | 'Kiwi'
  | 'Pear'
  | 'Dragon Fruit'
  | 'Other';

export type QualityCategory = 'Excellent' | 'Good' | 'Fair' | 'Poor';

export type DetectionMode = 'benchmark' | 'custom';

export interface BoundingBox {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width: number; // percentage 0 - 100
  height: number; // percentage 0 - 100
  pixelCoords?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface AnalysisFactors {
  brightness: number; // 0 - 100
  colorConsistency: number; // 0 - 100
  saturation: number; // 0 - 100
  darkRegionProportion: number; // 0 - 100 (percentage of dark/blemished pixels)
  textureVariation: number; // 0 - 100
  sharpness: number; // 0 - 100
}

export interface DetectedFruit {
  id: string;
  fruitNumber: number;
  fruitType: FruitType;
  isUserAssisted?: boolean;
  boundingBox: BoundingBox;
  cropDataUrl?: string;
  qualityScore: number; // 0 - 100
  qualityCategory: QualityCategory;
  factors: AnalysisFactors;
  recommendation: string;
  explanation: string;
  defectEstimateNote?: string;
}

export interface AnalysisResult {
  id: string;
  title: string;
  date: string;
  time: string;
  timestamp: number;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  fileName: string;
  fileSizeFormatted: string;
  mode: DetectionMode;
  benchmarkId?: string;
  fruits: DetectedFruit[];
  overallQualityScore: number;
  summary: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    total: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  institution: string;
  createdAt: string;
}

export type UserSession = User;

export interface BenchmarkCase {
  id: string;
  title: string;
  category: string;
  description: string;
  badge: string;
  fruits: {
    fruitNumber: number;
    fruitType: FruitType;
    boundingBox: BoundingBox;
    qualityScore: number;
    qualityCategory: QualityCategory;
    factors: AnalysisFactors;
    recommendation: string;
    explanation: string;
  }[];
  canvasDrawer: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

export type NavigationTab =
  | 'dashboard'
  | 'analysis'
  | 'detection'
  | 'history'
  | 'analytics'
  | 'viva'
  | 'settings';
