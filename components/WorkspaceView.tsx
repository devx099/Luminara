import React, { useState, useRef, useEffect } from 'react';
import type { Agent, Task } from '../types';
import { Target, CheckCircle, Circle, Clock, Zap, Loader, RefreshCw, Send, Check, X, BarChart, Link } from './icons';
import MarkdownRenderer from './MarkdownRenderer';
import AgentInsightsView from './AgentInsightsView';

interface WorkspaceViewProps {
  agent: Agent;
  onBack: () => void;
  onToggleAutoExecute: (agentId: string) => void;
  onExecuteAction: (agentId: string, taskId: string) => void;
  onSendMessage: (agentId: string, message: string) => void;
  onConfirmChatAction: (agentId: string, taskIds: string[]) => void;
  executingTasks: Set<string>;
}

const TaskItem: React.FC<{
    task: Task;
    agentId: string;
    onExecuteAction: (agentId: string, taskId: string) => void;
    isExecuting: boolean;
}> = ({ task, agentId, onExecuteAction, isExecuting }) => (
    <div className={`bg-white dark:bg-gray-700/50 rounded-lg p-4 border-2 ${task.status === 'completed' ? 'border-green-300 dark:border-green-700/50 bg-green-50 dark:bg-green-900/20' : task.status === 'in_progress' ? 'border-blue-300 dark:border-blue-700/50' : 'border-gray-200 dark:border-gray-600'}`}>
        <div className="flex items-start gap-3">
            {task.status === 'completed' ? 
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> : 
                task.status === 'in_progress' ?
                <Loader className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" /> :
                <Circle className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
            }
            <div className="flex-1 min-w-0">
                <h4 className={`font-semibold text-sm ${task.status === 'completed' ? 'line-through text-gray-600 dark:text-gray-400' : 'dark:text-gray-200'}`}>{task.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1"><Clock className="w-3 h-3" /><span>{task.duration_mins} min</span></div>
                    {task.source_urls && task.source_urls.length > 0 && (
                        <div className="flex items-center gap-1">
                             <Link className="w-3 h-3" />
                             <a href={task.source_urls[0].uri} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600 dark:text-blue-400">
                                {task.source_urls.length} Source{task.source_urls.length > 1 ? 's' : ''}
                             </a>
                        </div>
                    )}
                </div>
                {task.status === 'pending' && (
                    <button onClick={() => onExecuteAction(agentId, task.id)} disabled={isExecuting} className="mt-2 w-full px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1">
                        {isExecuting ? <><Loader className="w-3 h-3 animate-spin" />Executing...</> : <><Zap className="w-3 h-3" />Execute</>}
                    </button>
                )}
                {task.status === 'failed' && (
                    <button onClick={() => onExecuteAction(agentId, task.id)} className="mt-2 w-full px-3 py-1.5 bg-orange-600 text-white rounded text-xs font-semibold hover:bg-orange-700 flex items-center justify-center gap-1">
                        <RefreshCw className="w-3 h-3" />Retry
                    </button>
                )}
            </div>
        </div>
    </div>
);

const WorkspaceView: React.FC<WorkspaceViewProps> = ({ agent, onBack, onToggleAutoExecute, onExecuteAction, onSendMessage, onConfirmChatAction, executingTasks }) => {
  const [msgInput, setMsgInput] = useState('');
  const [activeTab, setActiveTab] = useState<'tasks' | 'insights'>('tasks');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'tasks') {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [agent.chat, activeTab]);

  const handleSend = () => {
    if (msgInput.trim()) {
      onSendMessage(agent.id, msgInput);
      setMsgInput('');
    }
  };
  
  const TABS = [
    { id: 'tasks', label: 'Tasks & Chat', icon: Target },
    { id: 'insights', label: 'Insights', icon: BarChart },
  ];

  return (
    <div className="h-[calc(100vh-65px)] flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 sm:px-8 py-4 flex items-center justify-between flex-wrap gap-2 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-600 dark:text-gray-300 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">&larr;</button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold dark:text-white">{agent.name}</h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{agent.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${agent.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>{agent.status}</span>
          <button onClick={() => onToggleAutoExecute(agent.id)} className={`px-3 py-1 rounded-full text-sm font-semibold ${agent.config.auto_execute ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
            Auto: {agent.config.auto_execute ? 'ON' : 'OFF'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-80 lg:w-96 border-b dark:border-gray-700 md:border-b-0 md:border-r bg-white dark:bg-gray-800 flex flex-col">
            <nav className="p-2 border-b dark:border-gray-700">
                <div className="flex gap-2">
                    {TABS.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === tab.id ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </div>
            </nav>
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'tasks' ? (
                <div className="p-4 space-y-3">
                  {agent.tasks.map(task => (
                    <TaskItem key={task.id} task={task} agentId={agent.id} onExecuteAction={onExecuteAction} isExecuting={executingTasks.has(task.id)} />
                  ))}
                </div>
              ) : (
                <AgentInsightsView agent={agent} />
              )}
            </div>
        </div>

        <section className="flex-1 flex flex-col bg-gray-100/50 dark:bg-gray-900/50">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {agent.chat.map((msg, idx) => {
              if (msg.role === 'system') {
                return (
                  <div key={idx} className="flex justify-center my-2">
                     <div className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-full px-4 py-1.5 text-center shadow-sm">
                        <MarkdownRenderer content={msg.content} />
                     </div>
                  </div>
                )
              }
              return (
                <div key={idx} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0 text-xl">🤖</div>}
                  <div className={`max-w-xl rounded-lg p-3 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200'}`}>
                    <MarkdownRenderer content={msg.content} className="text-sm" />
                    {msg.action === 'confirm_mark_all' && (
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => onConfirmChatAction(agent.id, msg.task_ids || [])} className="px-3 py-1 bg-green-100 text-green-700 rounded font-semibold text-sm hover:bg-green-200 flex items-center gap-1"><Check className="w-4 h-4" />Yes, mark all</button>
                        <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded font-semibold text-sm hover:bg-gray-200 flex items-center gap-1"><X className="w-4 h-4" />Cancel</button>
                      </div>
                    )}
                    <span className={`text-xs mt-2 block text-right ${msg.role === 'user' ? 'opacity-70' : 'text-gray-500 dark:text-gray-400'}`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <div className="border-t dark:border-gray-700 bg-white dark:bg-gray-800 p-4 z-10">
            <div className="flex gap-3">
              <input type="text" value={msgInput} onChange={(e) => setMsgInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Message your agent..." className="flex-1 border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
              <button onClick={handleSend} disabled={!msgInput.trim()} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                <Send className="w-5 h-5" />Send
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default WorkspaceView;
