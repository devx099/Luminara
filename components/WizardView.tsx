import React, { useState } from 'react';
import type { UserProfile, Task } from '../types';
import { Loader, Zap, Send, CheckCircle, Circle, Clock } from './icons';
import { generateAgentPlan, reviseAgentPlan } from '../services/geminiService';

interface WizardViewProps {
  onClose: () => void;
  onCreateAgent: (plan: any, params: any) => Promise<void>;
  userProfile: UserProfile;
}

const WizardView: React.FC<WizardViewProps> = ({ onClose, onCreateAgent, userProfile }) => {
  const [wizardStep, setWizardStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Step 1 & 2 State ---
  const [wizardGoal, setWizardGoal] = useState('');
  const [wizardDeadline, setWizardDeadline] = useState('');
  const [wizardDailyHours, setWizardDailyHours] = useState('');
  const [wizardPriority, setWizardPriority] = useState<'low' | 'medium' | 'high'>('medium');
  
  // --- Step 3 State ---
  const [wizardGranularity, setWizardGranularity] = useState<'minimal' | 'balanced' | 'detailed'>('balanced');
  const [wizardAutoExecute, setWizardAutoExecute] = useState(false);
  const [wizardUseWebSearch, setWizardUseWebSearch] = useState(false);

  // --- Step 4 State (Review) ---
  const [generatedPlan, setGeneratedPlan] = useState<any | null>(null);
  const [revisionInput, setRevisionInput] = useState('');
  const [isRevising, setIsRevising] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const plan = await generateAgentPlan(wizardGoal, {
        deadline: wizardDeadline,
        daily_hours: wizardDailyHours,
        granularity: wizardGranularity,
        useWebSearch: wizardUseWebSearch,
      });
      setGeneratedPlan(plan);
      setWizardStep(4);
    } catch (e: any) {
      setError(e.message || "An unknown error occurred during plan generation.");
      // Stay on step 3 to show the error
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevision = async () => {
    if (!revisionInput.trim() || !generatedPlan) return;
    setIsRevising(true);
    setError(null);
    try {
        const revisedPlan = await reviseAgentPlan(wizardGoal, generatedPlan, revisionInput);
        setGeneratedPlan(revisedPlan);
        setRevisionInput('');
    } catch(e: any) {
        setError(e.message || "An unknown error occurred during plan revision.");
    } finally {
        setIsRevising(false);
    }
  };
  
  const handleCreate = async () => {
    if (!generatedPlan) return;
    await onCreateAgent(generatedPlan, {
        wizardGoal,
        wizardDeadline,
        wizardPriority,
        wizardGranularity,
        wizardAutoExecute
    });
  };

  const today = new Date().toISOString().split('T')[0];

  const renderContent = () => {
    switch(wizardStep) {
        case 1: return (
          <div>
            <label className="block text-sm font-semibold mb-2 dark:text-gray-300">What's your goal?</label>
            <textarea
              className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 focus:border-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={5}
              placeholder="E.g., Plan a 5-day trip to Tokyo in April, focusing on cherry blossoms and food."
              value={wizardGoal}
              onChange={(e) => setWizardGoal(e.target.value)}
              autoFocus
            />
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={onClose} className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">Cancel</button>
              <button onClick={() => setWizardStep(2)} disabled={!wizardGoal.trim()} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">Next</button>
            </div>
          </div>
        );
        case 2: return (
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
        );
        case 3: return (
           <div>
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
            
            <div className="flex items-start gap-3 mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <input type="checkbox" id="useWebSearch" checked={wizardUseWebSearch} onChange={(e) => setWizardUseWebSearch(e.target.checked)} className="w-5 h-5 mt-0.5 accent-blue-600" />
              <label htmlFor="useWebSearch" className="text-sm dark:text-gray-300">
                <span className="font-semibold">Enable Web Search (Experimental)</span>
                <span className="text-gray-600 dark:text-gray-400 block mt-1">Allows agent to use Google Search for goals requiring up-to-date info.</span>
              </label>
            </div>

            <div className="flex items-start gap-3 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <input type="checkbox" id="autoExec" checked={wizardAutoExecute} onChange={(e) => setWizardAutoExecute(e.target.checked)} className="w-5 h-5 mt-0.5 accent-blue-600" />
              <label htmlFor="autoExec" className="text-sm dark:text-gray-300">
                <span className="font-semibold">Auto-execute actions</span>
                <span className="text-gray-600 dark:text-gray-400 block mt-1">Agent will perform low-risk actions automatically. Max {userProfile.preferences.max_daily_actions} per day.</span>
              </label>
            </div>
            
            {error && <div className="text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg my-4">{error}</div>}

            <div className="flex justify-end gap-3">
              <button onClick={() => setWizardStep(2)} disabled={isGenerating} className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">Back</button>
              <button onClick={handleGeneratePlan} disabled={isGenerating} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {isGenerating ? <><Loader className="w-5 h-5 animate-spin" />Generating Plan...</> : <>Generate Plan</>}
              </button>
            </div>
          </div>
        );
        case 4: return (
            <div>
                <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg mb-4">
                    <h3 className="text-lg font-bold dark:text-gray-200">{generatedPlan.agent_name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{generatedPlan.description}</p>
                    <p className="text-xs text-gray-500 mt-2 italic">"{generatedPlan.explanation}"</p>
                </div>
                
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto pr-2">
                    {generatedPlan.tasks.map((task: Task) => (
                        <div key={task.id} className="bg-white dark:bg-gray-700/50 p-3 rounded-md border dark:border-gray-600">
                           <div className="flex items-start gap-3">
                                <Circle className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm dark:text-gray-200">{task.title}</h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{task.description}</p>
                                </div>
                           </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4">
                     <label className="block text-sm font-semibold mb-2 dark:text-gray-300">Request Revision</label>
                     <div className="flex gap-2">
                         <input 
                            type="text" 
                            value={revisionInput}
                            onChange={(e) => setRevisionInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleRevision()}
                            placeholder="e.g., Make the first task more detailed."
                            className="flex-1 border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            disabled={isRevising}
                        />
                         <button onClick={handleRevision} disabled={isRevising || !revisionInput.trim()} className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2">
                             {isRevising ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                         </button>
                     </div>
                </div>

                {error && <div className="text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg my-4">{error}</div>}

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={() => { setGeneratedPlan(null); setWizardStep(3); }} className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">Back to Config</button>
                    <button onClick={handleCreate} className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2">
                        <Zap className="w-5 h-5" />Accept & Create Agent
                    </button>
                </div>
            </div>
        );
    }
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto flex flex-col">
        <h2 className="text-3xl font-bold mb-6 dark:text-white">
            {wizardStep < 4 ? 'Create New Agent' : 'Review Plan'}
        </h2>
        
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map(step => (
            <React.Fragment key={step}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${wizardStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                {step < 4 ? step : <CheckCircle className="w-5 h-5" />}
              </div>
              {step < 4 && <div className={`flex-1 h-1 mx-2 ${wizardStep > step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />}
            </React.Fragment>
          ))}
        </div>
        
        <div className="flex-grow">
            {renderContent()}
        </div>

      </div>
    </div>
  );
};

export default WizardView;
