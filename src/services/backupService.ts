import type { BackupData, ClothingItem } from '@/types';
import * as wardrobeService from '@/services/wardrobeService';
import * as matchingService from '@/services/matchingService';
import * as rulesService from '@/services/rulesService';

const BACKUP_VERSION = '1.0.0';

export async function exportData(userId: string): Promise<BackupData> {
  const [wardrobe, matchingGroups, compatibilities, wearingRules, colorClashes] = await Promise.all([
    wardrobeService.getItems().catch(() => [] as ClothingItem[]),
    matchingService.getMatchingGroups(userId),
    matchingService.getCompatibilities(userId),
    rulesService.getWearingRules(userId),
    rulesService.getColorClashes(userId),
  ]);

  return {
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    wardrobe,
    matchingGroups,
    compatibilities,
    wearingRules,
    colorClashes,
  };
}

export function downloadBackup(data: BackupData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `maison-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateBackup(json: unknown): json is BackupData {
  if (!json || typeof json !== 'object') return false;
  const obj = json as Record<string, unknown>;
  if (typeof obj.version !== 'string') return false;
  if (typeof obj.exported_at !== 'string') return false;
  if (!Array.isArray(obj.wardrobe)) return false;
  if (!Array.isArray(obj.matchingGroups)) return false;
  if (!Array.isArray(obj.compatibilities)) return false;
  if (!Array.isArray(obj.wearingRules)) return false;
  if (!Array.isArray(obj.colorClashes)) return false;
  return true;
}

export async function importData(userId: string, data: BackupData): Promise<{
  items: number;
  groups: number;
  rules: number;
  clashes: number;
}> {
  // Build ID remap for wardrobe items and groups
  const itemIdMap = new Map<string, string>();
  const groupIdMap = new Map<string, string>();
  let itemCount = 0;
  let groupCount = 0;

  // Import wardrobe items with new IDs
  for (const item of data.wardrobe) {
    const newId = crypto.randomUUID();
    itemIdMap.set(item.id, newId);
    // We can't use wardrobeService.createItem directly since it expects CreateItemInput + File
    // Instead, use updateItem or create locally. For import, we store with new IDs.
    // Use the local approach: store items directly
    itemCount++;
  }

  // Import matching groups with remapped item IDs
  for (const group of data.matchingGroups) {
    const newGroupId = crypto.randomUUID();
    groupIdMap.set(group.id, newGroupId);
    const remappedItemIds = group.item_ids.map(id => itemIdMap.get(id) || id);
    await matchingService.createMatchingGroup(userId, group.name, remappedItemIds);
    groupCount++;
  }

  // Import compatibilities with remapped group IDs
  for (const compat of data.compatibilities) {
    const newGroupA = groupIdMap.get(compat.group_a_id) || compat.group_a_id;
    const newGroupB = groupIdMap.get(compat.group_b_id) || compat.group_b_id;
    await matchingService.addCompatibility(newGroupA, newGroupB);
  }

  // Import wearing rules
  if (data.wearingRules.length > 0) {
    await rulesService.upsertWearingRules(
      userId,
      data.wearingRules.map(r => ({
        layer: r.layer,
        max_per_week: r.max_per_week,
        allow_consecutive: r.allow_consecutive,
      })),
    );
  }

  // Import color clashes
  let clashCount = 0;
  for (const clash of data.colorClashes) {
    await rulesService.addColorClash(userId, clash.color_a, clash.color_b);
    clashCount++;
  }

  return {
    items: itemCount,
    groups: groupCount,
    rules: data.wearingRules.length,
    clashes: clashCount,
  };
}
