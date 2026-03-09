export interface User {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  totalSparks: number;
  bio?: string;
  friendIds: string[];
  joinedAt: string;
  authProvider: string;
}

export interface GoodNewsEntry {
  id: string;
  topic: string;
  scriptureReference: string;
  scriptureText: string;
  senderUserId: string;
  senderName?: string;
  receiverUserId: string;
  receiverName?: string;
  status: 'pending' | 'accepted' | 'completed' | 'celebratory' | 'declined';
  shareMethod?: string;
  sparkCount: number;
  shareLink?: string;
  sentAt: string;
  completedAt?: string;
  linkClicks: number;
}

export interface WallPost {
  id: string;
  authorUserId: string;
  authorName: string;
  authorAvatar?: string;
  postType: 'daily_focus' | 'devotional' | 'reflection' | 'celebration';
  scriptureReference?: string;
  scriptureText?: string;
  postContent: string;
  imageUrl?: string;
  videoUrl?: string;
  sparkCount: number;
  postedAt: string;
  goodNewsId?: string;
}

export interface ScriptureEntry {
  id: string;
  topic: string;
  scriptureReference: string;
  scriptureText: string;
  theme: 'faith' | 'hope' | 'love' | 'strength' | 'peace' | 'grace' | 'purpose' | 'joy';
  timesSent: number;
}

export type ShareMethod =
  | 'social_twitter'
  | 'social_facebook'
  | 'email'
  | 'in_person'
  | 'whatsapp'
  | 'copy_link';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string; // YYYY-MM-DD
  totalDaysActive: number;
  history: string[];        // YYYY-MM-DD dates
}

export interface NotificationSchedule {
  id: string;
  label: string;
  time: string;    // HH:MM
  days: number[];  // 0=Sun … 6=Sat
  enabled: boolean;
  message: string;
  createdAt: string;
}

export type AppScreen =
  | 'splash'
  | 'login'
  | 'home'
  | 'send_goodnews'
  | 'receive_goodnews'
  | 'wall'
  | 'friends'
  | 'profile'
  | 'devotional'
  | 'grace_chat'
  | 'admin';
