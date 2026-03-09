import { useCallback, useEffect, useState } from 'react';
import { NotificationSchedule, StreakData } from '../types';

const STREAK_KEY = 'goodnews_streak';
const NOTIF_KEY  = 'goodnews_notifications';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function defaultStreak(): StreakData {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: '',
    totalDaysActive: 0,
    history: [],
  };
}

// ─── Pure helpers (usable outside React) ─────────────────────────────────────

export function getStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return raw ? JSON.parse(raw) : defaultStreak();
  } catch {
    return defaultStreak();
  }
}

export function saveStreak(s: StreakData) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(s));
}

export function recordActivity(): StreakData {
  const today = todayStr();
  const s = getStreak();

  // Already recorded today — return unchanged
  if (s.lastActivityDate === today) return s;

  const newHistory = [...new Set([...s.history, today])].sort();
  const isConsecutive = s.lastActivityDate === yesterday();

  const newStreak = isConsecutive ? s.currentStreak + 1 : 1;
  const updated: StreakData = {
    currentStreak: newStreak,
    longestStreak: Math.max(s.longestStreak, newStreak),
    lastActivityDate: today,
    totalDaysActive: newHistory.length,
    history: newHistory,
  };

  saveStreak(updated);
  return updated;
}

// ─── Notification helpers ─────────────────────────────────────────────────────

export function getNotifications(): NotificationSchedule[] {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNotification(n: NotificationSchedule) {
  const existing = getNotifications().filter(x => x.id !== n.id);
  localStorage.setItem(NOTIF_KEY, JSON.stringify([...existing, n]));
}

export function deleteNotification(id: string) {
  localStorage.setItem(
    NOTIF_KEY,
    JSON.stringify(getNotifications().filter(n => n.id !== id))
  );
}

export function toggleNotification(id: string) {
  const all = getNotifications().map(n =>
    n.id === id ? { ...n, enabled: !n.enabled } : n
  );
  localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function fireTestNotification(message: string) {
  if (Notification.permission !== 'granted') return;
  new Notification('GoodNews ✨', {
    body: message,
    icon: '/vite.svg',
    badge: '/vite.svg',
  });
}

// ─── React hook ───────────────────────────────────────────────────────────────

export function useStreak() {
  const [streak, setStreak]           = useState<StreakData>(defaultStreak);
  const [notifications, setNotifications] = useState<NotificationSchedule[]>([]);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setStreak(getStreak());
    setNotifications(getNotifications());
    if ('Notification' in window) setNotifPermission(Notification.permission);
  }, []);

  const markActivity = useCallback(() => {
    const updated = recordActivity();
    setStreak(updated);
    return updated;
  }, []);

  const addNotification = useCallback((n: NotificationSchedule) => {
    saveNotification(n);
    setNotifications(getNotifications());
  }, []);

  const removeNotification = useCallback((id: string) => {
    deleteNotification(id);
    setNotifications(getNotifications());
  }, []);

  const toggle = useCallback((id: string) => {
    toggleNotification(id);
    setNotifications(getNotifications());
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    if ('Notification' in window) setNotifPermission(Notification.permission);
    return granted;
  }, []);

  const today = todayStr();
  const isActiveToday = streak.lastActivityDate === today;
  const isAtRisk      = !isActiveToday && streak.currentStreak > 0;

  return {
    streak,
    notifications,
    notifPermission,
    isActiveToday,
    isAtRisk,
    markActivity,
    addNotification,
    removeNotification,
    toggleNotification: toggle,
    requestPermission,
    fireTestNotification,
  };
}
