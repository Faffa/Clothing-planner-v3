import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Link2, Shirt, X, Layers, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { AddGroupModal } from '@/components/matching/AddGroupModal';
import { EditGroupModal } from '@/components/matching/EditGroupModal';
import { useMatching } from '@/hooks/useMatching';
import { useWardrobe } from '@/hooks/useWardrobe';
import { stagger, fadeUp } from '@/lib/animations';
import { Skeleton } from '@/components/common/Skeleton';
import { CompatibilityMatrix } from '@/components/matching/CompatibilityMatrix';
import type { MatchingGroup } from '@/types';

export function MatchingPage() {
  const { items } = useWardrobe();
  const { groups, compatibilities, loading, addGroup, editGroup, removeGroup, addCompat, removeCompat } = useMatching();

  const [addOpen, setAddOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MatchingGroup | null>(null);
  const [compatA, setCompatA] = useState('');
  const [compatB, setCompatB] = useState('');
  const [compatView, setCompatView] = useState<'list' | 'matrix'>('list');

  // Build item lookup map
  const itemMap = useMemo(() => {
    const map = new Map(items.map(i => [i.id, i]));
    return map;
  }, [items]);

  const handleAddCompat = () => {
    if (!compatA || !compatB || compatA === compatB) return;
    // Check for duplicate
    const exists = compatibilities.some(
      c => (c.group_a_id === compatA && c.group_b_id === compatB) ||
           (c.group_a_id === compatB && c.group_b_id === compatA),
    );
    if (exists) return;
    addCompat(compatA, compatB);
    setCompatA('');
    setCompatB('');
  };

  const getGroupName = (id: string) => groups.find(g => g.id === id)?.name ?? 'Unknown';

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-6xl">
      <motion.div variants={fadeUp} className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Matching Groups</h1>
          <p className="text-ink-muted text-sm mt-1">Group compatible items and define which groups work together</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>
          New Group
        </Button>
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && groups.length === 0 && (
        <motion.div variants={fadeUp} className="text-center py-20 mb-10">
          <Layers size={48} className="mx-auto text-ink-muted/20 mb-4" />
          <p className="text-ink-muted text-sm mb-4">No matching groups yet</p>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>
            Create Your First Group
          </Button>
        </motion.div>
      )}

      {/* Groups Grid */}
      {!loading && groups.length > 0 && (
        <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {groups.map(group => {
            const groupItems = group.item_ids
              .map(id => itemMap.get(id))
              .filter(Boolean);

            return (
              <motion.div
                key={group.id}
                variants={fadeUp}
                whileHover={{ y: -2 }}
                onClick={() => setEditingGroup(group)}
                className="bg-white rounded-xl shadow-maison p-5 cursor-pointer hover:shadow-maison-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-display text-lg text-ink">{group.name}</h3>
                  <span className="ml-auto text-[10px] text-ink-muted bg-parchment-dark px-2 py-0.5 rounded-full">
                    {group.item_ids.length} items
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {groupItems.slice(0, 6).map(item => item && (
                    <div
                      key={item.id}
                      className="inline-flex items-center gap-1.5 text-[11px] bg-parchment-dark text-ink-light px-2 py-1 rounded-md"
                    >
                      {item.photo_url ? (
                        <img src={item.photo_url} alt="" className="w-4 h-4 rounded object-cover" />
                      ) : (
                        <Shirt size={10} />
                      )}
                      {item.name}
                    </div>
                  ))}
                  {groupItems.length > 6 && (
                    <span className="text-[10px] text-ink-muted self-center">
                      +{groupItems.length - 6} more
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Compatibility Section */}
      {!loading && groups.length > 0 && (
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-ink flex items-center gap-2">
              <Link2 size={18} className="text-terracotta" />
              Compatibility
            </h2>
            {groups.length >= 2 && (
              <div className="flex items-center gap-1 bg-parchment-dark rounded-lg p-0.5">
                <button
                  onClick={() => setCompatView('list')}
                  className={`p-1.5 rounded-md transition-colors flex items-center gap-1 text-xs ${compatView === 'list' ? 'bg-white shadow-sm text-ink' : 'text-ink-muted'}`}
                >
                  <List size={12} />
                  List
                </button>
                <button
                  onClick={() => setCompatView('matrix')}
                  className={`p-1.5 rounded-md transition-colors flex items-center gap-1 text-xs ${compatView === 'matrix' ? 'bg-white shadow-sm text-ink' : 'text-ink-muted'}`}
                >
                  <LayoutGrid size={12} />
                  Matrix
                </button>
              </div>
            )}
          </div>

          {compatView === 'matrix' && groups.length >= 2 ? (
            <div className="bg-white rounded-xl shadow-maison p-5">
              <p className="text-ink-muted text-xs mb-4">Click cells to toggle compatibility between groups.</p>
              <CompatibilityMatrix
                groups={groups}
                compatibilities={compatibilities}
                onAdd={addCompat}
                onRemove={removeCompat}
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-maison p-5">
              <p className="text-ink-muted text-xs mb-4">Groups that are marked as compatible will mix items in outfit generation.</p>

              {/* Existing compatibilities */}
              {compatibilities.length > 0 && (
                <div className="space-y-2 mb-4">
                  {compatibilities.map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-3 bg-parchment/50 rounded-lg">
                      <span className="text-sm font-medium text-ink">{getGroupName(c.group_a_id)}</span>
                      <Link2 size={14} className="text-gold" />
                      <span className="text-sm font-medium text-ink">{getGroupName(c.group_b_id)}</span>
                      <button
                        onClick={() => removeCompat(c.id)}
                        className="ml-auto p-1 rounded-md text-ink-muted hover:text-rouge hover:bg-rouge/10 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {compatibilities.length === 0 && (
                <p className="text-xs text-ink-muted mb-4">No compatibility rules defined yet.</p>
              )}

              {/* Add compatibility */}
              {groups.length >= 2 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <select
                    value={compatA}
                    onChange={e => setCompatA(e.target.value)}
                    className="flex-1 bg-parchment border border-parchment-deep rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-terracotta/30"
                  >
                    <option value="">Select group...</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <Link2 size={14} className="text-ink-muted shrink-0" />
                  <select
                    value={compatB}
                    onChange={e => setCompatB(e.target.value)}
                    className="flex-1 bg-parchment border border-parchment-deep rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-terracotta/30"
                  >
                    <option value="">Select group...</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Plus size={14} />}
                    onClick={handleAddCompat}
                    disabled={!compatA || !compatB || compatA === compatB}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Modals */}
      <AddGroupModal
        open={addOpen}
        items={items}
        onClose={() => setAddOpen(false)}
        onSubmit={addGroup}
      />
      <EditGroupModal
        open={!!editingGroup}
        group={editingGroup}
        items={items}
        onClose={() => setEditingGroup(null)}
        onSave={editGroup}
        onDelete={removeGroup}
      />
    </motion.div>
  );
}
