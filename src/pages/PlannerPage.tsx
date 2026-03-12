import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, startOfWeek } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  RefreshCw,
  ArrowLeftRight,
  Shirt,
  FilePlus2,
  History,
  ChevronDown,
  Calendar,
  WashingMachine,
  ArrowLeft,
  GripVertical,
  Bookmark,
  LayoutTemplate,
  Wand2,
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { Button } from '@/components/common/Button';
import { SwapModal } from '@/components/planner/SwapModal';
import { TemplateListModal } from '@/components/planner/TemplateListModal';
import { SuggestionsModal } from '@/components/planner/SuggestionsModal';
import { useWardrobe } from '@/hooks/useWardrobe';
import { useRules } from '@/hooks/useRules';
import { usePlanner } from '@/hooks/usePlanner';
import { useTemplates } from '@/hooks/useTemplates';
import { isAIAvailable, getSmartSuggestions } from '@/services/aiOutfitService';
import type { OutfitSuggestion } from '@/services/aiOutfitService';
import { LAYER_LABELS } from '@/lib/constants';
import { CLOTHING_COLORS } from '@/types';
import type { Layer, ClothingItem, ClothingColor } from '@/types';
import { stagger, fadeUp } from '@/lib/animations';

function getColorHex(color: ClothingColor): string {
  return CLOTHING_COLORS.find(c => c.value === color)?.hex || '#ccc';
}

// Droppable day zone
function DroppableDayZone({ dayIndex, children }: { dayIndex: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${dayIndex}` });
  return (
    <div ref={setNodeRef} className={`transition-colors rounded-xl ${isOver ? 'ring-2 ring-terracotta/40 bg-terracotta/5' : ''}`}>
      {children}
    </div>
  );
}

// Draggable outfit item
function DraggableOutfitItem({
  item,
  layer,
  dayIndex,
  isDraft,
  onSwap,
}: {
  item: ClothingItem;
  layer: Layer;
  dayIndex: number;
  isDraft: boolean;
  onSwap: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${dayIndex}-${layer}`,
    data: { item, layer, dayIndex },
    disabled: !isDraft,
  });

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: isDragging ? 0.4 : 1, x: 0 }}
      transition={{ delay: 0.3 + dayIndex * 0.05 }}
      className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${
        isDraft ? 'hover:bg-parchment-dark/50 cursor-pointer' : ''
      } ${!item.is_clean ? 'bg-rouge/5' : ''}`}
      onClick={() => isDraft && !isDragging && onSwap()}
    >
      {isDraft && (
        <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing text-ink-muted/40 hover:text-ink-muted">
          <GripVertical size={12} />
        </div>
      )}
      <div className="w-8 h-8 rounded-md bg-parchment-dark flex items-center justify-center shrink-0 overflow-hidden relative">
        {item.photo_url ? (
          <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <Shirt size={14} className="text-ink-muted/40" />
        )}
        <div
          className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-white/60"
          style={{ background: getColorHex(item.color) }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-ink truncate">{item.name}</p>
        <p className="text-[9px] text-ink-muted uppercase tracking-wider">
          {LAYER_LABELS[layer]}
        </p>
      </div>
    </motion.div>
  );
}

export function PlannerPage() {
  const { items } = useWardrobe();
  const { rules, clashes } = useRules();
  const planner = usePlanner(items, rules, clashes);
  const { weekStart, plan, loading, pastPlans } = planner;
  const { templates, addTemplate, editTemplate, removeTemplate } = useTemplates();

  const [swapState, setSwapState] = useState<{ dayIndex: number; layer: Layer } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [savePromptDay, setSavePromptDay] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [applyTargetDay, setApplyTargetDay] = useState<number | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showWeekend, setShowWeekend] = useState(() =>
    localStorage.getItem('maison-show-weekend') === 'true'
  );
  const [activeDrag, setActiveDrag] = useState<{ item: ClothingItem; layer: Layer } | null>(null);

  // DnD sensors - 8px activation distance to avoid click conflicts
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const toggleWeekend = () => {
    setShowWeekend(prev => {
      const next = !prev;
      localStorage.setItem('maison-show-weekend', String(next));
      return next;
    });
  };

  const weekStartDate = new Date(weekStart);
  const endDay = showWeekend ? 6 : 4;
  const weekLabel = `${format(weekStartDate, 'MMM d')} – ${format(addDays(weekStartDate, endDay), 'MMM d, yyyy')}`;
  const status = plan?.status ?? 'empty';
  const isApproved = status === 'approved';
  const isDraft = status === 'draft';

  // Check if viewing current week
  const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const isViewingPast = weekStart !== currentWeekStart;

  // Laundry alert: find dirty items in the current plan
  const dirtyDayItems = useMemo(() => {
    if (!plan) return [];
    const dirty: { day: string; itemName: string; layer: string }[] = [];
    for (const day of plan.days) {
      for (const [layer, item] of Object.entries(day.items)) {
        if (item && !item.is_clean) {
          dirty.push({
            day: format(new Date(day.date), 'EEE'),
            itemName: item.name,
            layer: LAYER_LABELS[layer as Layer] || layer,
          });
        }
      }
    }
    return dirty;
  }, [plan]);

  // Set of day dates that have dirty items
  const dirtyDayDates = useMemo(() => {
    if (!plan) return new Set<string>();
    const dates = new Set<string>();
    for (const day of plan.days) {
      for (const item of Object.values(day.items)) {
        if (item && !item.is_clean) {
          dates.add(day.date);
          break;
        }
      }
    }
    return dates;
  }, [plan]);

  const openSwap = (dayIndex: number, layer: Layer) => {
    setSwapState({ dayIndex, layer });
  };

  const handleSwapSelect = (item: ClothingItem) => {
    if (!swapState) return;
    planner.swapItem(swapState.dayIndex, swapState.layer, item);
    setSwapState(null);
  };

  const swapAlternatives = swapState
    ? planner.getAlternatives(swapState.dayIndex, swapState.layer)
    : [];
  const swapCurrentItem = swapState && plan
    ? plan.days[swapState.dayIndex]?.items[swapState.layer] ?? null
    : null;
  const swapDayLabel = swapState
    ? format(addDays(weekStartDate, swapState.dayIndex), 'EEEE, MMM d')
    : '';

  const handleDragStart = (event: DragStartEvent) => {
    const { item, layer } = event.active.data.current as { item: ClothingItem; layer: Layer };
    setActiveDrag({ item, layer });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over || !plan) return;

    const sourceData = active.data.current as { item: ClothingItem; layer: Layer; dayIndex: number };
    const targetDayId = over.id as string;
    if (!targetDayId.startsWith('day-')) return;

    const targetDayIndex = parseInt(targetDayId.replace('day-', ''), 10);
    if (targetDayIndex === sourceData.dayIndex) return;

    planner.swapItemsBetweenDays(sourceData.dayIndex, targetDayIndex, sourceData.layer);
  };

  const handleDragCancel = () => {
    setActiveDrag(null);
  };

  const handleGetSuggestions = async (context?: { occasion?: string }) => {
    setSuggestionsLoading(true);
    try {
      const results = await getSmartSuggestions(items, rules, clashes, context);
      setSuggestions(results);
    } catch (err: any) {
      console.error('Suggestions failed:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleSaveTemplate = (dayIndex: number) => {
    const day = plan?.days[dayIndex];
    if (!day) return;
    setSavePromptDay(dayIndex);
    setTemplateName(`${format(new Date(day.date), 'EEE')} outfit`);
  };

  const confirmSaveTemplate = () => {
    if (savePromptDay == null || !plan || !templateName.trim()) return;
    const day = plan.days[savePromptDay];
    const itemIds: Record<Layer, string | null> = {
      'outer': null, 'top-over': null, 'top-base': null, 'dress': null,
      'bottom': null, 'footwear': null, 'accessory': null, 'bag': null,
    };
    for (const [layer, item] of Object.entries(day.items)) {
      itemIds[layer as Layer] = item?.id ?? null;
    }
    addTemplate(templateName.trim(), itemIds);
    setSavePromptDay(null);
  };

  const handleApplyTemplate = (template: { items: Record<string, string | null> }) => {
    if (applyTargetDay == null || !plan) return;
    // For each layer in the template, swap to the matching item
    for (const [layer, itemId] of Object.entries(template.items)) {
      if (!itemId) continue;
      const found = items.find(i => i.id === itemId);
      if (found) {
        planner.swapItem(applyTargetDay, layer as Layer, found);
      }
    }
    setApplyTargetDay(null);
    setTemplatesOpen(false);
  };

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-7xl">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Weekly Planner</h1>
          <p className="text-ink-muted text-sm mt-1">
            Plan your outfits for the week ahead
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAIAvailable() && (
            <Button
              variant="ghost"
              icon={<Wand2 size={16} />}
              onClick={() => setSuggestionsOpen(true)}
            >
              <span className="hidden md:inline">Suggestions</span>
              <span className="md:hidden">Suggest</span>
            </Button>
          )}
          <Button
            variant="ghost"
            icon={<LayoutTemplate size={16} />}
            onClick={() => { setApplyTargetDay(null); setTemplatesOpen(true); }}
          >
            <span className="hidden md:inline">Templates</span>
            <span className="md:hidden">Tmpl</span>
          </Button>
          {isViewingPast && (
            <Button
              variant="ghost"
              icon={<ArrowLeft size={16} />}
              onClick={() => planner.jumpToWeek(currentWeekStart)}
            >
              Current Week
            </Button>
          )}
          {isApproved && (
            <Button
              variant="ghost"
              icon={<FilePlus2 size={16} />}
              onClick={planner.newDraft}
            >
              New Draft
            </Button>
          )}
          {isDraft && (
            <Button
              variant="primary"
              icon={<Check size={16} />}
              onClick={planner.approve}
            >
              Approve Plan
            </Button>
          )}
          {!isApproved && isAIAvailable() && (
            <Button
              variant={!plan ? 'primary' : 'secondary'}
              icon={<Wand2 size={16} />}
              onClick={planner.generateAI}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'AI Generate'}
            </Button>
          )}
          {!isApproved && (
            <Button
              variant={!plan ? (isAIAvailable() ? 'secondary' : 'primary') : 'ghost'}
              icon={<Sparkles size={16} />}
              onClick={planner.generate}
              disabled={loading}
            >
              {loading ? 'Generating...' : !plan ? 'Generate Week' : 'Regenerate'}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Week Navigator */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-6">
        <button
          onClick={planner.goToPrevWeek}
          className="p-3 md:p-2 rounded-lg hover:bg-parchment-dark text-ink-muted hover:text-ink transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="font-display text-lg text-ink">{weekLabel}</p>
          {plan && (
            <span className={`
              text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full
              ${isApproved ? 'bg-sage/15 text-sage-dark' : 'bg-gold/15 text-gold-dark'}
            `}>
              {status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleWeekend}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium hover:bg-parchment-dark text-ink-muted hover:text-ink transition-colors"
            title={showWeekend ? 'Show weekdays only' : 'Show full week'}
          >
            <Calendar size={14} />
            {showWeekend ? 'Mon–Sun' : 'Mon–Fri'}
          </button>
          <button
            onClick={planner.goToNextWeek}
            className="p-3 md:p-2 rounded-lg hover:bg-parchment-dark text-ink-muted hover:text-ink transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </motion.div>

      {/* Laundry Alert Banner */}
      {dirtyDayItems.length > 0 && (
        <motion.div variants={fadeUp} className="mb-4 p-3 bg-rouge/10 border border-rouge/20 rounded-xl flex items-start gap-3">
          <WashingMachine size={18} className="text-rouge shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-rouge">Laundry Alert</p>
            <p className="text-xs text-rouge/80 mt-0.5">
              {dirtyDayItems.length} dirty {dirtyDayItems.length === 1 ? 'item' : 'items'} in this plan:{' '}
              {dirtyDayItems.map((d, i) => (
                <span key={i}>
                  <strong>{d.itemName}</strong> ({d.day})
                  {i < dirtyDayItems.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          </div>
        </motion.div>
      )}

      {/* Day Cards Grid */}
      {!plan ? (
        <motion.div variants={fadeUp} className="text-center py-20">
          <Sparkles size={48} className="mx-auto text-ink-muted/20 mb-4" />
          <p className="text-ink-muted text-sm mb-4">No plan for this week yet</p>
          <div className="flex items-center justify-center gap-3">
            {isAIAvailable() && (
              <Button variant="primary" icon={<Wand2 size={16} />} onClick={planner.generateAI} disabled={loading}>
                {loading ? 'Generating...' : 'AI Generate'}
              </Button>
            )}
            <Button variant={isAIAvailable() ? 'secondary' : 'primary'} icon={<Sparkles size={16} />} onClick={planner.generate} disabled={loading}>
              {loading ? 'Generating...' : 'Rule-Based'}
            </Button>
          </div>
        </motion.div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className={`grid gap-3 grid-cols-1 sm:grid-cols-2 ${showWeekend ? 'lg:grid-cols-7' : 'lg:grid-cols-5'}`}>
            {(showWeekend ? plan.days : plan.days.slice(0, 5)).map((day) => {
              // Use the real index in plan.days for swap/regen operations
              const realIndex = plan.days.indexOf(day);
              const dayDate = new Date(day.date);
              const isToday = format(dayDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              const isWeekend = realIndex >= 5;
              const hasDirty = dirtyDayDates.has(day.date);
              const dayItems = Object.entries(day.items)
                .filter(([, item]) => item !== null) as [Layer, ClothingItem][];

              return (
                <DroppableDayZone key={realIndex} dayIndex={realIndex}>
                  <motion.div
                    variants={fadeUp}
                    className={`
                      bg-white rounded-xl shadow-maison overflow-hidden
                      ${isToday ? 'ring-2 ring-terracotta/40' : ''}
                      ${isWeekend ? 'opacity-90' : ''}
                      ${isApproved ? 'border border-sage/30' : ''}
                    `}
                  >
                    {/* Day Header */}
                    <div className={`
                      px-3 py-2 border-b border-parchment-dark/50 flex items-center justify-between
                      ${isToday ? 'bg-terracotta/5' : 'bg-parchment/50'}
                    `}>
                      <div>
                        <p className={`text-xs font-semibold ${isToday ? 'text-terracotta' : 'text-ink'}`}>
                          {format(dayDate, 'EEE')}
                        </p>
                        <p className="text-[10px] text-ink-muted">{format(dayDate, 'd MMM')}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {hasDirty && (
                          <span className="w-2 h-2 rounded-full bg-rouge" title="Contains dirty items" />
                        )}
                        {isApproved && (
                          <span className="text-[8px] bg-sage/15 text-sage-dark px-1.5 py-0.5 rounded-full font-semibold">
                            Approved
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Outfit Items */}
                    <div className="p-2 flex flex-col gap-1.5">
                      {dayItems.length > 0 ? (
                        dayItems.map(([layer, item]) => (
                          <DraggableOutfitItem
                            key={layer}
                            item={item}
                            layer={layer}
                            dayIndex={realIndex}
                            isDraft={isDraft}
                            onSwap={() => openSwap(realIndex, layer)}
                          />
                        ))
                      ) : (
                        <div className="py-6 text-center">
                          <p className="text-[10px] text-ink-muted">No outfit</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {dayItems.length > 0 && (
                      <div className="px-2 pb-2 flex gap-1">
                        {isDraft && (
                          <>
                            <button
                              onClick={() => openSwap(realIndex, dayItems[0][0])}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] text-ink-muted hover:bg-parchment-dark hover:text-ink transition-colors"
                            >
                              <ArrowLeftRight size={10} />
                              Swap
                            </button>
                            <button
                              onClick={() => planner.regenDay(realIndex)}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] text-ink-muted hover:bg-parchment-dark hover:text-ink transition-colors"
                            >
                              <RefreshCw size={10} />
                              Regen
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleSaveTemplate(realIndex)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] text-ink-muted hover:bg-parchment-dark hover:text-ink transition-colors"
                          title="Save as template"
                        >
                          <Bookmark size={10} />
                          Save
                        </button>
                        {isDraft && (
                          <button
                            onClick={() => { setApplyTargetDay(realIndex); setTemplatesOpen(true); }}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] text-ink-muted hover:bg-parchment-dark hover:text-ink transition-colors"
                            title="Apply template"
                          >
                            <LayoutTemplate size={10} />
                            Apply
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                </DroppableDayZone>
              );
            })}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeDrag && (
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-maison-lg border border-terracotta/30 min-w-[140px]">
                <div className="w-8 h-8 rounded-md bg-parchment-dark flex items-center justify-center shrink-0 overflow-hidden">
                  {activeDrag.item.photo_url ? (
                    <img src={activeDrag.item.photo_url} alt={activeDrag.item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Shirt size={14} className="text-ink-muted/40" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-ink truncate">{activeDrag.item.name}</p>
                  <p className="text-[9px] text-ink-muted uppercase">{LAYER_LABELS[activeDrag.layer]}</p>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Past Plans */}
      {pastPlans.length > 0 && (
        <motion.div variants={fadeUp} className="mt-8">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors mb-3"
          >
            <History size={14} />
            <span>Past Plans ({pastPlans.length})</span>
            <ChevronDown size={14} className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          </button>
          {showHistory && (
            <div className="space-y-2">
              {pastPlans.map(p => (
                <div
                  key={p.id}
                  onClick={() => planner.jumpToWeek(p.week_start)}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-maison text-sm cursor-pointer hover:shadow-maison-md transition-shadow"
                >
                  <span className="text-ink font-medium">{p.week_start}</span>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    p.status === 'approved' ? 'bg-sage/15 text-sage-dark' : 'bg-gold/15 text-gold-dark'
                  }`}>
                    {p.status}
                  </span>
                  {p.approved_at && (
                    <span className="text-xs text-ink-muted ml-auto">
                      Approved {format(new Date(p.approved_at), 'MMM d')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Swap Modal */}
      <SwapModal
        open={!!swapState}
        layer={swapState?.layer ?? 'top-base'}
        dayLabel={swapDayLabel}
        currentItem={swapCurrentItem}
        alternatives={swapAlternatives}
        onSelect={handleSwapSelect}
        onClose={() => setSwapState(null)}
      />

      {/* Template List Modal */}
      <TemplateListModal
        open={templatesOpen}
        templates={templates}
        onClose={() => { setTemplatesOpen(false); setApplyTargetDay(null); }}
        onApply={(t) => {
          if (applyTargetDay != null) {
            handleApplyTemplate(t);
          } else {
            // No target day selected — prompt user to pick one
            setTemplatesOpen(false);
          }
        }}
        onRename={(id, name) => editTemplate(id, { name })}
        onDelete={removeTemplate}
      />

      {/* Suggestions Modal */}
      <SuggestionsModal
        open={suggestionsOpen}
        onClose={() => setSuggestionsOpen(false)}
        suggestions={suggestions}
        loading={suggestionsLoading}
        onGenerate={handleGetSuggestions}
      />

      {/* Save Template Name Prompt */}
      <AnimatePresence>
        {savePromptDay != null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/50 backdrop-blur-sm p-4"
            onClick={() => setSavePromptDay(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-parchment rounded-2xl shadow-maison-lg w-full max-w-sm p-5"
            >
              <h3 className="font-display text-lg text-ink mb-3">Save as Template</h3>
              <input
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmSaveTemplate()}
                placeholder="Template name"
                className="w-full bg-white border border-parchment-deep rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setSavePromptDay(null)}>Cancel</Button>
                <Button variant="primary" icon={<Bookmark size={14} />} onClick={confirmSaveTemplate}>
                  Save
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
