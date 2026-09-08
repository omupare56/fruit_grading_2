import { AnalysisResult, FruitType, QualityCategory, User } from '../types';

const STORAGE_KEYS = {
  USER: 'fruitvision_user',
  USERS_DB: 'fruitvision_registered_users',
  HISTORY: 'fruitvision_analysis_history',
  SETTINGS: 'fruitvision_settings',
};

export const DEFAULT_DEMO_USER: User = {
  id: 'usr_demo_01',
  name: 'Demo Researcher',
  email: 'researcher@fruitvision.edu',
  role: 'Quality Assurance Lead',
  institution: 'Dept. of Computer Science & Agricultural Engineering',
  createdAt: '2026-09-01T09:00:00.000Z',
};

// Seed initial historical demo analyses so dashboard and analytics look rich and realistic immediately
export function getInitialSeedHistory(): AnalysisResult[] {
  return [
    {
      id: 'analysis-init-01',
      title: 'Batch Evaluation: Standard Benchmark A',
      date: 'Sep 7, 2026',
      time: '14:22',
      timestamp: Date.now() - 3600000 * 5,
      imageUrl: '',
      imageWidth: 800,
      imageHeight: 500,
      fileName: 'benchmark_standard_trio.jpg',
      fileSizeFormatted: '342 KB',
      mode: 'benchmark',
      benchmarkId: 'benchmark-1',
      overallQualityScore: 87,
      summary: {
        excellent: 2,
        good: 1,
        fair: 0,
        poor: 0,
        total: 3,
      },
      fruits: [
        {
          id: 'f-1',
          fruitNumber: 1,
          fruitType: 'Apple',
          boundingBox: { x: 12, y: 22, width: 22, height: 58 },
          qualityScore: 91,
          qualityCategory: 'Excellent',
          factors: {
            brightness: 74,
            colorConsistency: 88,
            saturation: 82,
            darkRegionProportion: 3,
            textureVariation: 68,
            sharpness: 84,
          },
          recommendation: 'Suitable for premium retail display or direct consumption.',
          explanation: 'High luminance balance (74%) and minimal dark regions (3%).',
        },
        {
          id: 'f-2',
          fruitNumber: 2,
          fruitType: 'Banana',
          boundingBox: { x: 38, y: 24, width: 32, height: 56 },
          qualityScore: 82,
          qualityCategory: 'Good',
          factors: {
            brightness: 80,
            colorConsistency: 79,
            saturation: 86,
            darkRegionProportion: 7,
            textureVariation: 55,
            sharpness: 76,
          },
          recommendation: 'Ideal table ripeness with sound structural firmness.',
          explanation: 'Strong golden chromaticity with minor natural speckling.',
        },
        {
          id: 'f-3',
          fruitNumber: 3,
          fruitType: 'Orange',
          boundingBox: { x: 70, y: 26, width: 22, height: 54 },
          qualityScore: 89,
          qualityCategory: 'Excellent',
          factors: {
            brightness: 76,
            colorConsistency: 85,
            saturation: 89,
            darkRegionProportion: 2,
            textureVariation: 74,
            sharpness: 88,
          },
          recommendation: 'Fresh citrus standard. Clean flavedo with uniform oil glands.',
          explanation: 'Optimal saturation and low dark region proportion.',
        },
      ],
    },
    {
      id: 'analysis-init-02',
      title: 'Defect Screening: Fresh vs Bruised Apple',
      date: 'Sep 6, 2026',
      time: '11:45',
      timestamp: Date.now() - 3600000 * 28,
      imageUrl: '',
      imageWidth: 800,
      imageHeight: 500,
      fileName: 'fresh_vs_defective_apple.jpg',
      fileSizeFormatted: '418 KB',
      mode: 'benchmark',
      benchmarkId: 'benchmark-2',
      overallQualityScore: 64,
      summary: {
        excellent: 1,
        good: 0,
        fair: 0,
        poor: 1,
        total: 2,
      },
      fruits: [
        {
          id: 'f-21',
          fruitNumber: 1,
          fruitType: 'Apple',
          boundingBox: { x: 18, y: 20, width: 26, height: 62 },
          qualityScore: 93,
          qualityCategory: 'Excellent',
          factors: {
            brightness: 78,
            colorConsistency: 92,
            saturation: 85,
            darkRegionProportion: 2,
            textureVariation: 66,
            sharpness: 90,
          },
          recommendation: 'Flawless surface cuticle. Firm, unblemished skin.',
          explanation: 'High color consistency and negligible blemish index.',
        },
        {
          id: 'f-22',
          fruitNumber: 2,
          fruitType: 'Apple',
          boundingBox: { x: 58, y: 20, width: 26, height: 62 },
          qualityScore: 36,
          qualityCategory: 'Poor',
          factors: {
            brightness: 38,
            colorConsistency: 34,
            saturation: 42,
            darkRegionProportion: 38,
            textureVariation: 86,
            sharpness: 65,
          },
          recommendation: 'Pronounced rot and discoloration detected. Severe bruising.',
          explanation: 'High dark region concentration (38%) accompanied by suppressed luminance.',
        },
      ],
    },
    {
      id: 'analysis-init-03',
      title: 'Tropical Harvest Sample Batch #4',
      date: 'Sep 5, 2026',
      time: '16:10',
      timestamp: Date.now() - 3600000 * 52,
      imageUrl: '',
      imageWidth: 800,
      imageHeight: 500,
      fileName: 'tropical_harvest_mango_orange.jpg',
      fileSizeFormatted: '280 KB',
      mode: 'benchmark',
      benchmarkId: 'benchmark-3',
      overallQualityScore: 75,
      summary: {
        excellent: 0,
        good: 1,
        fair: 1,
        poor: 0,
        total: 2,
      },
      fruits: [
        {
          id: 'f-31',
          fruitNumber: 1,
          fruitType: 'Mango',
          boundingBox: { x: 16, y: 22, width: 34, height: 58 },
          qualityScore: 84,
          qualityCategory: 'Good',
          factors: {
            brightness: 72,
            colorConsistency: 77,
            saturation: 90,
            darkRegionProportion: 6,
            textureVariation: 62,
            sharpness: 80,
          },
          recommendation: 'Naturally ripe mango. Rich beta-carotene yellow hues with slight blush.',
          explanation: 'Strong saturation (90%) and balanced luminance (72%).',
        },
        {
          id: 'f-32',
          fruitNumber: 2,
          fruitType: 'Orange',
          boundingBox: { x: 62, y: 26, width: 22, height: 54 },
          qualityScore: 66,
          qualityCategory: 'Fair',
          factors: {
            brightness: 62,
            colorConsistency: 60,
            saturation: 74,
            darkRegionProportion: 16,
            textureVariation: 70,
            sharpness: 72,
          },
          recommendation: 'Fair visual quality. Localized peel drying and mild brown scuffing.',
          explanation: 'Color consistency suppressed with 16% dark/blemished pixel ratio.',
        },
      ],
    },
  ];
}

// User Authentication (LocalStorage Only)
export function getCurrentUser(): User | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    if (!data) {
      // Auto-set default demo user if none exists
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEFAULT_DEMO_USER));
      return DEFAULT_DEMO_USER;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_DEMO_USER;
  }
}

export function setCurrentUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  } catch {
    // Ignore storage write errors
  }
}

export function getRegisteredUsers(): Array<{ name: string; email: string; passwordHash: string; institution: string }> {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USERS_DB);
    if (!data) {
      const initialUsers = [
        {
          name: 'Demo Researcher',
          email: 'researcher@fruitvision.edu',
          passwordHash: 'demo123',
          institution: 'Dept. of Computer Science & Agricultural Engineering',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(initialUsers));
      return initialUsers;
    }
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function registerUser(name: string, email: string, passwordHash: string, institution: string): User {
  const users = getRegisteredUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error('An account with this email address already exists in local demo storage.');
  }

  const newUser = {
    name,
    email,
    passwordHash,
    institution: institution || 'Academic Research Lab',
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));

  const sessionUser: User = {
    id: `usr_${Date.now()}`,
    name,
    email,
    role: 'Quality Evaluator',
    institution: newUser.institution,
    createdAt: new Date().toISOString(),
  };

  setCurrentUser(sessionUser);
  return sessionUser;
}

export function loginUser(email: string, passwordHash: string): User {
  const users = getRegisteredUsers();
  const found = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === passwordHash
  );

  if (!found) {
    // Allow fallback for demo credentials
    if (email.toLowerCase() === 'researcher@fruitvision.edu') {
      setCurrentUser(DEFAULT_DEMO_USER);
      return DEFAULT_DEMO_USER;
    }
    throw new Error('Invalid email or password. Please verify your demo credentials.');
  }

  const sessionUser: User = {
    id: `usr_${found.email.replace(/[^a-z0-9]/gi, '_')}`,
    name: found.name,
    email: found.email,
    role: 'Quality Evaluator',
    institution: found.institution,
    createdAt: new Date().toISOString(),
  };

  setCurrentUser(sessionUser);
  return sessionUser;
}

// History & Analyses (LocalStorage Only)
export function getHistory(): AnalysisResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) {
      const seed = getInitialSeedHistory();
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAnalysis(result: AnalysisResult): void {
  try {
    const list = getHistory();
    // Avoid exact duplicate ID
    const filtered = list.filter((item) => item.id !== result.id);
    const updated = [result, ...filtered];
    // Keep max 50 analyses to prevent exceeding localStorage quotas
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated.slice(0, 50)));
  } catch (err) {
    console.warn('Could not save analysis to localStorage (quota exceeded?):', err);
  }
}

export function deleteAnalysis(id: string): void {
  try {
    const list = getHistory();
    const updated = list.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  } catch {
    // Ignore error
  }
}

export function clearHistory(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
  } catch {
    // Ignore error
  }
}

export function resetToSeedHistory(): AnalysisResult[] {
  const seed = getInitialSeedHistory();
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(seed));
  } catch {
    // Ignore error
  }
  return seed;
}

// Analytics & Dashboard Metrics Derived from LocalStorage
export function getDashboardStats() {
  const history = getHistory();

  let totalFruits = 0;
  let excellentCount = 0;
  let goodCount = 0;
  let fairCount = 0;
  let poorCount = 0;
  let scoreSum = 0;

  const fruitDistribution: Record<string, number> = {
    Apple: 0,
    Banana: 0,
    Orange: 0,
    Mango: 0,
    Kiwi: 0,
    Pear: 0,
    'Dragon Fruit': 0,
    Other: 0,
  };

  history.forEach((analysis) => {
    analysis.fruits.forEach((fruit) => {
      totalFruits++;
      scoreSum += fruit.qualityScore;

      if (fruit.qualityCategory === 'Excellent') excellentCount++;
      else if (fruit.qualityCategory === 'Good') goodCount++;
      else if (fruit.qualityCategory === 'Fair') fairCount++;
      else if (fruit.qualityCategory === 'Poor') poorCount++;

      const type = fruit.fruitType || 'Other';
      fruitDistribution[type] = (fruitDistribution[type] || 0) + 1;
    });
  });

  const totalAnalyses = history.length;
  const avgQualityScore = totalFruits > 0 ? Math.round(scoreSum / totalFruits) : 0;
  const goodQualityPercent =
    totalFruits > 0 ? Math.round(((excellentCount + goodCount) / totalFruits) * 100) : 0;
  const poorQualityPercent =
    totalFruits > 0 ? Math.round((poorCount / totalFruits) * 100) : 0;
  const fairQualityPercent =
    totalFruits > 0 ? Math.round((fairCount / totalFruits) * 100) : 0;

  return {
    totalAnalyses,
    totalFruits,
    avgQualityScore,
    goodQualityPercent,
    poorQualityPercent,
    fairQualityPercent,
    qualityDistribution: {
      excellent: excellentCount,
      good: goodCount,
      fair: fairCount,
      poor: poorCount,
    },
    fruitDistribution,
    recentAnalyses: history.slice(0, 5),
  };
}

export const getStats = getDashboardStats;
