import React, { useMemo } from 'react';
import type { Agent, UserProfile, Task } from '../types';
import { Brain, Plus, CheckCircle, Clock } from './icons';

interface HomeViewProps {
  userProfile: UserProfile;
  agents: Agent[];
  onNavigateToDashboard: () => void;
  onNewAgent: () => void;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const HomeView: React.FC<HomeViewProps> = ({ userProfile, agents, onNavigateToDashboard, onNewAgent }) => {
  const activeAgents = agents.filter(a => a.status === 'active');

  const stats = useMemo(() => {
    const totalTasks = agents.reduce((sum, agent) => sum + agent.tasks.length, 0);
    const completedTasks = agents.reduce((sum, agent) => sum + agent.tasks.filter(t => t.status === 'completed').length, 0);
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return {
      activeAgents: activeAgents.length,
      completedTasks,
      overallProgress,
    };
  }, [agents]);

  const todaysTasks = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    const tasks: (Task & { agentName: string })[] = [];
    activeAgents.forEach(agent => {
        agent.tasks.forEach(task => {
            if (task.status === 'pending' && task.due) {
                const dueDate = new Date(task.due);
                if (dueDate <= today) {
                    tasks.push({ ...task, agentName: agent.name });
                }
            }
        });
    });
    return tasks.sort((a, b) => new Date(a.due!).getTime() - new Date(b.due!).getTime());
  }, [activeAgents]);

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">{`${getGreeting()}, ${userProfile.name.split(' ')[0]}!`}</h1>
        <p className="text-gray-600 dark:text-gray-400">Here's your high-level overview for today.</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Active Agents</h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">{stats.activeAgents}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Tasks Completed</h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">{stats.completedTasks}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Overall Progress</h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">{stats.overallProgress}%</p>
        </div>
      </div>
      
      {/* Today's Focus */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Today's Focus</h2>
          {todaysTasks.length > 0 ? (
              <div className="space-y-3">
                  {todaysTasks.map(task => (
                      <div key={task.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between">
                          <div>
                              <p className="font-semibold dark:text-gray-200">{task.title}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">From agent: <span className="font-medium">{task.agentName}</span></p>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-300 flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {new Date(task.due!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-1 dark:text-white">All Clear!</h3>
                <p className="text-gray-600 dark:text-gray-400">You have no tasks due today. A perfect time to plan ahead!</p>
            </div>
          )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex gap-4">
        <button onClick={onNewAgent} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />Create New Agent
        </button>
        <button onClick={onNavigateToDashboard} className="px-6 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 inline-flex items-center gap-2">
            <Brain className="w-5 h-5" />View All Agents
        </button>
      </div>

    </div>
  );
};

export default HomeView;