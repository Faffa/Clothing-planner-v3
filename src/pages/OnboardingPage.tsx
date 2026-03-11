import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shirt, SlidersHorizontal, ArrowRight, ArrowLeft, Upload, ImagePlus, Loader2, Sparkles, SkipForward } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/common/Button';
import { LAYERS, CLOTHING_COLORS } from '@/types';
import type { Layer, ClothingColor } from '@/types';
import { DEFAULT_WEARING_RULES, DEFAULT_COLOR_CLASHES } from '@/lib/constants';
import { EASE_MAISON } from '@/lib/animations';
import { useRef } from 'react';
import { processImagePipeline, fileToDataUrl } from '@/services/imageProcessingService';
import type { AIDetectionResult } from '@/services/imageProcessingService';

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE_MAISON } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.3, ease: EASE_MAISON } },
};

const STEPS = [
  { icon: User, label: 'Profile', title: 'Welcome to Maison' },
  { icon: Shirt, label: 'First Item', title: 'Add Your First Piece' },
  { icon: SlidersHorizontal, label: 'Rules', title: 'Your Wardrobe Rules' },
];

export function OnboardingPage() {
  const { profile, updateProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 1 state
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [location, setLocation] = useState(profile?.location || '');

  // Step 2 state
  const [itemName, setItemName] = useState('');
  const [itemLayer, setItemLayer] = useState<Layer>('top-base');
  const [itemColor, setItemColor] = useState<ClothingColor>('black');
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<AIDetectionResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Already completed - redirect
  if (profile?.onboarding_completed) {
    navigate('/', { replace: true });
    return null;
  }

  const processImage = async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    setPreview(dataUrl);
    setProcessing(true);
    try {
      const result = await processImagePipeline(file, dataUrl, () => {});
      if (result.bgUrl) setPreview(result.bgUrl);
      if (result.ai) {
        setAiResult(result.ai);
        setItemName(result.ai.name);
        setItemLayer(result.ai.layer);
        setItemColor(result.ai.color);
      } else {
        setItemColor(result.color);
      }
    } catch {
      // Ignore pipeline errors during onboarding
    } finally {
      setProcessing(false);
    }
  };

  const handleNext = async () => {
    if (step === 0) {
      if (!displayName.trim()) {
        showToast('Please enter your name', 'error');
        return;
      }
      await updateProfile({ display_name: displayName.trim(), location: location.trim() || null });
      setStep(1);
    } else if (step === 1) {
      setStep(2);
    } else {
      await updateProfile({ onboarding_completed: true });
      showToast('Welcome to Maison!');
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden md:flex w-[40%] bg-espresso flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #C4654A 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10 text-center">
          <h1 className="font-display text-4xl text-parchment tracking-[0.15em] uppercase mb-3">Maison</h1>
          <p className="text-parchment/50 text-sm font-body">Your personal wardrobe curator</p>
        </div>
        {/* Step dots */}
        <div className="relative z-10 flex gap-3 mt-12">
          {STEPS.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                i === step ? 'bg-terracotta text-white' : i < step ? 'bg-terracotta/30 text-parchment/80' : 'bg-espresso-light text-parchment/30'
              }`}>
                <s.icon size={18} />
              </div>
              <span className={`text-[10px] uppercase tracking-wider ${i === step ? 'text-parchment' : 'text-parchment/30'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - content */}
      <div className="flex-1 bg-parchment flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile step indicator */}
          <div className="md:hidden flex gap-2 mb-6 justify-center">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-terracotta' : 'w-4 bg-parchment-deep'}`} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Profile */}
            {step === 0 && (
              <motion.div key="step-0" variants={stepVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl text-ink mb-1">{STEPS[0].title}</h2>
                  <p className="text-ink-muted text-sm">Let's set up your profile to personalize your experience.</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted block mb-1.5">Your Name *</label>
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="e.g. Sarah"
                    className="w-full bg-white border border-parchment-deep rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted block mb-1.5">Location (optional)</label>
                  <input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Helsinki, Finland"
                    className="w-full bg-white border border-parchment-deep rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                  />
                  <p className="text-[10px] text-ink-muted mt-1">Used for weather-based outfit suggestions</p>
                </div>
              </motion.div>
            )}

            {/* Step 2: First Item */}
            {step === 1 && (
              <motion.div key="step-1" variants={stepVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl text-ink mb-1">{STEPS[1].title}</h2>
                  <p className="text-ink-muted text-sm">Upload a photo and our AI will detect the details. You can skip this and add items later.</p>
                </div>
                {/* Photo upload */}
                <div
                  onClick={() => !preview && fileRef.current?.click()}
                  className={`aspect-video bg-parchment-dark rounded-xl border-2 border-dashed overflow-hidden relative ${
                    preview ? 'border-transparent' : 'border-parchment-deep hover:border-terracotta/50 cursor-pointer'
                  }`}
                >
                  {preview ? (
                    <>
                      <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-contain bg-[#e8e8e8]" />
                      {processing && (
                        <div className="absolute inset-0 bg-espresso/40 flex items-center justify-center">
                          <div className="bg-parchment rounded-lg px-4 py-2 flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-terracotta" />
                            <span className="text-xs text-ink">Processing...</span>
                          </div>
                        </div>
                      )}
                      {!processing && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                          className="absolute top-2 right-2 bg-parchment/90 backdrop-blur-sm rounded-lg p-1.5 text-ink-muted hover:text-ink"
                        >
                          <ImagePlus size={14} />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <Upload size={28} className="text-ink-muted/40" />
                      <span className="text-xs text-ink-muted">Click to upload a clothing photo</span>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) processImage(f); }} className="hidden" />
                </div>
                {/* AI result badge */}
                {aiResult && !processing && (
                  <div className="flex items-center gap-1.5 text-[10px] text-sage-dark bg-sage/10 rounded-lg px-3 py-1.5">
                    <Sparkles size={12} className="text-sage" />
                    <span>AI detected: <strong>{aiResult.name}</strong> &middot; {aiResult.layer} &middot; {aiResult.color}</span>
                  </div>
                )}
                {/* Quick fields */}
                {preview && !processing && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-ink-muted block mb-1">Name</label>
                      <input value={itemName} onChange={e => setItemName(e.target.value)} className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-ink-muted block mb-1">Layer</label>
                        <select value={itemLayer} onChange={e => setItemLayer(e.target.value as Layer)} className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30">
                          {LAYERS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-ink-muted block mb-1">Color</label>
                        <select value={itemColor} onChange={e => setItemColor(e.target.value as ClothingColor)} className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30">
                          {CLOTHING_COLORS.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Rules Overview */}
            {step === 2 && (
              <motion.div key="step-2" variants={stepVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl text-ink mb-1">{STEPS[2].title}</h2>
                  <p className="text-ink-muted text-sm">We've set up sensible defaults for outfit generation. You can customize these anytime in Settings.</p>
                </div>
                <div className="bg-white rounded-xl shadow-maison p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">Wearing Limits</h3>
                  {DEFAULT_WEARING_RULES.map(r => (
                    <div key={r.layer} className="flex items-center justify-between text-sm">
                      <span className="text-ink capitalize">{r.layer.replace('-', ' ')}</span>
                      <span className="text-ink-muted text-xs">{r.max_per_week}x/week {!r.allow_consecutive && '· no consecutive'}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl shadow-maison p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">Color Clashes</h3>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_COLOR_CLASHES.map((c, i) => (
                      <span key={i} className="text-[11px] bg-rouge/10 text-rouge px-2 py-1 rounded-md">
                        {c.color_a} + {c.color_b}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-ink-muted">These combinations will be avoided in outfit generation</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <Button variant="ghost" icon={<ArrowLeft size={14} />} onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : <div />}
            <div className="flex gap-2">
              {step === 1 && !preview && (
                <Button variant="ghost" icon={<SkipForward size={14} />} onClick={handleNext}>
                  Skip
                </Button>
              )}
              <Button variant="primary" icon={<ArrowRight size={14} />} onClick={handleNext} disabled={processing}>
                {step === 2 ? 'Get Started' : 'Continue'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
