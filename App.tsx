import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Brain, Plus, Settings, LogOut, Home, CalendarDays } from './components/icons';
import type { Agent, Task, Message, UserProfile, ToastState, ActionLogEntry } from './types';
import { generateChatMessage, detectCompletedTasksFromChat } from './services/geminiService';
import useLocalStorage from './hooks/useLocalStorage';
import Dashboard from './components/Dashboard';
import WorkspaceView from './components/WorkspaceView';
import WizardView from './components/WizardView';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import Toast from './components/Toast';
import SettingsView from './components/SettingsView';
import LoginPage from './components/LoginPage';
import HomeView from './components/HomeView';
import CalendarView from './components/CalendarView';
import { findBestTaskMatch } from './utils';

const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = (Math.random() * 16) | 0;
  const v = c === 'x' ? r : (r & 0x3) | 0x8;
  return v.toString(16);
});

type ViewType = 'home' | 'dashboard' | 'workspace' | 'calendar';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('home');
  const [agents, setAgents] = useLocalStorage<Agent[]>('luminara-agents', []);
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('luminara-profile', {
    name: "Dev Sharma",
    email: "dev@example.com",
    timezone: "Asia/Kolkata",
    preferences: {
      default_auto_execute: false,
      default_granularity: "balanced",
      max_daily_actions: 5,
      theme: 'light',
      selectionColor: '#3b82f6', // blue-500
    },
    isGoogleConnected: false,
  });
  
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Agent | null>(null);
  const [executingTasks, setExecutingTasks] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // On initial load, check if the user is already authenticated
    const loggedIn = localStorage.getItem('luminara-auth') === 'true';
    if (loggedIn) {
        setIsAuthenticated(true);
        setView('home');
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const theme = userProfile.preferences.theme;
    
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    root.classList.toggle('dark', isDark);

    const styleId = 'custom-selection-style';
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    // A bit of opacity makes it look better over text
    const color = userProfile.preferences.selectionColor;
    const alphaColor = color.length === 7 ? `${color}b3` : color; // Add alpha if not present
    styleTag.innerHTML = `::selection { background-color: ${alphaColor}; color: white; }`;

  }, [userProfile.preferences.theme, userProfile.preferences.selectionColor]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', undoAction?: () => void) => {
    if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type, undoAction });
    toastTimeoutRef.current = window.setTimeout(() => {
        setToast(null);
        toastTimeoutRef.current = null;
    }, undoAction ? 10000 : 4000);
  }, []);

  const handleLogin = (email: string, password: string) => {
    setUserProfile(p => ({ ...p, email }));
    setIsAuthenticated(true);
    setView('home');
    localStorage.setItem('luminara-auth', 'true');
    showToast(`Welcome back, ${userProfile.name}!`, 'success');
  };

  const handleRegister = (name: string, email: string, password: string) => {
    setUserProfile(p => ({ ...p, name, email }));
    setIsAuthenticated(true);
    setView('home');
    localStorage.setItem('luminara-auth', 'true');
    showToast(`Welcome, ${name}! Your account has been created.`, 'success');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('luminara-auth');
    setView('home');
    setSelectedAgent(null);
    showToast('You have been logged out.', 'info');
  };

  const createAgent = async (plan: any, params: any) => {
    const { wizardGoal, wizardDeadline, wizardPriority, wizardGranularity, wizardAutoExecute } = params;
    try {
      const newAgent: Agent = {
        id: generateUUID(),
        name: plan.agent_name,
        description: plan.description,
        goal: wizardGoal,
        status: 'active',
        created_at: new Date().toISOString(),
        deadline: wizardDeadline || null,
        priority: wizardPriority,
        tasks: plan.tasks.map((task: any) => ({
          ...task,
          id: generateUUID(),
          status: 'pending',
          created_at: new Date().toISOString(),
        })),
        progress: 0,
        chat: [{
          role: 'assistant',
          content: `Hello! I'm your new agent, **${plan.agent_name}**. ${plan.explanation}`,
          timestamp: new Date().toISOString(),
        }],
        config: {
          auto_execute: wizardAutoExecute,
          max_daily_actions: userProfile.preferences.max_daily_actions,
          granularity: wizardGranularity,
        },
        actions_log: [],
      };

      setAgents(prev => [...prev, newAgent]);
      showToast(`Agent "${newAgent.name}" created successfully!`, 'success');
      setShowWizard(false);
      setSelectedAgent(newAgent);
      setView('workspace');
    } catch (error: any) {
      showToast(error.message || 'Failed to create agent. Please try again.', 'error');
    }
  };
  
  const updateAgent = (agentId: string, updates: Partial<Agent> | ((agent: Agent) => Partial<Agent>)) => {
    setAgents(prev => prev.map(agent => {
        if (agent.id === agentId) {
            const newValues = typeof updates === 'function' ? updates(agent) : updates;
            const updatedAgent = { ...agent, ...newValues };
            
            if (newValues.tasks) {
                const completed = updatedAgent.tasks.filter(t => t.status === 'completed').length;
                updatedAgent.progress = updatedAgent.tasks.length > 0 ? Math.round((completed / updatedAgent.tasks.length) * 100) : 0;
            }

            if (selectedAgent?.id === agentId) {
                setSelectedAgent(updatedAgent);
            }
            return updatedAgent;
        }
        return agent;
    }));
  };

  const updateTask = (agentId: string, taskId: string, updates: Partial<Task>) => {
    updateAgent(agentId, agent => ({
        tasks: agent.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
    }));
  };

  const executeAction = async (agentId: string, taskId: string) => {
    if (executingTasks.has(taskId)) return;

    const agent = agents.find(a => a.id === agentId);
    const task = agent?.tasks.find(t => t.id === taskId);
    if (!task) return;

    setExecutingTasks(prev => new Set(prev).add(taskId));
    updateTask(agentId, taskId, { status: 'in_progress' });
    
    const logEntry: Omit<ActionLogEntry, 'status' | 'error'> = {
        timestamp: new Date().toISOString(),
        taskId: task.id,
        taskTitle: task.title,
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      const success = Math.random() > 0.1;

      if (success) {
        updateTask(agentId, taskId, { status: 'completed', completed_at: new Date().toISOString() });
        showToast(`Task "${task.title}" completed!`, 'success');
        updateAgent(agentId, agent => ({
            chat: [...agent.chat, {
                role: 'system',
                content: `✓ Agent completed task: **"${task.title}"**.`,
                timestamp: new Date().toISOString()
            }],
            actions_log: [...agent.actions_log, { ...logEntry, status: 'success' }]
        }));
      } else {
        throw new Error('Simulated action failure');
      }
    } catch (error: any) {
      updateTask(agentId, taskId, { status: 'failed', last_error: error.message });
      showToast(`Action for "${task.title}" failed.`, 'error');
      updateAgent(agentId, agent => ({
          actions_log: [...agent.actions_log, { ...logEntry, status: 'failure', error: error.message }]
      }));
    } finally {
      setExecutingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };
  
  const sendMessage = async (agentId: string, message: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    const userMsg: Message = { role: 'user', content: message, timestamp: new Date().toISOString() };
    updateAgent(agentId, a => ({ chat: [...a.chat, userMsg] }));

    const completedTaskTitles = await detectCompletedTasksFromChat(message, agent.tasks);
    if (completedTaskTitles && completedTaskTitles.length > 0) {
        const completedTasks: Task[] = [];
        completedTaskTitles.forEach(title => {
            const taskToComplete = findBestTaskMatch(title, agent.tasks);
            if (taskToComplete && taskToComplete.status !== 'completed') {
                updateTask(agentId, taskToComplete.id, { status: 'completed', completed_at: new Date().toISOString() });
                completedTasks.push(taskToComplete);
            }
        });

        if (completedTasks.length > 0) {
            const content = completedTasks.length === 1 
                ? `✓ You marked **"${completedTasks[0].title}"** as complete.`
                : `✓ You marked ${completedTasks.length} tasks as complete:\n${completedTasks.map(t => `* **"${t.title}"**`).join('\n')}`;
            
            const systemMsg: Message = { role: 'system', content, timestamp: new Date().toISOString() };
            updateAgent(agentId, a => ({ chat: [...a.chat, systemMsg] }));
            return; 
        }
    }

    const assistantResponse = await generateChatMessage(agent, message);
    const assistantMsg: Message = { role: 'assistant', content: assistantResponse, timestamp: new Date().toISOString() };
    updateAgent(agentId, a => ({ chat: [...a.chat, assistantMsg] }));
  };

  const confirmChatAction = (agentId: string, taskIds: string[]) => {
    taskIds.forEach(taskId => {
      updateTask(agentId, taskId, { status: 'completed', completed_at: new Date().toISOString() });
    });
    updateAgent(agentId, agent => ({
        chat: [...agent.chat, { role: 'system', content: `✓ Marked ${taskIds.length} tasks complete!`, timestamp: new Date().toISOString() }]
    }));
    showToast('Tasks marked as complete.', 'success');
  };
  
  const deleteAgent = (agentId: string) => {
    const agentToDelete = agents.find(a => a.id === agentId);
    if (!agentToDelete) return;

    updateAgent(agentId, { status: 'archived', deleted_at: new Date().toISOString() });
    showToast(`Agent "${agentToDelete.name}" deleted.`, 'info', () => undoDelete(agentId));
    
    setShowDeleteConfirm(null);
    if (selectedAgent?.id === agentId) {
      setSelectedAgent(null);
      setView('dashboard');
    }
  };

  const undoDelete = (agentId: string) => {
    updateAgent(agentId, { status: 'active', deleted_at: null });
    showToast('Agent restored.', 'success');
  };
  
  const toggleStatus = (agentId: string) => {
    updateAgent(agentId, agent => {
        const newStatus = agent.status === 'active' ? 'paused' : 'active';
        showToast(newStatus === 'paused' ? `Agent "${agent.name}" paused.` : `Agent "${agent.name}" activated.`, 'info');
        return { status: newStatus };
    });
  };

  const toggleAutoExecute = (agentId: string) => {
    updateAgent(agentId, agent => {
        const newValue = !agent.config.auto_execute;
        showToast(newValue ? 'Auto-execute enabled.' : 'Auto-execute disabled.', 'info');
        return { config: { ...agent.config, auto_execute: newValue } };
    });
  };
  
  const navigateTo = (newView: ViewType) => {
    if (newView !== 'workspace') {
      setSelectedAgent(null);
    }
    setView(newView);
  }

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setView('workspace');
  };

  if (!isAuthenticated) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
            <Toast toast={toast} />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 font-sans text-gray-900 dark:text-gray-200">
      <nav className="bg-white/80 dark:bg-gray-800/80 shadow-sm backdrop-blur-md sticky top-0 z-20 dark:shadow-gray-700/[.2]">
        <div className="px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('home')}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Luminara</h1>
              <p className="text-xs text-gray-500 -mt-1 dark:text-gray-400">Autonomous AI Agents</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigateTo('home')} 
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 ${view === 'home' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' : 'bg-transparent hover:bg-gray-100/50 text-gray-700 dark:hover:bg-gray-700/50 dark:text-gray-300'}`}
            >
              <Home className="w-4 h-4" /> Home
            </button>
             <button 
              onClick={() => navigateTo('dashboard')} 
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${view === 'dashboard' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' : 'bg-transparent hover:bg-gray-100/50 text-gray-700 dark:hover:bg-gray-700/50 dark:text-gray-300'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => navigateTo('calendar')} 
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 ${view === 'calendar' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' : 'bg-transparent hover:bg-gray-100/50 text-gray-700 dark:hover:bg-gray-700/50 dark:text-gray-300'}`}
            >
              <CalendarDays className="w-4 h-4" /> Calendar
            </button>
            <button onClick={() => setShowWizard(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />New Agent
            </button>
             <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg hover:bg-gray-100/50 text-gray-700 dark:hover:bg-gray-700/50 dark:text-gray-300 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-gray-100/50 text-gray-700 dark:hover:bg-gray-700/50 dark:text-gray-300 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main>
        {view === 'home' && (
            <HomeView 
                userProfile={userProfile}
                agents={agents}
                onNavigateToDashboard={() => navigateTo('dashboard')}
                onNewAgent={() => setShowWizard(true)}
            />
        )}
        {view === 'dashboard' && (
          <Dashboard
            agents={agents}
            onNewAgent={() => setShowWizard(true)}
            onSelectAgent={handleSelectAgent}
            onToggleStatus={toggleStatus}
            onDeleteAgent={(agent) => setShowDeleteConfirm(agent)}
          />
        )}
        {view === 'calendar' && (
            <CalendarView 
                agents={agents}
                onSelectAgent={handleSelectAgent}
            />
        )}
        {view === 'workspace' && selectedAgent && (
          <WorkspaceView
            key={selectedAgent.id} // Add key to force re-mount on agent change
            agent={selectedAgent}
            onBack={() => navigateTo('dashboard')}
            onToggleAutoExecute={toggleAutoExecute}
            onExecuteAction={executeAction}
            onSendMessage={sendMessage}
            onConfirmChatAction={confirmChatAction}
            executingTasks={executingTasks}
          />
        )}
      </main>

      {showWizard && <WizardView onClose={() => setShowWizard(false)} onCreateAgent={createAgent} userProfile={userProfile} />}
      {showSettings && <SettingsView userProfile={userProfile} onUpdateProfile={setUserProfile} onClose={() => setShowSettings(false)} showToast={showToast} />}
      {showDeleteConfirm && <DeleteConfirmModal agent={showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} onConfirm={deleteAgent} />}
      <Toast toast={toast} />
    </div>
  );
};

export default App;
