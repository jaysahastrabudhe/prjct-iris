export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'member';
  avatar_color: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  owner_id: string;
  owner_name?: string;
  status: 'active' | 'completed' | 'archived';
  due_date?: string;
  task_count?: number;
  done_count?: number;
  created_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  project_id: string;
  project_name?: string;
  project_color?: string;
  assignee_id?: string;
  assignee_name?: string;
  assignee_color?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  reminder_at?: string;
  position: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message?: string;
  type: 'info' | 'reminder' | 'warning' | 'success';
  read: boolean;
  task_id?: string;
  created_at: string;
}
