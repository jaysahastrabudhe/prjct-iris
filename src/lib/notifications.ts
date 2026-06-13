export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

export function showBrowserNotification(title: string, body: string, icon?: string) {
  if (Notification.permission !== 'granted') return;
  new Notification(title, {
    body,
    icon: icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: `prjct-iris-${Date.now()}`,
  });
}

export function scheduleReminder(taskTitle: string, reminderAt: Date, taskId: string) {
  const now = new Date();
  const delay = reminderAt.getTime() - now.getTime();
  if (delay <= 0) return;
  setTimeout(() => {
    showBrowserNotification(
      `⏰ Reminder: ${taskTitle}`,
      'This task is due soon — check PRJCT Iris for details.',
    );
  }, delay);
}
