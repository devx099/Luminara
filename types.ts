export interface Task {
  id: string;
  title: string;
  description: string;
  priority: number;
  duration_mins: number;
  due: string | null;
  action_type: 'calendar_event' | 'task' | 'reminder';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  last_error?: string;
  action_ref?: any;
  idempotency_key?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  action?: 'confirm_mark_all';
  task_ids?: string[];
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  goal: string;
  status: 'active' | 'paused' | 'archived';
  created_at: string;
  deleted_at?: string | null;
  deadline: string | null;
  priority: 'low' | 'medium' | 'high';
  tasks: Task[];
  progress: number;
  chat: Message[];
  config: {
    auto_execute: boolean;
    max_daily_actions: number;
    granularity: 'minimal' | 'balanced' | 'detailed';
  };
  actions_log: any[];
}

export interface UserProfile {
  name: string;
  email: string;
  timezone: string;
  preferences: {
    default_auto_execute: boolean;
    default_granularity: 'minimal' | 'balanced' | 'detailed';
    max_daily_actions: number;
    theme: 'light' | 'dark' | 'system';
    selectionColor: string;
  };
  isGoogleConnected?: boolean;
}

export interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  undoAction?: () => void;
}