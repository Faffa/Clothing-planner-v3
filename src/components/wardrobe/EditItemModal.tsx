import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, ImagePlus, ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/common/Button';
import { LAYERS, CLOTHING_COLORS, SEASONS } from '@/types';
import type { ClothingItem, Layer, ClothingColor, Season, ItemRuleOverride } from '@/types';
import { scaleIn } from '@/lib/animations';

interface EditItemModalProps {
  open: boolean;
  item: ClothingItem | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<ClothingItem>, photo?: File | null) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
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

export function EditItemModal({ open, item, onClose, onSave, onDelete }: EditItemModalProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    values: item ? {
      name: item.name,
      layer: item.layer,
      color: item.color,
      temp_min: item.temp_min?.toString() ?? '',
      temp_max: item.temp_max?.toString() ?? '',
      seasons: item.seasons,
      tags: item.tags.join(', '),
    } : undefined,
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [ruleOverride, setRuleOverride] = useState<ItemRuleOverride | null>(item?.rule_override ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset transient state when item changes or modal closes
  useEffect(() => {
    setPhoto(null);
    setPreview(null);
    setSubmitting(false);
    setConfirmDelete(false);
    setRuleOpen(false);
    setRuleOverride(item?.rule_override ?? null);
  }, [item]);

  if (!item) return null;

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const onFormSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      // Build rule_override: null if both fields are null/undefined (inherit all)
      const effectiveOverride: ItemRuleOverride | null =
        (ruleOverride?.max_per_week != null || ruleOverride?.allow_consecutive != null)
          ? ruleOverride
          : null;

      await onSave(
        item.id,
        {
          name: data.name,
          layer: data.layer,
          color: data.color,
          temp_min: data.temp_min ? Number(data.temp_min) : null,
          temp_max: data.temp_max ? Number(data.temp_max) : null,
          seasons: data.seasons,
          tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          rule_override: effectiveOverride,
        },
        photo,
      );
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSubmitting(true);
    try {
      await onDelete(item.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const displayPhoto = preview || item.photo_url;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/50 p-4"
          onClick={onClose}
        >
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="initial"
            onClick={e => e.stopPropagation()}
            className="bg-parchment rounded-2xl shadow-maison-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-parchment-deep">
              <h2 className="font-display text-xl text-ink">Edit Item</h2>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-parchment-dark text-ink-muted">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onFormSubmit)} className="p-3 sm:p-5 space-y-4">
              {/* Photo */}
              <div
                onClick={() => fileRef.current?.click()}
                className="aspect-video bg-parchment-dark rounded-xl border-2 border-dashed border-parchment-deep hover:border-terracotta/50 transition-colors cursor-pointer flex flex-col items-center justify-center overflow-hidden relative"
              >
                {displayPhoto ? (
                  <img src={displayPhoto} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <ImagePlus size={28} className="text-ink-muted/40 mb-2" />
                    <span className="text-xs text-ink-muted">Click to change photo</span>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1">Name *</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                />
                {errors.name && <p className="text-rouge text-xs mt-1">{errors.name.message}</p>}
              </div>

              {/* Layer + Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-ink-muted block mb-1">Layer</label>
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
                  <label className="text-xs font-medium text-ink-muted block mb-1">Color</label>
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

              {/* Temperature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-ink-muted block mb-1">Temp min (&deg;C)</label>
                  <input
                    {...register('temp_min')}
                    type="number"
                    className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted block mb-1">Temp max (&deg;C)</label>
                  <input
                    {...register('temp_max')}
                    type="number"
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

              {/* Rule Override */}
              <div className="border border-parchment-deep rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setRuleOpen(!ruleOpen)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
                >
                  <span>Rule Override {ruleOverride?.max_per_week != null || ruleOverride?.allow_consecutive != null ? '(custom)' : '(inherit)'}</span>
                  <ChevronDown size={14} className={`transition-transform ${ruleOpen ? 'rotate-180' : ''}`} />
                </button>
                {ruleOpen && (
                  <div className="px-3 pb-3 space-y-3 border-t border-parchment-deep pt-3">
                    <div>
                      <label className="text-xs font-medium text-ink-muted block mb-1">Max wears per week</label>
                      <input
                        type="number"
                        min={1}
                        max={7}
                        value={ruleOverride?.max_per_week ?? ''}
                        onChange={e => {
                          const val = e.target.value ? Number(e.target.value) : null;
                          setRuleOverride(prev => ({ ...prev, max_per_week: val }));
                        }}
                        placeholder="Inherit from layer rule"
                        className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-ink-muted block mb-1">Allow consecutive days</label>
                      <select
                        value={ruleOverride?.allow_consecutive == null ? 'inherit' : ruleOverride.allow_consecutive ? 'yes' : 'no'}
                        onChange={e => {
                          const val = e.target.value === 'inherit' ? null : e.target.value === 'yes';
                          setRuleOverride(prev => ({ ...prev, allow_consecutive: val }));
                        }}
                        className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                      >
                        <option value="inherit">Inherit from layer rule</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    {(ruleOverride?.max_per_week != null || ruleOverride?.allow_consecutive != null) && (
                      <button
                        type="button"
                        onClick={() => setRuleOverride(null)}
                        className="text-xs text-terracotta hover:text-terracotta-dark transition-colors"
                      >
                        Reset to inherit all
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-medium text-ink-muted block mb-1">Tags</label>
                <input
                  {...register('tags')}
                  placeholder="casual, work"
                  className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  disabled={submitting}
                  icon={<Trash2 size={14} />}
                >
                  {confirmDelete ? 'Confirm Delete' : 'Delete'}
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                  <Button type="submit" variant="primary" disabled={submitting} icon={<Save size={14} />}>
                    {submitting ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
