import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Thermometer,
  Calendar,
  Download,
  Upload,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/common/Button';
import { exportData, downloadBackup, validateBackup, importData } from '@/services/backupService';

import { stagger, fadeUp } from '@/lib/animations';

export function SettingsPage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const data = await exportData(user.id);
      downloadBackup(data);
      showToast('Backup exported');
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Failed to export data', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setImporting(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      if (!validateBackup(json)) {
        showToast('Invalid backup file format', 'error');
        return;
      }

      const summary = [
        json.wardrobe.length && `${json.wardrobe.length} items`,
        json.matchingGroups.length && `${json.matchingGroups.length} groups`,
        json.wearingRules.length && `${json.wearingRules.length} rules`,
        json.colorClashes.length && `${json.colorClashes.length} color clashes`,
      ].filter(Boolean).join(', ');

      if (!window.confirm(`Import ${summary}? This will merge with your existing data.`)) {
        return;
      }

      const result = await importData(user.id, json);
      showToast(`Imported: ${result.groups} groups, ${result.rules} rules, ${result.clashes} clashes`);
    } catch (err) {
      console.error('Import failed:', err);
      showToast('Failed to import data', 'error');
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-3xl">
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="font-display text-3xl text-ink">Settings</h1>
        <p className="text-ink-muted text-sm mt-1">Manage your preferences and account</p>
      </motion.div>

      {/* Profile */}
      <motion.div variants={fadeUp} className="bg-white rounded-xl shadow-maison p-6 mb-4">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-terracotta" />
          <h2 className="font-display text-lg text-ink">Profile</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-ink-muted block mb-1">Display Name</label>
            <input
              type="text"
              defaultValue={profile?.display_name}
              className="w-full text-sm bg-parchment border border-parchment-deep rounded-lg px-3 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
            />
          </div>
          <div>
            <label className="text-xs text-ink-muted block mb-1">Location</label>
            <input
              type="text"
              defaultValue={profile?.location || ''}
              placeholder="City, Country"
              className="w-full text-sm bg-parchment border border-parchment-deep rounded-lg px-3 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
            />
          </div>
        </div>
      </motion.div>

      {/* Preferences */}
      <motion.div variants={fadeUp} className="bg-white rounded-xl shadow-maison p-6 mb-4">
        <h2 className="font-display text-lg text-ink mb-4">Preferences</h2>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Thermometer size={16} className="text-ink-muted" />
              <span className="text-sm text-ink">Temperature Unit</span>
            </div>
            <select className="text-xs bg-parchment border border-parchment-deep rounded-lg px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30">
              <option value="celsius">Celsius (&deg;C)</option>
              <option value="fahrenheit">Fahrenheit (&deg;F)</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-ink-muted" />
              <span className="text-sm text-ink">Week Starts On</span>
            </div>
            <select className="text-xs bg-parchment border border-parchment-deep rounded-lg px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30">
              <option value="monday">Monday</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Data */}
      <motion.div variants={fadeUp} className="bg-white rounded-xl shadow-maison p-6 mb-4">
        <h2 className="font-display text-lg text-ink mb-4">Data</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon={exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            onClick={handleExport}
            disabled={exporting || importing}
          >
            {exporting ? 'Exporting...' : 'Export Data'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            onClick={handleImportClick}
            disabled={exporting || importing}
          >
            {importing ? 'Importing...' : 'Import Data'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={fadeUp} className="bg-white rounded-xl shadow-maison p-6 border border-rouge/20">
        <h2 className="font-display text-lg text-rouge mb-2">Danger Zone</h2>
        <p className="text-ink-muted text-xs mb-4">This action cannot be undone.</p>
        <Button variant="danger" size="sm" icon={<Trash2 size={14} />}>Delete Account</Button>
      </motion.div>
    </motion.div>
  );
}
