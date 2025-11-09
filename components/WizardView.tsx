import React, { useState } from 'react';
import type { UserProfile } from '../types';
import { Loader, Zap } from './icons';

interface WizardViewProps {
  onClose: () => void;
  onCreateAgent: (params: any) => Promise<void>;
  userProfile: UserProfile;
}

const WizardView: React.FC<WizardViewProps> = ({ onClose, onCreateAgent, userProfile }) => {
  const [wizardStep, setWizardStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const [wizardGoal, setWizardGoal] = useState('');
  const [wizardDeadline, setWizardDeadline] = useState('');
  const [wizardDailyHours, setWizardDailyHours] = useState('');
  const [wizardPriority, setWizardPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [wizardGranularity, setWizardGranularity] = useState<'minimal' | 'balanced' | 'detailed'>('balanced');
  const [wizardAutoExecute, setWizardAutoExecute] = useState(false);
  
  const handleCreate = async () => {
    setIsGenerating(true);
    await onCreateAgent({
        wizardGoal,
        wizardDeadline,
        wizardDailyHours,
        wizardPriority,
        wizardGranularity,
        wizardAutoExecute
    });
    setIsGenerating(false);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold mb-6 dark:text-white">Create New Agent</h2>
        
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map(step => (
            <React.Fragment key={step}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${wizardStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                {step}
              </div>
              {step < 3 && <div className={`flex-1 h-1 mx-2 ${wizardStep > step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />}
            </React.Fragment>
          ))}
        </div>

        {wizardStep === 1 && (
          <div>
            <label className="block text-sm font-semibold mb-2 dark:text-gray-300">What's your goal?</label>
            <textarea
              className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 focus:border-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={5}
              placeholder="E.g., Prepare for Data Structures exam on Nov 20. I can study 2 hours each night."
              value={wizardGoal}
              onChange={(e) => setWizardGoal(e.target.value)}
              autoFocus
            />
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={onClose} className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">Cancel</button>
              <button onClick={() => setWizardStep(2)} disabled={!wizardGoal.trim()} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}

        {wizardStep === 2 && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Optional: Add constraints to help the AI build a better schedule.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-gray-300">Deadline <span className="text-gray-500">(optional)</span></label>
                <input type="date" className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:border-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" min={today} value={wizardDeadline} onChange={(e) => setWizardDeadline(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-gray-300">Daily hours available <span className="text-gray-500">(optional)</span></label>
                <input type="number" className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:border-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="e.g., 2" min="0.5" step="0.5" value={wizardDailyHours} onChange={(e) => setWizardDailyHours(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-gray-300">Priority</label>
                <select className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:border-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" value={wizardPriority} onChange={(e) => setWizardPriority(e.target.value as any)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setWizardStep(1)} className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">Back</button>
              <button onClick={() => setWizardStep(3)} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Next</button>
            </div>
          </div>
        )}

        {wizardStep === 3 && (
          <div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-2 dark:text-gray-200">Review</h3>
              <p className="text-sm text-gray-800 dark:text-gray-300"><strong>Goal:</strong> {wizardGoal}</p>
              {wizardDeadline && <p className="text-sm text-gray-800 dark:text-gray-300"><strong>Deadline:</strong> {new Date(wizardDeadline).toLocaleDateString()}</p>}
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3 dark:text-gray-300">Task Detail Level</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'minimal', label: 'Minimal', desc: '1-3 tasks' },
                  { value: 'balanced', label: 'Balanced', desc: '4-8 tasks' },
                  { value: 'detailed', label: 'Detailed', desc: '9-15 tasks' }
                ].map(opt => (
                  <button key={opt.value} onClick={() => setWizardGranularity(opt.value as any)} className={`p-4 rounded-lg border-2 text-left ${wizardGranularity === opt.value ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'}`}>
                    <div className="font-semibold text-sm dark:text-gray-200">{opt.label}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <input type="checkbox" id="autoExec" checked={wizardAutoExecute} onChange={(e) => setWizardAutoExecute(e.target.checked)} className="w-5 h-5 mt-0.5 accent-blue-600" />
              <label htmlFor="autoExec" className="text-sm dark:text-gray-300">
                <span className="font-semibold">Auto-execute actions</span>
                <span className="text-gray-600 dark:text-gray-400 block mt-1">Agent will perform low-risk actions automatically. Max {userProfile.preferences.max_daily_actions} per day.</span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setWizardStep(2)} disabled={isGenerating} className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">Back</button>
              <button onClick={handleCreate} disabled={isGenerating} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {isGenerating ? <span className="flex items-center gap-2 text-white"><Loader className="w-5 h-5 animate-spin" />Generating...</span> : <><Zap className="w-5 h-5" />Create Agent</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WizardView;