import { motion } from 'framer-motion';
import {
  User,
  Thermometer,
  Calendar,
  Download,
  Upload,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';

import { stagger, fadeUp } from '@/lib/animations';

export function SettingsPage() {
  const { profile } = useAuth();

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer size={16} className="text-ink-muted" />
              <span className="text-sm text-ink">Temperature Unit</span>
            </div>
            <select className="text-xs bg-parchment border border-parchment-deep rounded-lg px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-terracotta/30">
              <option value="celsius">Celsius (&deg;C)</option>
              <option value="fahrenheit">Fahrenheit (&deg;F)</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
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
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" icon={<Download size={14} />}>Export Data</Button>
          <Button variant="ghost" size="sm" icon={<Upload size={14} />}>Import Data</Button>
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
