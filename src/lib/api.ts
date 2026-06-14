const BASE = '/api';

function getToken() {
  return localStorage.getItem('prjct_iris_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (email: string, name: string, password: string, role?: string) =>
      request<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify({ email, name, password, role }) }),
    me: () => request<any>('/auth/me'),
  },
  projects: {
    list: () => request<any[]>('/projects'),
    create: (data: any) => request<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/projects/${id}`, { method: 'DELETE' }),
  },
  tasks: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any[]>(`/tasks${qs}`);
    },
    create: (data: any) => request<any>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/tasks/${id}`, { method: 'DELETE' }),
    dueReminders: () => request<any[]>('/tasks/reminders/due'),
  },
  users: {
    list: () => request<any[]>('/users'),
    update: (id: string, data: any) => request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/users/${id}`, { method: 'DELETE' }),
    notifications: () => request<any[]>('/users/notifications'),
    markRead: (id: string) => request<any>(`/users/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => request<any>('/users/notifications/read-all', { method: 'PUT' }),
  },
  ai: {
    standup: (tasks: any[]) => request<{ standup: string }>('/ai/standup', { method: 'POST', body: JSON.stringify({ tasks }) }),
    breakdown: (title: string, description?: string) => request<{ subtasks: string[] }>('/ai/breakdown', { method: 'POST', body: JSON.stringify({ title, description }) }),
    enhance: (title: string, description?: string) => request<{ description: string }>('/ai/enhance', { method: 'POST', body: JSON.stringify({ title, description }) }),
    insight: (tasks: any[]) => request<{ insight: string }>('/ai/insight', { method: 'POST', body: JSON.stringify({ tasks }) }),
  },
};
