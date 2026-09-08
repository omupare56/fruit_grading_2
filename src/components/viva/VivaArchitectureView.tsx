import React, { useState } from 'react';
import {
  GraduationCap,
  Layers,
  Cpu,
  Database,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Server,
  ShieldCheck,
  Crop,
  Activity,
  Code,
} from 'lucide-react';

export const VivaArchitectureView: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const vivaQuestions = [
    {
      q: 'Why adopt a two-stage pipeline (YOLO + EfficientNet V2) instead of a single end-to-end network?',
      a: 'A single-stage object detector (e.g. YOLO trained directly to output "Fresh Apple" vs "Rotten Apple") suffers from severe background clutter, class imbalance across rare defect phenotypes, and downsampled spatial resolution on small fruits. By decoupling the architecture, Stage 1 (YOLO) dedicates all parameters to spatial localization and multi-fruit bounding box proposal regardless of lighting. Stage 2 crops and normalizes each fruit individually to 224x224, feeding only the fruit surface into EfficientNet V2. This eliminates background noise, prevents spatial confusion, and enables high-resolution fine-grained quality grading.',
    },
    {
      q: 'Why choose YOLO for the fruit localization stage?',
      a: 'YOLO (You Only Look Once) is a single-shot detector that predicts 2D bounding boxes and class probabilities directly from full images in a single forward pass. It processes images at real-time speeds (30–60+ FPS), handles complex overlapping multi-fruit baskets using Non-Maximum Suppression (NMS), and avoids the high computational latency of two-stage region proposal networks (like Faster R-CNN).',
    },
    {
      q: 'Why choose EfficientNet V2 for the quality assessment stage?',
      a: 'EfficientNet V2 introduces Fused-MBConv layers in the early stages and neural architecture search (NAS) optimized for both accuracy and training velocity. It achieves state-of-the-art Top-1 accuracy while having significantly fewer parameters (up to 6.8x faster training than standard CNNs). Its progressive learning regularization adjusts image size and data augmentation during training to prevent texture overfitting.',
    },
    {
      q: 'How does individual fruit cropping work in multi-fruit scenes?',
      a: 'When YOLO outputs bounding box coordinates [x1, y1, x2, y2], each bounding box is first clamped to the image boundary to prevent index errors. The sub-array is extracted as an isolated PIL/NumPy image tensor. An aspect-ratio preserving resize with bilinear interpolation scales the crop to 224x224. Normalization using ImageNet mean [0.485, 0.456, 0.406] and standard deviation [0.229, 0.224, 0.225] is applied before passing the crop to EfficientNet V2.',
    },
    {
      q: 'Which loss functions are used for training both models?',
      a: 'Stage 1 (YOLO) uses a compound loss: Complete IoU (CIoU) Loss for bounding box regression (penalizing overlap, distance, and aspect ratio discrepancies) plus Binary Cross-Entropy (BCE) for objectness score and class probabilities. Stage 2 (EfficientNet V2) uses Categorical Cross-Entropy with Label Smoothing (ε = 0.1) to penalize overconfident misclassifications on ambiguous ripening stages.',
    },
    {
      q: 'What evaluation metrics assess system performance in your dissertation?',
      a: 'For YOLO Localization: Mean Average Precision (mAP@0.5 and mAP@0.5:0.95), Precision, Recall, and Intersection over Union (IoU >= 0.5). For EfficientNet V2 Quality Assessment: Multi-class Confusion Matrix, Overall Accuracy, Precision, Recall, and Macro-averaged F1-Score across the 4 quality classes (Excellent, Good, Fair, Poor).',
    },
    {
      q: 'How are passwords and user sessions secured in this application?',
      a: 'User passwords are never stored in plaintext. They are salted and hashed using Bcrypt with a work factor of 12 rounds. Authentication is stateless: upon successful login, the server signs a JSON Web Token (JWT) using HS256 with a secure secret and 24-hour expiration. The client passes this token in the Authorization: Bearer <token> header for protected routes.',
    },
    {
      q: 'How does the Vercel serverless deployment architecture handle Python Flask?',
      a: 'The repository includes vercel.json which routes all incoming requests to /api/(.*) to api/index.py. On Vercel, api/index.py acts as a WSGI handler exposing the Flask app instance. The frontend React application is built statically with Vite into dist/. Because serverless instances are stateless, all persistent data (user accounts, predictions, crops) is stored in a remote MongoDB Atlas cluster.',
    },
    {
      q: 'What is the "Model Honesty" protocol and why is it implemented?',
      a: 'Academic integrity and B.Tech viva regulations strictly forbid fabricating AI predictions with random numbers (Math.random()), hard-coded bounding boxes, or deceptive 100% accuracy claims. When neural network weights (.pt or .pth) are not present in the models/ directory, the system explicitly informs the user that model weights are not configured, rather than inventing false outputs.',
    },
    {
      q: 'Why are Defect Detection, Shelf Life, and Market Grade labeled as optional modules?',
      a: 'EfficientNet V2 is a general image classifier for surface quality categorization; claiming it predicts bacterial shelf life or certified market grades without dedicated microbial or spectral sensors is scientifically invalid. The system transparently flags these modules as unconfigured until dedicated specialized models are integrated.',
    },
  ];

  return (
    <div className="space-y-10 pb-16 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 text-xs font-semibold uppercase tracking-wider">
          <GraduationCap className="w-4 h-4" />
          <span>B.Tech IT Final Year Academic Defense & Viva Voce Guide</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          System Architecture & Viva Voce Defense Specifications
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          Comprehensive academic documentation detailing the two-stage deep learning pipeline, mathematical loss functions, individual fruit cropping mechanism, MongoDB database schema, and viva examination defense questions.
        </p>
      </div>

      {/* Two-Stage Architecture Diagram Flow */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Pipeline Visualizer
          </span>
          <h2 className="text-xl font-bold text-white">
            Two-Stage Deep Learning Pipeline Workflow
          </h2>
          <p className="text-xs text-slate-400">
            Decoupled architecture: Spatial Fruit Localization (YOLO) → Region Extraction → Quality Classification (EfficientNet V2)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Step 1 */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
              1
            </div>
            <h3 className="text-sm font-bold text-white">Input Multi-Fruit Image</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Accepts arbitrary resolution images (PNG, JPG, WEBP) containing single or multiple fruit instances in varying lighting.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
              2
            </div>
            <h3 className="text-sm font-bold text-white">YOLO Localization</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Predicts 2D bounding boxes [x1, y1, x2, y2] and fruit classes using CIoU loss and Non-Maximum Suppression (NMS).
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-sm">
              3
            </div>
            <h3 className="text-sm font-bold text-white">Individual Cropping</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Extracts each bounding box independently, clamps coordinates to boundaries, and resizes to normalized 224x224 RGB tensors.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
              4
            </div>
            <h3 className="text-sm font-bold text-white">EfficientNet V2 Grading</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Processes the isolated fruit crop through fused-MBConv feature extractors. Computes probabilities (Excellent, Good, Fair, Poor).
            </p>
          </div>
        </div>
      </section>

      {/* Technical Specifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stage 1 Specs */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Cpu className="w-5 h-5" />
            <span>Stage 1: YOLO Object Detection Architecture</span>
          </div>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex justify-between">
              <span className="text-slate-400">Primary Objective</span>
              <span className="font-semibold text-white">Multi-Fruit Localization & Class Proposal</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex justify-between">
              <span className="text-slate-400">Input Resolution</span>
              <span className="font-semibold text-white">640x640 (dynamic batching)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex justify-between">
              <span className="text-slate-400">Loss Functions</span>
              <span className="font-semibold text-white">CIoU (box) + BCE (objectness & class)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex justify-between">
              <span className="text-slate-400">Evaluation Metrics</span>
              <span className="font-semibold text-white">mAP@0.5, mAP@0.5:0.95, IoU, FPS</span>
            </div>
          </div>
        </div>

        {/* Stage 2 Specs */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
            <Layers className="w-5 h-5" />
            <span>Stage 2: EfficientNet V2 Quality Assessment</span>
          </div>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex justify-between">
              <span className="text-slate-400">Primary Objective</span>
              <span className="font-semibold text-white">Categorical Quality Scoring (4 Classes)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex justify-between">
              <span className="text-slate-400">Crop Resolution</span>
              <span className="font-semibold text-white">224x224 RGB Normalized Tensor</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex justify-between">
              <span className="text-slate-400">Loss Function</span>
              <span className="font-semibold text-white">Categorical Cross-Entropy (Label Smoothing)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex justify-between">
              <span className="text-slate-400">Evaluation Metrics</span>
              <span className="font-semibold text-white">Accuracy, Confusion Matrix, F1-Score</span>
            </div>
          </div>
        </div>
      </div>

      {/* Database Schema & Security Details */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
          <Database className="w-5 h-5" />
          <span>MongoDB Atlas Database Schema & Security Engineering</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Collection: users
            </h4>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`{
  "_id": ObjectId("..."),
  "name": "Student Researcher",
  "email": "student@college.edu", // Unique index
  "password_hash": "$2b$12$...", // Salted Bcrypt
  "institution": "Department of IT",
  "role": "user",
  "created_at": ISODate("...")
}`}</pre>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Collection: predictions
            </h4>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`{
  "_id": ObjectId("..."),
  "prediction_id": "PRED-174139...",
  "user_id": "optional_user_id",
  "filename": "fruits.jpg",
  "fruit_count": 3,
  "fruits": [
    {
      "fruit_id": 1,
      "fruit_type": "Apple",
      "bounding_box": { "x1": 42, "y1": 50, ... },
      "detection_confidence": 0.94,
      "quality": { "class": "Good", "confidence": 0.88 },
      "crop_image_url": "data:image/jpeg;base64,..."
    }
  ],
  "created_at": ISODate("...")
}`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* Viva Voce Defense Q&A Accordion */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">
              Viva Voce Defense Questions & Model Answers
            </h3>
            <p className="text-xs text-slate-400">
              Frequently asked technical questions by external examiners during final-year B.Tech capstone defenses.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {vivaQuestions.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-white text-sm pr-4">
                    Q{idx + 1}: {item.q}
                  </span>
                  <div className="shrink-0 text-slate-400">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-4 bg-slate-950/40">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
