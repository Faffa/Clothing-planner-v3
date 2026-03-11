import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  ImagePlus,
  Clipboard,
  Link2,
  Sparkles,
  Undo2,
  Loader2,
  Crop,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/common/Button';
import { LAYERS, CLOTHING_COLORS, SEASONS } from '@/types';
import type { Layer, ClothingColor, Season } from '@/types';
import type { CreateItemInput } from '@/services/wardrobeService';
import { scaleIn } from '@/lib/animations';
import {
  fetchImageFromUrl,
  fileFromClipboard,
  fileToDataUrl,
  processImagePipeline,
} from '@/services/imageProcessingService';
import type { AIDetectionResult } from '@/services/imageProcessingService';
import { PhotoCropper } from '@/components/wardrobe/PhotoCropper';

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateItemInput, photo?: File | Blob | null) => Promise<void>;
}

interface FormData {
  name: string;
  layer: Layer;
  color: ClothingColor;
  temp_min: string;
  temp_max: string;
  seasons: Season[];
  tags: string;
}

type ProcessingStage = 'idle' | 'removing-bg' | 'detecting-color' | 'detecting-ai' | 'done';

export function AddItemModal({ open, onClose, onSubmit }: AddItemModalProps) {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: '',
      layer: 'top-base',
      color: 'black',
      temp_min: '',
      temp_max: '',
      seasons: ['all-year'],
      tags: '',
    },
  });

  const [photo, setPhoto] = useState<File | Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [originalPhoto, setOriginalPhoto] = useState<File | null>(null);
  const [bgRemoved, setBgRemoved] = useState(false);
  const [processing, setProcessing] = useState<ProcessingStage>('idle');
  const [aiResult, setAiResult] = useState<AIDetectionResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset all state when modal closes
  useEffect(() => {
    if (!open) {
      setPhoto(null);
      setPreview(null);
      setOriginalPreview(null);
      setOriginalPhoto(null);
      setBgRemoved(false);
      setProcessing('idle');
      setAiResult(null);
      setSubmitting(false);
      setUrlInput('');
      setUrlLoading(false);
      setIsDragOver(false);
      setCropOpen(false);
      reset();
    }
  }, [open, reset]);

  // Run BG removal + AI detection pipeline on a file
  const runPipeline = useCallback(async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    setPreview(dataUrl);
    setOriginalPreview(dataUrl);
    setPhoto(file);
    setOriginalPhoto(file);
    setBgRemoved(false);
    setAiResult(null);

    setProcessing('removing-bg');
    const result = await processImagePipeline(file, dataUrl, (stage) => {
      setProcessing(stage);
    });

    // Apply results
    if (result.bgBlob && result.bgUrl) {
      setPreview(result.bgUrl);
      setPhoto(result.bgBlob);
      setBgRemoved(true);
    }

    setValue('color', result.color);

    if (result.ai) {
      setAiResult(result.ai);
      setValue('name', result.ai.name);
      setValue('layer', result.ai.layer);
      setValue('color', result.ai.color);
    }

    setProcessing('done');
  }, [setValue]);

  // Load image preview and auto-open cropper (pipeline runs after crop/skip)
  const loadImage = useCallback(async (file: File) => {
    setOriginalPhoto(file);
    const dataUrl = await fileToDataUrl(file);
    setPreview(dataUrl);
    setOriginalPreview(dataUrl);
    setPhoto(file);
    setBgRemoved(false);
    setAiResult(null);
    setProcessing('idle');
    setCropOpen(true);
  }, []);

  // Handle file input change
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImage(file);
  };

  // Handle clipboard paste
  useEffect(() => {
    if (!open) return;
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const file = fileFromClipboard(e.clipboardData.items);
      if (file) {
        e.preventDefault();
        loadImage(file);
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [open, loadImage]);

  // Handle drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) loadImage(file);
  };

  // Handle URL import
  const handleUrlImport = async () => {
    if (!urlInput.trim()) return;
    setUrlLoading(true);
    try {
      const file = await fetchImageFromUrl(urlInput.trim());
      loadImage(file);
      setUrlInput('');
    } catch {
      console.warn('URL import failed');
    } finally {
      setUrlLoading(false);
    }
  };

  // Crop confirmed → run pipeline on cropped image (no double BG removal)
  const handleCropConfirm = useCallback(async (blob: Blob) => {
    setCropOpen(false);
    const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
    runPipeline(file);
  }, [runPipeline]);

  // Crop skipped → run pipeline on original image (only if not already processed)
  const handleCropCancel = useCallback(() => {
    setCropOpen(false);
    if (processing === 'idle' && originalPhoto) runPipeline(originalPhoto);
  }, [processing, originalPhoto, runPipeline]);

  // Undo background removal
  const undoRemoval = () => {
    if (originalPreview && originalPhoto) {
      setPreview(originalPreview);
      setPhoto(originalPhoto);
      setBgRemoved(false);
    }
  };

  const [slowSubmit, setSlowSubmit] = useState(false);

  const onFormSubmit = async (data: FormData) => {
    setSubmitting(true);
    setSlowSubmit(false);
    const slowTimer = setTimeout(() => setSlowSubmit(true), 3000);
    try {
      await onSubmit(
        {
          name: data.name,
          layer: data.layer,
          color: data.color,
          temp_min: data.temp_min ? Number(data.temp_min) : null,
          temp_max: data.temp_max ? Number(data.temp_max) : null,
          seasons: data.seasons,
          tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        },
        photo,
      );
      onClose();
    } catch (err) {
      console.error('Failed to add item:', err);
      // Keep modal open for retry — toast is shown by useWardrobe
    } finally {
      clearTimeout(slowTimer);
      setSubmitting(false);
      setSlowSubmit(false);
    }
  };

  const isProcessing = processing !== 'idle' && processing !== 'done';

  return (
    <>
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            ref={modalRef}
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="initial"
            onClick={e => e.stopPropagation()}
            className="bg-parchment rounded-2xl shadow-maison-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-parchment-deep">
              <h2 className="font-display text-xl text-ink">Add Item</h2>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-parchment-dark text-ink-muted">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onFormSubmit)} className="p-5 space-y-4">
              {/* Photo Upload Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !preview && fileRef.current?.click()}
                className={`aspect-video bg-parchment-dark rounded-xl border-2 border-dashed transition-colors overflow-hidden relative ${
                  isDragOver
                    ? 'border-terracotta bg-terracotta/5'
                    : preview
                    ? 'border-transparent cursor-default'
                    : 'border-parchment-deep hover:border-terracotta/50 cursor-pointer'
                }`}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-contain bg-[#e8e8e8]" />
                    {/* Processing overlay */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-espresso/40 flex items-center justify-center">
                        <div className="bg-parchment rounded-lg px-4 py-2 flex items-center gap-2 shadow-maison">
                          <Loader2 size={16} className="animate-spin text-terracotta" />
                          <span className="text-xs text-ink font-medium">
                            {processing === 'removing-bg' && 'Removing background...'}
                            {processing === 'detecting-color' && 'Detecting color...'}
                            {processing === 'detecting-ai' && 'AI analyzing item...'}
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Actions overlay */}
                    {!isProcessing && (
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        {bgRemoved && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); undoRemoval(); }}
                            className="bg-parchment/90 backdrop-blur-sm rounded-lg p-1.5 text-ink-muted hover:text-ink transition-colors shadow-sm"
                            title="Undo background removal"
                          >
                            <Undo2 size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCropOpen(true); }}
                          className="bg-parchment/90 backdrop-blur-sm rounded-lg p-1.5 text-ink-muted hover:text-ink transition-colors shadow-sm"
                          title="Crop photo"
                        >
                          <Crop size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                          className="bg-parchment/90 backdrop-blur-sm rounded-lg p-1.5 text-ink-muted hover:text-ink transition-colors shadow-sm"
                          title="Change photo"
                        >
                          <ImagePlus size={14} />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <ImagePlus size={28} className="text-ink-muted/40" />
                    <span className="text-xs text-ink-muted">
                      Drop image, paste, or click to browse
                    </span>
                    <div className="flex items-center gap-3 mt-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                        className="text-[10px] text-terracotta hover:text-terracotta-dark font-medium flex items-center gap-1"
                      >
                        <Upload size={10} /> Browse
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.read().then(async (items) => {
                            for (const item of items) {
                              const imgType = item.types.find(t => t.startsWith('image/'));
                              if (imgType) {
                                const blob = await item.getType(imgType);
                                const file = new File([blob], 'pasted.png', { type: imgType });
                                processImage(file);
                                break;
                              }
                            }
                          }).catch(() => {});
                        }}
                        className="text-[10px] text-terracotta hover:text-terracotta-dark font-medium flex items-center gap-1"
                      >
                        <Clipboard size={10} /> Paste
                      </button>
                    </div>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              </div>

              {/* URL Import */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted/50" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleUrlImport())}
                    placeholder="Paste image URL..."
                    className="w-full bg-white border border-parchment-deep rounded-lg pl-8 pr-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleUrlImport}
                  disabled={!urlInput.trim() || urlLoading}
                >
                  {urlLoading ? <Loader2 size={12} className="animate-spin" /> : 'Fetch'}
                </Button>
              </div>

              {/* AI Detection Badge */}
              {aiResult && processing === 'done' && (
                <div className="flex items-center gap-1.5 text-[10px] text-sage-dark bg-sage/10 rounded-lg px-3 py-1.5">
                  <Sparkles size={12} className="text-sage" />
                  <span>AI detected: <strong>{aiResult.name}</strong> &middot; {aiResult.layer} &middot; {aiResult.color}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1">Name *</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  placeholder="e.g. Navy Blazer"
                  className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                />
                {errors.name && <p className="text-rouge text-xs mt-1">{errors.name.message}</p>}
              </div>

              {/* Layer + Color row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-ink-muted block mb-1">Layer *</label>
                  <select
                    {...register('layer')}
                    className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                  >
                    {LAYERS.map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted block mb-1">Color *</label>
                  <select
                    {...register('color')}
                    className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                  >
                    {CLOTHING_COLORS.map(c => (
                      <option key={c.value} value={c.value}>{c.value}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Temperature range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-ink-muted block mb-1">Temp min (&deg;C)</label>
                  <input
                    {...register('temp_min')}
                    type="number"
                    placeholder="-10"
                    className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted block mb-1">Temp max (&deg;C)</label>
                  <input
                    {...register('temp_max')}
                    type="number"
                    placeholder="35"
                    className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                  />
                </div>
              </div>

              {/* Seasons */}
              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1">Seasons</label>
                <div className="flex flex-wrap gap-2">
                  {SEASONS.map(s => (
                    <label key={s.value} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        value={s.value}
                        {...register('seasons')}
                        className="w-3.5 h-3.5 rounded border-parchment-deep text-terracotta focus:ring-terracotta/30"
                      />
                      <span className="text-xs text-ink">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1">Tags (comma-separated)</label>
                <input
                  {...register('tags')}
                  placeholder="casual, work, date-night"
                  className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end gap-1 pt-2">
                {submitting && slowSubmit && (
                  <p className="text-[10px] text-ink-muted">This is taking longer than expected...</p>
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                  <Button type="submit" variant="primary" disabled={submitting || isProcessing} icon={<Upload size={14} />}>
                    {submitting ? 'Adding...' : 'Add Item'}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    {preview && (
      <PhotoCropper
        imageUrl={originalPreview || preview}
        open={cropOpen}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    )}
    </>
  );
}
