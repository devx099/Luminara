import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { X } from './icons';

interface SettingsViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile | ((profile: UserProfile) => UserProfile)) => void;
  onClose: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ userProfile, onUpdateProfile, onClose, showToast }) => {
  const [profile, setProfile] = useState<UserProfile>(userProfile);

  useEffect(() => {
    setProfile(userProfile);
  }, [userProfile]);

  const handleSave = () => {
    onUpdateProfile(profile);
    showToast('Settings saved successfully!', 'success');
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all application data? This cannot be undone.')) {
        localStorage.removeItem('luminara-agents');
        localStorage.removeItem('luminara-profile');
        localStorage.removeItem('luminara-auth');
        showToast('Application data has been reset.', 'info');
        window.location.reload();
    }
  }

  const handleExport = () => {
    try {
        const data = {
            userProfile: userProfile,
            agents: JSON.parse(localStorage.getItem('luminara-agents') || '[]')
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `luminara_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Data exported successfully.', 'success');
    } catch (e) {
        showToast('Failed to export data.', 'error');
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <header className="p-6 border-b dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold dark:text-white">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Profile Section */}
          <section>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:text-gray-200 dark:border-gray-600">Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </section>

          {/* Appearance Section */}
          <section>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:text-gray-200 dark:border-gray-600">Appearance</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                    <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 p-1">
                        {['light', 'dark', 'system'].map(theme => (
                            <button
                                key={theme}
                                onClick={() => setProfile(p => ({...p, preferences: {...p.preferences, theme: theme as any}}))}
                                className={`w-full capitalize py-2 text-sm font-semibold rounded-md transition-colors ${profile.preferences.theme === theme ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'}`}
                            >
                                {theme}
                            </button>
                        ))}
                    </div>
                </div>
                 <div className="flex items-center justify-between">
                    <label htmlFor="selectionColor" className="text-sm font-medium text-gray-700 dark:text-gray-300">Text Selection Color</label>
                    <input
                        id="selectionColor"
                        type="color"
                        value={profile.preferences.selectionColor}
                        onChange={(e) => setProfile(p => ({...p, preferences: {...p.preferences, selectionColor: e.target.value }}))}
                        className="w-10 h-10 p-1 border border-gray-300 rounded-md cursor-pointer dark:border-gray-600 bg-white dark:bg-gray-700"
                    />
                </div>
            </div>
          </section>

           {/* Data Management Section */}
          <section>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:text-gray-200 dark:border-gray-600">Data Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={handleExport} className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 text-center">Export My Data</button>
                <button onClick={handleReset} className="w-full px-4 py-2 border-2 border-red-300 dark:border-red-500/50 text-red-600 dark:text-red-400 rounded-lg font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 text-center">Reset Application</button>
            </div>
          </section>
          
           {/* Support Section */}
          <section>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:text-gray-200 dark:border-gray-600">Support</h3>
            <div className="grid grid-cols-1">
                <a href="mailto:support@luminara.app?subject=Bug Report for Luminara" className="w-full text-center px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700">Report a Bug</a>
            </div>
          </section>
        </main>

        <footer className="p-6 border-t bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">
            Cancel
          </button>
          <button onClick={handleSave} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
            Save Changes
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SettingsView;