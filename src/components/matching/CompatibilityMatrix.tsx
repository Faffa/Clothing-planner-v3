import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, Plus } from 'lucide-react';
import type { MatchingGroup, GroupCompatibility } from '@/types';
import { fadeUp } from '@/lib/animations';

interface CompatibilityMatrixProps {
  groups: MatchingGroup[];
  compatibilities: GroupCompatibility[];
  onAdd: (groupAId: string, groupBId: string) => void;
  onRemove: (compatId: string) => void;
}

export function CompatibilityMatrix({ groups, compatibilities, onAdd, onRemove }: CompatibilityMatrixProps) {
  // Build a lookup: "groupA-groupB" -> compat id (sorted keys for consistency)
  const compatMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of compatibilities) {
      const key = [c.group_a_id, c.group_b_id].sort().join('-');
      map.set(key, c.id);
    }
    return map;
  }, [compatibilities]);

  const isCompatible = (a: string, b: string) => {
    const key = [a, b].sort().join('-');
    return compatMap.get(key);
  };

  const toggleCompat = (a: string, b: string) => {
    const compatId = isCompatible(a, b);
    if (compatId) {
      onRemove(compatId);
    } else {
      onAdd(a, b);
    }
  };

  if (groups.length < 2) return null;

  return (
    <motion.div variants={fadeUp} className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-28" />
            {groups.map(g => (
              <th key={g.id} className="text-[10px] text-ink-muted uppercase tracking-wider font-medium p-2 text-center min-w-[80px]">
                <span className="truncate block max-w-[80px]" title={g.name}>{g.name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((rowGroup, rowIdx) => (
            <tr key={rowGroup.id}>
              <td className="text-[10px] text-ink-muted uppercase tracking-wider font-medium p-2 text-right">
                <span className="truncate block max-w-[100px]" title={rowGroup.name}>{rowGroup.name}</span>
              </td>
              {groups.map((colGroup, colIdx) => {
                // Only render upper triangle
                if (colIdx <= rowIdx) {
                  return (
                    <td key={colGroup.id} className="p-1.5">
                      <div className={`w-full aspect-square rounded-lg ${colIdx === rowIdx ? 'bg-parchment-dark/30' : ''}`} />
                    </td>
                  );
                }

                const compatId = isCompatible(rowGroup.id, colGroup.id);
                const compatible = !!compatId;

                return (
                  <td key={colGroup.id} className="p-1.5">
                    <button
                      onClick={() => toggleCompat(rowGroup.id, colGroup.id)}
                      className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all duration-200 ${
                        compatible
                          ? 'bg-terracotta text-white shadow-sm hover:bg-terracotta-dark'
                          : 'bg-parchment-dark/30 text-transparent hover:bg-parchment-dark hover:text-ink-muted'
                      }`}
                      title={compatible
                        ? `${rowGroup.name} ↔ ${colGroup.name}: compatible (click to remove)`
                        : `${rowGroup.name} ↔ ${colGroup.name}: click to make compatible`
                      }
                    >
                      {compatible ? <Check size={14} /> : <Plus size={14} />}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
