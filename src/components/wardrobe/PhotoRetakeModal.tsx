import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PhotoCropper } from '@/components/wardrobe/PhotoCropper';
import { scaleIn } from '@/lib/animations';
import {
  processImagePipeline,
  fileToDataUrl,
} from '@/services/imageProcessingService';
import type { ProcessingStage } from '@/services/imageProcessingService';
import type { ClothingItem } from '@/types';

interface PhotoRetakeModalProps {
  open: boolean;
  item: ClothingItem | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<ClothingItem>, photo?: File | null) => Promise<void>;
}

const STAGE_LABELS: Record<ProcessingStage | 'cropping' | 'saving', string> = {
  cropping: 'Crop your photo...',
  'removing-bg': 'Removing background...',
  'detecting-color': 'Detecting color...',
  'detecting-ai': 'Analyzing item...',
  saving: 'Saving photo...',
};

export function PhotoRetakeModal({ open, item, onClose, onSave }: PhotoRetakeModalProps) {
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [rawPreview, setRawPreview] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [stage, setStage] = useState<ProcessingStage | 'cropping' | 'saving' | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setRawFile(null);
      setRawPreview(null);
      setShowCropper(false);
      setStage(null);
      setProcessedPreview(null);
      setProcessedBlob(null);
    }
  }, [open]);

  if (!item) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRawFile(file);
    setRawPreview(URL.createObjectURL(file));
    setShowCropper(true);
    setStage('cropping');
    // Reset file input so same file can be re-selected
    e.target.value = '';
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    setShowCropper(false);
    const croppedFile = new File([croppedBlob], 'retake.png', { type: croppedBlob.type });

    try {
      const result = await processImagePipeline(croppedFile, (s) => setStage(s));
      const finalBlob = result.bgBlob ?? croppedBlob;
      const previewUrl = result.bgUrl ?? await fileToDataUrl(croppedFile);
      setProcessedBlob(finalBlob);
      setProcessedPreview(previewUrl);
      setStage(null);
    } catch (err) {
      console.error('Photo processing failed:', err);
      // Fall back to cropped image without processing
      const previewUrl = await fileToDataUrl(croppedFile);
      setProcessedBlob(croppedBlob);
      setProcessedPreview(previewUrl);
      setStage(null);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setRawFile(null);
    setRawPreview(null);
    setStage(null);
  };

  const handleSave = async () => {
    if (!processedBlob) return;
    setStage('saving');
    try {
      const photoFile = new File([processedBlob], 'retake.png', { type: processedBlob.type });
      await onSave(item.id, {}, photoFile);
      onClose();
    } catch (err) {
      console.error('Failed to save retake photo:', err);
      setStage(null);
    }
  };

  const isProcessing = stage !== null && stage !== 'cropping';

  return (
    <>
      <AnimatePresence>
        {open && !showCropper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/50 backdrop-blur-sm p-4"
            onClick={onClose}
          >
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              exit="initial"
              onClick={e => e.stopPropagation()}
              className="bg-parchment rounded-2xl shadow-maison-lg w-full max-w-md"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-parchment-deep">
                <h2 className="font-display text-xl text-ink">Retake Photo</h2>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-parchment-dark text-ink-muted">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Current / Processed Photo */}
                <div className="aspect-square bg-parchment-dark rounded-xl overflow-hidden relative">
                  <img
                    src={processedPreview || item.photo_url || ''}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-espresso/60 flex flex-col items-center justify-center gap-3">
                      <Loader2 size={28} className="text-white animate-spin" />
                      <p className="text-white text-sm font-medium">
                        {STAGE_LABELS[stage]}
                      </p>
                    </div>
                  )}
                </div>

                <p className="text-xs text-ink-muted text-center">
                  {item.name} &middot; All metadata will be preserved
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  {!processedBlob ? (
                    <Button
                      variant="primary"
                      className="flex-1"
                      icon={<Camera size={16} />}
                      onClick={() => fileRef.current?.click()}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Choose New Photo'}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        className="flex-1"
                        icon={<Camera size={16} />}
                        onClick={() => {
                          setProcessedBlob(null);
                          setProcessedPreview(null);
                          fileRef.current?.click();
                        }}
                      >
                        Try Again
                      </Button>
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={handleSave}
                        disabled={isProcessing}
                      >
                        {stage === 'saving' ? 'Saving...' : 'Save Photo'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cropper overlay */}
      {rawPreview && (
        <PhotoCropper
          imageUrl={rawPreview}
          open={showCropper}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}
