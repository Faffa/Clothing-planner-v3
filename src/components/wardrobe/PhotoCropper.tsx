import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactCrop from 'react-image-crop';
import type { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check, Square, Eraser } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { scaleIn } from '@/lib/animations';

interface PhotoCropperProps {
  imageUrl: string;
  open: boolean;
  onConfirm: (blob: Blob, removeBg: boolean) => void;
  onCancel: (removeBg: boolean) => void;
}

function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/jpeg', 0.92);
  });
}

export function PhotoCropper({ imageUrl, open, onConfirm, onCancel }: PhotoCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [lockAspect, setLockAspect] = useState(false);
  const [removeBg, setRemoveBg] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleConfirm = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;
    const blob = await getCroppedBlob(imgRef.current, completedCrop);
    onConfirm(blob, removeBg);
  }, [completedCrop, onConfirm, removeBg]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-espresso/60 p-4"
          onClick={() => onCancel(removeBg)}
        >
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="initial"
            onClick={e => e.stopPropagation()}
            className="bg-parchment rounded-2xl shadow-maison-lg w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-parchment-deep">
              <h3 className="font-display text-lg text-ink">Crop Photo</h3>
              <button onClick={() => onCancel(removeBg)} className="p-1 rounded-lg hover:bg-parchment-dark text-ink-muted">
                <X size={18} />
              </button>
            </div>

            {/* Crop area */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#e8e8e8]">
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                onComplete={c => setCompletedCrop(c)}
                aspect={lockAspect ? 1 : undefined}
              >
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Crop source"
                  className="max-h-[50vh] max-w-full"
                  crossOrigin="anonymous"
                />
              </ReactCrop>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-parchment-deep">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLockAspect(!lockAspect)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    lockAspect ? 'bg-terracotta/10 text-terracotta' : 'text-ink-muted hover:bg-parchment-dark'
                  }`}
                >
                  <Square size={12} />
                  1:1
                </button>
                <button
                  type="button"
                  onClick={() => setRemoveBg(!removeBg)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    removeBg ? 'bg-terracotta/10 text-terracotta' : 'text-ink-muted hover:bg-parchment-dark'
                  }`}
                >
                  <Eraser size={12} />
                  Remove BG
                </button>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => onCancel(removeBg)}>Cancel</Button>
                <Button variant="primary" icon={<Check size={14} />} onClick={handleConfirm} disabled={!completedCrop}>
                  Apply Crop
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
