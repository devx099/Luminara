import React, { useMemo } from 'react';
import type { Agent } from '../types';
import { CheckCircle, RefreshCw, X } from './icons';

const AgentInsightsView: React.FC<{ agent: Agent }> = ({ agent }) => {
  const stats = useMemo(() => {
    const totalTasks = agent.tasks.length;
    if (totalTasks === 0) {
      return {
        completionRate: 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
        failed: 0,
        actions_executed: agent.actions_log.length,
      };
    }
    const statusCounts = agent.tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      completionRate: Math.round(((statusCounts.completed || 0) / totalTasks) * 100),
      pending: statusCounts.pending || 0,
      in_progress: statusCounts.in_progress || 0,
      completed: statusCounts.completed || 0,
      failed: statusCounts.failed || 0,
      actions_executed: agent.actions_log.length,
    };
  }, [agent]);

  const chartData = [
    { status: 'Pending', count: stats.pending, color: 'bg-gray-400' },
    { status: 'In Progress', count: stats.in_progress, color: 'bg-blue-500' },
    { status: 'Completed', count: stats.completed, color: 'bg-green-500' },
    { status: 'Failed', count: stats.failed, color: 'bg-red-500' },
  ];
  const totalForChart = Math.max(1, agent.tasks.length);

  return (
    <div className="p-4 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Completion Rate</h4>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.completionRate}%</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Actions Executed</h4>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.actions_executed}</p>
        </div>
      </div>

      {/* Task Status Breakdown */}
      <div>
        <h4 className="font-semibold mb-3 dark:text-gray-200">Task Breakdown</h4>
        <div className="space-y-2">
            <div className="w-full flex rounded-full h-3 bg-gray-200 dark:bg-gray-900 overflow-hidden">
                {chartData.map(d => (
                    d.count > 0 && <div key={d.status} className={d.color} style={{ width: `${(d.count / totalForChart) * 100}%` }} />
                ))}
            </div>
            <div className="grid grid-cols-2 text-xs gap-x-4 gap-y-1">
                {chartData.map(d => (
                    <div key={d.status} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${d.color}`} />
                        <span className="text-gray-600 dark:text-gray-400">{d.status}:</span>
                        <span className="font-semibold dark:text-gray-200">{d.count}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Action Log */}
      <div>
        <h4 className="font-semibold mb-2 dark:text-gray-200">Action Log</h4>
        <div className="border rounded-lg bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600 max-h-96 overflow-y-auto">
          {agent.actions_log.length > 0 ? (
            <ul className="divide-y dark:divide-gray-600">
                {agent.actions_log.slice().reverse().map(log => (
                    <li key={log.timestamp} className="p-3 text-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {log.status === 'success' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                                <span className="font-medium dark:text-gray-200 line-clamp-1">{log.taskTitle}</span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                        {log.status === 'failure' && log.error && (
                             <p className="text-xs text-red-600 mt-1 pl-6">{log.error}</p>
                        )}
                    </li>
                ))}
            </ul>
          ) : (
            <div className="text-center p-8 text-gray-500 dark:text-gray-400 text-sm">
              <p>No actions have been executed yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentInsightsView;