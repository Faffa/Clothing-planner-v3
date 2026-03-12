import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  ImagePlus,
  Trash2,
  Loader2,
  Sparkles,
  Check,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { LAYERS, CLOTHING_COLORS } from '@/types';
import type { Layer, ClothingColor, Season } from '@/types';
import type { CreateItemInput } from '@/services/wardrobeService';
import { scaleIn } from '@/lib/animations';
import {
  fileToDataUrl,
  processImagePipeline,
} from '@/services/imageProcessingService';

interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (batch: Array<{ input: CreateItemInput; photo?: File | Blob | null }>) => Promise<void>;
}

type ItemStatus = 'queued' | 'processing' | 'done' | 'error';
type ProcessingStage = 'removing-bg' | 'detecting-color' | 'detecting-ai' | null;

interface QueuedItem {
  id: string;
  originalFile: File;
  preview: string;
  processedPhoto: File | Blob | null;
  status: ItemStatus;
  processingStage: ProcessingStage;
  name: string;
  layer: Layer;
  color: ClothingColor;
}

const MAX_FILES = 20;

export function BulkUploadModal({ open, onClose, onSubmit }: BulkUploadModalProps) {
  const [queue, setQueue] = useState<QueuedItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const updateItem = useCallback((id: string, updates: Partial<QueuedItem>) => {
    setQueue(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item,
    ));
  }, []);

  const processFile = useCallback(async (file: File, id: string) => {
    const preview = await fileToDataUrl(file);
    const item: QueuedItem = {
      id,
      originalFile: file,
      preview,
      processedPhoto: file,
      status: 'processing',
      processingStage: null,
      name: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      layer: 'top-base',
      color: 'black',
    };

    setQueue(prev => [...prev, item]);

    try {
      const result = await processImagePipeline(file, preview, (stage) => {
        updateItem(id, { processingStage: stage });
      });

      const processedPhoto = result.bgBlob ?? file;
      const updates: Partial<QueuedItem> = {
        status: 'done',
        processingStage: null,
        processedPhoto,
        color: result.color,
      };

      if (result.bgUrl) {
        updates.preview = result.bgUrl;
      }
      if (result.ai) {
        updates.name = result.ai.name;
        updates.layer = result.ai.layer;
        updates.color = result.ai.color;
      }

      updateItem(id, updates);
    } catch {
      updateItem(id, { status: 'error', processingStage: null });
    }
  }, [updateItem]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const imageFiles = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, MAX_FILES - queue.length);

    for (const file of imageFiles) {
      const id = crypto.randomUUID();
      processFile(file, id);
    }
  }, [queue.length, processFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const removeFromQueue = (id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmitAll = async () => {
    const readyItems = queue.filter(i => i.status === 'done');
    if (readyItems.length === 0) return;

    setSubmitting(true);
    try {
      const batch = readyItems.map(item => ({
        input: {
          name: item.name,
          layer: item.layer,
          color: item.color,
          temp_min: null,
          temp_max: null,
          seasons: ['all-year'] as Season[],
          tags: [],
        },
        photo: item.processedPhoto,
      }));
      await onSubmit(batch);
      setQueue([]);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setQueue([]);
    onClose();
  };

  const readyCount = queue.filter(i => i.status === 'done').length;
  const processingCount = queue.filter(i => i.status === 'processing').length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/50 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="initial"
            onClick={e => e.stopPropagation()}
            className="bg-parchment rounded-2xl shadow-maison-lg w-full max-w-2xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-parchment-deep shrink-0">
              <div>
                <h2 className="font-display text-xl text-ink">Bulk Upload</h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Up to {MAX_FILES} items &middot; {queue.length} queued
                  {processingCount > 0 && ` \u00b7 ${processingCount} processing`}
                </p>
              </div>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-parchment-dark text-ink-muted">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Drop zone */}
              {queue.length < MAX_FILES && (
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    isDragOver
                      ? 'border-terracotta bg-terracotta/5'
                      : 'border-parchment-deep hover:border-terracotta/50'
                  }`}
                >
                  <ImagePlus size={24} className="mx-auto text-ink-muted/40 mb-2" />
                  <p className="text-xs text-ink-muted">
                    Drop images here or click to browse
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}

              {/* Queue grid */}
              {queue.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                  {queue.map(item => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl overflow-hidden shadow-maison border border-parchment-deep/50"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square relative bg-[#e8e8e8]">
                        <img
                          src={item.preview}
                          alt={item.name}
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                        {/* Status overlay */}
                        {item.status === 'processing' && (
                          <div className="absolute inset-0 bg-espresso/30 flex flex-col items-center justify-center gap-1.5">
                            <Loader2 size={18} className="animate-spin text-white" />
                            <span className="text-[9px] text-white font-medium text-center px-2">
                              {item.processingStage === 'removing-bg' && 'Removing background...'}
                              {item.processingStage === 'detecting-color' && 'Detecting color...'}
                              {item.processingStage === 'detecting-ai' && 'AI analyzing...'}
                              {!item.processingStage && 'Processing...'}
                            </span>
                          </div>
                        )}
                        {item.status === 'done' && (
                          <div className="absolute top-1.5 left-1.5 bg-sage text-white rounded-full p-0.5">
                            <Check size={10} />
                          </div>
                        )}
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeFromQueue(item.id)}
                          className="absolute top-1.5 right-1.5 bg-rouge/80 text-white rounded-full p-1 hover:bg-rouge transition-colors"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>

                      {/* Metadata form */}
                      <div className="p-2 space-y-1.5">
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => updateItem(item.id, { name: e.target.value })}
                          className="w-full bg-parchment border border-parchment-deep rounded px-2 py-1 text-[11px] text-ink focus:outline-none focus:ring-1 focus:ring-terracotta/30"
                          placeholder="Item name"
                        />
                        <div className="grid grid-cols-2 gap-1">
                          <select
                            value={item.layer}
                            onChange={e => updateItem(item.id, { layer: e.target.value as Layer })}
                            className="bg-parchment border border-parchment-deep rounded px-1.5 py-1 text-[10px] text-ink focus:outline-none focus:ring-1 focus:ring-terracotta/30"
                          >
                            {LAYERS.map(l => (
                              <option key={l.value} value={l.value}>{l.label}</option>
                            ))}
                          </select>
                          <select
                            value={item.color}
                            onChange={e => updateItem(item.id, { color: e.target.value as ClothingColor })}
                            className="bg-parchment border border-parchment-deep rounded px-1.5 py-1 text-[10px] text-ink focus:outline-none focus:ring-1 focus:ring-terracotta/30"
                          >
                            {CLOTHING_COLORS.map(c => (
                              <option key={c.value} value={c.value}>{c.value}</option>
                            ))}
                          </select>
                        </div>
                        {item.status === 'done' && (
                          <div className="flex items-center gap-1 text-[9px] text-sage-dark">
                            <Sparkles size={8} /> AI detected
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-parchment-deep shrink-0 space-y-3">
              {/* Progress bar */}
              {queue.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-parchment-dark rounded-full overflow-hidden">
                    <div
                      className="h-full bg-terracotta rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${queue.length > 0 ? (readyCount / queue.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-ink-muted whitespace-nowrap">
                    {readyCount}/{queue.length} ready
                  </span>
                </div>
              )}
            <div className="flex items-center justify-end">
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={readyCount === 0 || submitting}
                  onClick={handleSubmitAll}
                  icon={<Upload size={14} />}
                >
                  {submitting ? 'Adding...' : `Add ${readyCount} Item${readyCount !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
