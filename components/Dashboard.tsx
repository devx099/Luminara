import React from 'react';
import type { Agent } from '../types';
import { Brain, Plus, Clock, Pause, Play, Trash2 } from './icons';

interface DashboardProps {
  agents: Agent[];
  onNewAgent: () => void;
  onSelectAgent: (agent: Agent) => void;
  onToggleStatus: (agentId: string) => void;
  onDeleteAgent: (agent: Agent) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ agents, onNewAgent, onSelectAgent, onToggleStatus, onDeleteAgent }) => {
  const activeAgents = agents.filter(a => a.status !== 'archived');

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Your autonomous AI agents.</p>
      </div>

      {activeAgents.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-800/20">
          <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 dark:text-white">No Agents Yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first agent to get started.</p>
          <button onClick={onNewAgent} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />Create Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeAgents.map(agent => (
            <div key={agent.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <div className="flex-grow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${agent.status === 'active' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                      <Brain className={`w-6 h-6 ${agent.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 line-clamp-1">{agent.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${agent.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'}`}>{agent.status}</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 line-clamp-2 h-10">{agent.description}</p>

                <div className="mb-4">
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-300">Progress</span>
                    <span className="font-bold text-gray-800 dark:text-gray-100">{agent.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${agent.progress}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-6">
                  <span>{agent.tasks.filter(t => t.status === 'completed').length} / {agent.tasks.length} tasks</span>
                  {agent.deadline && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{new Date(agent.deadline).toLocaleDateString()}</span>}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => onSelectAgent(agent)} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-sm transition-colors">Open</button>
                <button onClick={() => onToggleStatus(agent.id)} className="w-10 h-10 flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    {agent.status === 'active' ? <Pause className="w-5 h-5 text-gray-600 dark:text-gray-300" /> : <Play className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
                </button>
                <button onClick={() => onDeleteAgent(agent)} className="w-10 h-10 flex items-center justify-center border-2 border-red-200 dark:border-red-500/30 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;