import { ReactNode, useEffect } from 'react';
import Sidebar from './Sidebar';
import { requestNotificationPermission, showBrowserNotification, scheduleReminder } from '../../lib/notifications';
import { api } from '../../lib/api';

export default function Layout({ children }: { children: ReactNode }) {
  useEffect(() => {
    requestNotificationPermission();
    checkReminders();
    const id = setInterval(checkReminders, 60_000);
    return () => clearInterval(id);
  }, []);

  async function checkReminders() {
    try {
      const tasks = await api.tasks.dueReminders();
      tasks.forEach(t => {
        showBrowserNotification(
          `⏰ ${t.title}`,
          `Due reminder — ${t.project_name || 'PRJCT Iris'}`,
        );
      });
    } catch {}
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">{children}</div>
    </div>
  );
}
