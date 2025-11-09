import React, { useState, useMemo } from 'react';
import type { Agent, Task } from '../types';
import { ArrowLeft, ArrowRight, Brain } from './icons';

interface CalendarViewProps {
  agents: Agent[];
  onSelectAgent: (agent: Agent) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ agents, onSelectAgent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const startingDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const handleGoToToday = () => {
    setCurrentDate(new Date());
  }

  const tasksByDate = useMemo(() => {
    const map = new Map<string, (Task & { agent: Agent })[]>();
    agents.forEach(agent => {
        if (agent.status !== 'archived') {
            agent.tasks.forEach(task => {
                if (task.due) {
                    const dateKey = new Date(task.due).toISOString().split('T')[0];
                    if (!map.has(dateKey)) {
                        map.set(dateKey, []);
                    }
                    map.get(dateKey)!.push({ ...task, agent });
                }
            });
        }
    });
    return map;
  }, [agents]);

  const priorityColors: Record<string, string> = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="p-4 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">Master Calendar</h1>
            <p className="text-gray-600 dark:text-gray-400">View all tasks from all agents in one place.</p>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <div className="flex items-center gap-2">
                <button onClick={handlePrevMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><ArrowLeft className="w-5 h-5" /></button>
                <button onClick={handleGoToToday} className="px-4 py-2 text-sm font-semibold border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Today</button>
                <button onClick={handleNextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><ArrowRight className="w-5 h-5" /></button>
            </div>
        </div>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <div className="grid grid-cols-7 gap-px text-center font-semibold text-sm text-gray-600 dark:text-gray-400 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px">
          {Array.from({ length: startingDay }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg min-h-32"></div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateStr = date.toISOString().split('T')[0];
            const tasks = tasksByDate.get(dateStr) || [];
            
            const isToday = dateStr === todayStr;

            return (
              <div key={day} className={`p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg min-h-32 flex flex-col ${isToday ? 'border-2 border-blue-500' : ''}`}>
                <span className={`font-semibold ${isToday ? 'text-blue-600' : 'dark:text-gray-200'}`}>{day}</span>
                <div className="flex-grow mt-1 space-y-1 overflow-y-auto">
                    {tasks.sort((a,b) => new Date(a.due!).getTime() - new Date(b.due!).getTime()).map(task => (
                        <button key={task.id} onClick={() => onSelectAgent(task.agent)} className="w-full text-left p-1.5 rounded-md bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/50 shadow-sm transition-colors">
                            <p className="text-xs font-semibold line-clamp-1 dark:text-gray-200">{task.title}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <Brain className="w-3 h-3"/> {task.agent.name}
                                </span>
                                <span className={`w-2 h-2 rounded-full ${priorityColors[task.agent.priority]}`}></span>
                            </div>
                        </button>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
