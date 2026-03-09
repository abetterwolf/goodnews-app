import axios from 'axios';
import { getCloudAdminEmails } from './api';

// ─── Admin access control ──────────────────────────────────────────────────────
// Admin emails are stored in the cloud Taskade project (awu3TQzoYtjLUn1P).
// localStorage is used as a fast cache; cloud is the source of truth.

const ADMIN_STORAGE_KEY  = 'goodnews_admins';
const BLOCKED_STORAGE_KEY = 'goodnews_blocked';
const ADS_STORAGE_KEY    = 'goodnews_ads';
const ADMIN_CACHE_KEY    = 'goodnews_admin_cache';
const ADMIN_CACHE_TTL    = 5 * 60 * 1000; // 5 minutes

// Hardcoded fallback — only used if cloud fetch fails
const SEED_ADMIN_EMAILS: string[] = [
  'admin@goodnews.app',
  'wildruralpack@gmail.com',
];

export function getAdminEmails(): string[] {
  try {
    const cached = localStorage.getItem(ADMIN_CACHE_KEY);
    if (cached) {
      const { emails, ts } = JSON.parse(cached);
      if (Date.now() - ts < ADMIN_CACHE_TTL) return emails;
    }
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
    const extra: string[] = stored ? JSON.parse(stored) : [];
    return [...new Set([...SEED_ADMIN_EMAILS, ...extra])];
  } catch {
    return SEED_ADMIN_EMAILS;
  }
}

// Fetch from cloud and update local cache — call this on login
export async function refreshAdminCache(): Promise<string[]> {
  try {
    const cloudEmails  = await getCloudAdminEmails();
    const stored       = localStorage.getItem(ADMIN_STORAGE_KEY);
    const localExtra: string[] = stored ? JSON.parse(stored) : [];
    const all = [...new Set([...SEED_ADMIN_EMAILS, ...cloudEmails, ...localExtra])];
    localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify({ emails: all, ts: Date.now() }));
    return all;
  } catch {
    return getAdminEmails();
  }
}

export function addAdminEmail(email: string): void {
  try {
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
    const extra: string[] = stored ? JSON.parse(stored) : [];
    if (!extra.includes(email.toLowerCase())) {
      extra.push(email.toLowerCase());
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(extra));
    }
    localStorage.removeItem(ADMIN_CACHE_KEY); // invalidate cache
  } catch { /* no-op */ }
}

export function removeAdminEmail(email: string): void {
  try {
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
    const extra: string[] = stored ? JSON.parse(stored) : [];
    localStorage.setItem(
      ADMIN_STORAGE_KEY,
      JSON.stringify(extra.filter(e => e !== email.toLowerCase()))
    );
    localStorage.removeItem(ADMIN_CACHE_KEY);
  } catch { /* no-op */ }
}

export function isAdmin(email: string): boolean {
  return getAdminEmails().some(e => e.toLowerCase() === email.toLowerCase());
}

// ─── Blocked users ─────────────────────────────────────────────────────────────

export interface BlockedUser {
  userId:      string;
  displayName: string;
  email:       string;
  blockedAt:   string;
  reason:      string;
}

export function getBlockedUsers(): BlockedUser[] {
  try {
    const stored = localStorage.getItem(BLOCKED_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function blockUser(user: BlockedUser): void {
  const existing = getBlockedUsers();
  if (!existing.find(u => u.userId === user.userId)) {
    localStorage.setItem(BLOCKED_STORAGE_KEY, JSON.stringify([...existing, user]));
  }
}

export function unblockUser(userId: string): void {
  const remaining = getBlockedUsers().filter(u => u.userId !== userId);
  localStorage.setItem(BLOCKED_STORAGE_KEY, JSON.stringify(remaining));
}

export function isUserBlocked(userId: string): boolean {
  return getBlockedUsers().some(u => u.userId === userId);
}

// ─── Advertisements ────────────────────────────────────────────────────────────

export interface Advertisement {
  id:         string;
  title:      string;
  body:       string;
  ctaLabel:   string;
  ctaUrl:     string;
  imageUrl?:  string;
  placement:  'home_banner' | 'wall_between' | 'profile_bottom';
  active:     boolean;
  createdAt:  string;
  clicks:     number;
}

export function getAds(): Advertisement[] {
  try {
    const stored = localStorage.getItem(ADS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getActiveAds(placement: Advertisement['placement']): Advertisement[] {
  return getAds().filter(a => a.active && a.placement === placement);
}

export function saveAd(ad: Advertisement): void {
  const existing = getAds().filter(a => a.id !== ad.id);
  localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify([...existing, ad]));
}

export function deleteAd(id: string): void {
  localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(getAds().filter(a => a.id !== id)));
}

export function recordAdClick(id: string): void {
  const ads = getAds().map(a => a.id === id ? { ...a, clicks: a.clicks + 1 } : a);
  localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(ads));
}

const ADS_SEEDED_KEY = 'goodnews_ads_seeded_v1';

export function seedDefaultAds(): void {
  if (localStorage.getItem(ADS_SEEDED_KEY)) return;
  const defaultAds: Advertisement[] = [
    {
      id:        'default-ad-1',
      title:     '📖 Daily Bible Plans',
      body:      'Start a 30-day reading plan and deepen your faith journey with guided devotionals.',
      ctaLabel:  'Start Free',
      ctaUrl:    'https://www.bible.com/reading-plans',
      placement: 'home_banner',
      active:    true,
      createdAt: new Date().toISOString(),
      clicks:    0,
    },
    {
      id:        'default-ad-2',
      title:     '🙏 Prayer & Community',
      body:      'Connect with believers worldwide. Share prayer requests and receive encouragement.',
      ctaLabel:  'Join Now',
      ctaUrl:    'https://www.bible.com',
      placement: 'wall_between',
      active:    true,
      createdAt: new Date().toISOString(),
      clicks:    0,
    },
    {
      id:        'default-ad-3',
      title:     '🌟 Spread the Word',
      body:      'Invite your friends to GoodNews and earn bonus sparks for every person who joins.',
      ctaLabel:  'Invite Friends',
      ctaUrl:    '#',
      placement: 'profile_bottom',
      active:    true,
      createdAt: new Date().toISOString(),
      clicks:    0,
    },
  ];
  localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(defaultAds));
  localStorage.setItem(ADS_SEEDED_KEY, '1');
}

// ─── First-user admin grant ────────────────────────────────────────────────────
// Grants admin to the first real (non-mock) user who logs in on this device.

const FIRST_ADMIN_KEY = 'goodnews_first_admin_granted';
const MOCK_EMAILS = [
  'grace@example.com',
  'david@example.com',
  'admin@goodnews.app',
  'admin@goodnews.com',
];

export function grantFirstUserAdmin(email: string): void {
  if (!email) return;
  const normalised = email.toLowerCase().trim();
  if (MOCK_EMAILS.includes(normalised)) return; // never auto-grant mocks
  const existing = localStorage.getItem(FIRST_ADMIN_KEY);
  if (existing && !MOCK_EMAILS.includes(existing)) return; // already granted to a real user
  addAdminEmail(normalised);
  localStorage.setItem(FIRST_ADMIN_KEY, normalised);
}

// ─── AI Scripture generation ───────────────────────────────────────────────────

export async function generateScriptureWithAI(
  theme: string,
  topic?: string
): PromisePromisePromisePromisePromisePromisePromisePromisePromisePromise<{ topic: string; scriptureReference: string; scriptureText: string } | null> {
  try {
    const prompt = topic
      ? `Suggest a biblical scripture for the topic "${topic}" with theme "${theme}". Return ONLY a JSON object with keys: topic (string, catchy title), scriptureReference (e.g. "John 3:16"), scriptureText (the full verse text, accurate KJV or NIV). No explanation.`
      : `Suggest a unique, uplifting biblical scripture for the theme "${theme}". Return ONLY a JSON object with keys: topic (string, catchy title for the verse), scriptureReference (e.g. "Romans 8:28"), scriptureText (the full verse text, accurate KJV or NIV). No explanation.`;

    const { data } = await axios.post(
      '/api/taskade/agents/01KK7Z6Z5ZASYHY1AXDF43X5P9/public-conversations',
      {}
    );
    const convoId = data.conversationId;

    await axios.post(
      `/api/taskade/agents/01KK7Z6Z5ZASYHY1AXDF43X5P9/public-conversations/${convoId}/messages`,
      { text: prompt }
    );

    // Response arrives via SSE stream — handled externally
    await new Promise(r => setTimeout(r, 3000));
    return null;
  } catch {
    return null;
  }
}
