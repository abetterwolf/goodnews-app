import axios from 'axios';
import { GoodNewsEntry, ScriptureEntry, User, WallPost } from '../types';

// When hosted externally (Vercel), calls go to /api/taskade which Vercel proxies
// to taskade.com/api/1 with the Bearer token injected server-side via vercel.json.
// When inside Taskade's own environment, /api/taskade is handled natively.
const BASE = '/api/taskade';

// Inject Taskade API token for external hosting (set VITE_TASKADE_TOKEN in Vercel env vars)
const TASKADE_TOKEN = import.meta.env.VITE_TASKADE_TOKEN;
if (TASKADE_TOKEN) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${TASKADE_TOKEN}`;
}

const PROJECTS = {
  users:      'VjGsdrWnDrPf3pqU',
  goodNews:   'K2MqTZzE3FzhKyTA',
  wallPosts:  'bpvco296dwgQH5k6',
  scriptures: 'LyJ1cZ6FU6X1FAJ9',
};

const AGENT_ID   = '01KK7Z6Z5ZASYHY1AXDF43X5P9';
const WEBHOOK_ID = '01KK7Z75WFE9NWSDMVKGN8K62V';

// Set VITE_PUBLIC_URL in Vercel env vars — falls back to current origin for localhost
const PUBLIC_APP_URL = import.meta.env.VITE_PUBLIC_URL || window.location.origin;

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseUser(node: any): User {
  const f = node.fieldValues || {};
  return {
    id:            node.id,
    displayName:   f['/attributes/@usr01'] || 'Anonymous',
    email:         f['/attributes/@usr02'] || '',
    avatarUrl:     f['/attributes/@usr03'] || '',
    totalSparks:   f['/attributes/@usr04'] || 0,
    bio:           f['/attributes/@usr05'] || '',
    friendIds:     f['/attributes/@usr06']
      ? f['/attributes/@usr06'].split(',').map((s: string) => s.trim()).filter(Boolean)
      : [],
    joinedAt:      f['/attributes/@usr07'] || new Date().toISOString(),
    authProvider:  f['/attributes/@usr08'] || 'email',
  };
}

function parseGoodNews(node: any): GoodNewsEntry {
  const f = node.fieldValues || {};
  return {
    id:                  node.id,
    topic:               f['/attributes/@gn001'] || '',
    scriptureReference:  f['/attributes/@gn002'] || '',
    scriptureText:       f['/attributes/@gn003'] || '',
    senderUserId:        f['/attributes/@gn004'] || '',
    receiverUserId:      f['/attributes/@gn005'] || '',
    status:              f['/attributes/@gn006'] || 'pending',
    senderName:          f['/attributes/@gn007'] || '',
    sparkCount:          f['/attributes/@gn008'] || 0,
    shareLink:           f['/attributes/@gn009'] || '',
    sentAt:              f['/attributes/@gn010'] || new Date().toISOString(),
    completedAt:         f['/attributes/@gn011'] || undefined,
    linkClicks:          f['/attributes/@gn012'] || 0,
  };
}

function parseWallPost(node: any): WallPost {
  const f = node.fieldValues || {};
  return {
    id:                  node.id,
    authorUserId:        f['/attributes/@wp001'] || '',
    authorName:          f['/attributes/@wp002'] || 'Anonymous',
    authorAvatar:        f['/attributes/@wp003'] || '',
    postType:            f['/attributes/@wp004'] || 'daily_focus',
    scriptureReference:  f['/attributes/@wp005'] || '',
    scriptureText:       f['/attributes/@wp006'] || '',
    postContent:         f['/attributes/@wp007'] || '',
    sparkCount:          f['/attributes/@wp008'] || 0,
    postedAt:            f['/attributes/@wp009'] || new Date().toISOString(),
    goodNewsId:          f['/attributes/@wp010'] || '',
    imageUrl:            f['/attributes/@wp011'] || '',
    videoUrl:            f['/attributes/@wp012'] || '',
  };
}

function parseScripture(node: any): ScriptureEntry {
  const f = node.fieldValues || {};
  return {
    id:                  node.id,
    topic:               f['/attributes/@sl001'] || '',
    scriptureReference:  f['/attributes/@sl002'] || '',
    scriptureText:       f['/attributes/@sl003'] || '',
    theme:               f['/attributes/@sl004'] || 'faith',
    timesSent:           f['/attributes/@sl005'] || 0,
  };
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const { data } = await axios.get(`${BASE}/projects/${PROJECTS.users}/nodes`);
  const nodes = data?.payload?.nodes || [];
  return nodes.filter((n: any) => n.fieldValues?.['/attributes/@usr01']).map(parseUser);
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const raw = encoder.encode(password + 'goodnews_salt_2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', raw);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createUser(
  user: Partial<User> & { displayName: string; email: string; password?: string }
): PromisePromisePromisePromise<{ id: string }> {
  const passwordHash = user.password ? await hashPassword(user.password) : '';
  const { data } = await axios.post(`${BASE}/projects/${PROJECTS.users}/nodes`, {
    '/text':                  user.displayName,
    '/attributes/@usr01':     user.displayName,
    '/attributes/@usr02':     user.email.toLowerCase().trim(),
    '/attributes/@usr03':     user.avatarUrl || '',
    '/attributes/@usr04':     0,
    '/attributes/@usr05':     user.bio || '',
    '/attributes/@usr06':     '',
    '/attributes/@usr07':     new Date().toISOString(),
    '/attributes/@usr08':     user.authProvider || 'email',
    '/attributes/@usr09':     passwordHash,
  });
  return { id: data?.payload?.node?.id || data?.id || '' };
}

export async function getUserByEmail(
  email: string
): PromisePromisePromisePromisePromisePromisePromisePromise<(User & { passwordHash: string }) | null> {
  const { data } = await axios.get(`${BASE}/projects/${PROJECTS.users}/nodes`);
  const nodes = data?.payload?.nodes || [];
  const node = nodes.find((n: any) =>
    (n.fieldValues?.['/attributes/@usr02'] || '').toLowerCase().trim() === email.toLowerCase().trim()
  );
  if (!node) return null;
  return { ...parseUser(node), passwordHash: node.fieldValues?.['/attributes/@usr09'] || '' };
}

export async function updateUserSparks(userId: string, sparks: number): Promise<void> {
  await axios.patch(`${BASE}/projects/${PROJECTS.users}/nodes/${userId}`, {
    '/attributes/@usr04': sparks,
  });
}

export async function updateUserFriends(userId: string, friendIds: string[]): Promise<void> {
  await axios.patch(`${BASE}/projects/${PROJECTS.users}/nodes/${userId}`, {
    '/attributes/@usr06': friendIds.join(','),
  });
}

export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
  await axios.patch(`${BASE}/projects/${PROJECTS.users}/nodes/${userId}`, {
    '/attributes/@usr03': avatarUrl,
  });
}

export async function updateUserProfile(
  userId: string,
  updates: { displayName?: string; bio?: string; avatarUrl?: string }
): Promise<void> {
  const patch: RecordRecord<string, string> = {};
  if (updates.displayName)          patch['/attributes/@usr01'] = updates.displayName;
  if (updates.bio !== undefined)    patch['/attributes/@usr05'] = updates.bio;
  if (updates.avatarUrl !== undefined) patch['/attributes/@usr03'] = updates.avatarUrl;
  await axios.patch(`${BASE}/projects/${PROJECTS.users}/nodes/${userId}`, patch);
}

// Search a Bible verse via public API (no key required)
export async function searchBibleVerse(reference: string): PromisePromisePromisePromisePromisePromisePromisePromise<{
  reference: string;
  text: string;
} | null> {
  try {
    const encoded = encodeURIComponent(reference.trim());
    const { data } = await axios.get(
      `https://bible-api.com/${encoded}?translation=kjv`,
      { timeout: 8000 }
    );
    if (data?.text && data?.reference) {
      return { reference: data.reference, text: data.text.trim() };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Good News ────────────────────────────────────────────────────────────────

export async function getGoodNewsEntries(): Promise<GoodNewsEntry[]> {
  const { data } = await axios.get(`${BASE}/projects/${PROJECTS.goodNews}/nodes`);
  const nodes = data?.payload?.nodes || [];
  return nodes.filter((n: any) => n.fieldValues?.['/attributes/@gn001']).map(parseGoodNews);
}

export async function createGoodNews(entry: {
  topic: string;
  scriptureReference: string;
  scriptureText: string;
  senderUserId: string;
  senderName: string;
  receiverUserId: string;
  receiverName: string;
}): PromisePromisePromisePromisePromisePromise<{ id: string; shareLink: string }> {
  // Unique token lets us find the node ID after creation (POST doesn't return it)
  const lookupToken = `gn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const sentAt = new Date().toISOString();

  // Encode share data into the URL so SharePage works without auth
  const shareData = {
    t:  entry.topic,
    r:  entry.scriptureReference,
    s:  entry.scriptureText,
    n:  entry.senderName || '',
    ts: Date.now(),
  };
  const encoded = btoa(encodeURIComponent(JSON.stringify(shareData)));

  await axios.post(`${BASE}/projects/${PROJECTS.goodNews}/nodes`, {
    '/text':                  entry.topic,
    '/attributes/@gn001':     entry.topic,
    '/attributes/@gn002':     entry.scriptureReference,
    '/attributes/@gn003':     entry.scriptureText,
    '/attributes/@gn004':     entry.senderUserId,
    '/attributes/@gn005':     entry.receiverUserId,
    '/attributes/@gn006':     'pending',
    '/attributes/@gn007':     entry.senderName || '',
    '/attributes/@gn008':     0,
    '/attributes/@gn009':     '',        // patched below once we have the ID
    '/attributes/@gn010':     sentAt,
    '/attributes/@gn012':     0,
    '/attributes/note':       lookupToken,
  });

  // Retrieve the newly-created node ID via the lookup token
  let id = '';
  try {
    const { data: listData } = await axios.get(`${BASE}/projects/${PROJECTS.goodNews}/nodes`);
    const nodes: any[] = listData?.payload?.nodes || [];
    const match = nodes.find((n: any) => n.fieldValues?.['/attributes/note'] === lookupToken);
    id = match?.id || '';
  } catch { /* id stays '' */ }

  const shareLink = id ? `${PUBLIC_APP_URL}?share=${id}&d=${encoded}` : '';

  if (id && shareLink) {
    await axios.patch(`${BASE}/projects/${PROJECTS.goodNews}/nodes/${id}`, {
      '/attributes/@gn009': shareLink,
    });
  }

  return { id, shareLink };
}

export async function getGoodNewsById(id: string): PromisePromisePromise<GoodNewsEntry | null> {
  try {
    const { data } = await axios.get(`${BASE}/projects/${PROJECTS.goodNews}/nodes`);
    const nodes: any[] = data?.payload?.nodes || [];
    const node = nodes.find((n: any) => n.id === id);
    return node ? parseGoodNews(node) : null;
  } catch {
    return null;
  }
}

export async function updateGoodNewsStatus(
  id: string,
  status: GoodNewsEntry['status']
): Promise<void> {
  const updates: any = { '/attributes/@gn006': status };
  if (status === 'completed' || status === 'celebratory') {
    updates['/attributes/@gn011'] = new Date().toISOString();
  }
  await axios.patch(`${BASE}/projects/${PROJECTS.goodNews}/nodes/${id}`, updates);
}

export async function incrementGoodNewsClicks(
  id: string,
  currentClicks: number
): Promise<void> {
  await axios.patch(`${BASE}/projects/${PROJECTS.goodNews}/nodes/${id}`, {
    '/attributes/@gn012': currentClicks + 1,
  });
}

// ─── Cloud Admin ──────────────────────────────────────────────────────────────

const ADMIN_PROJECT = 'awu3TQzoYtjLUn1P';

export async function getCloudAdminEmails(): Promise<string[]> {
  try {
    const { data } = await axios.get(`${BASE}/projects/${ADMIN_PROJECT}/nodes`);
    const nodes = data?.payload?.nodes || [];
    return nodes
      .filter((n: any) => n.fieldValues?.['/attributes/@adm01']?.optionId === 'admin_email')
      .map((n: any) => (n.fieldValues?.['/attributes/@adm02'] || '').toLowerCase().trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function addCloudAdminEmail(email: string, notes = ''): Promise<void> {
  await axios.post(`${BASE}/projects/${ADMIN_PROJECT}/nodes`, {
    '/text':                email.toLowerCase().trim(),
    '/attributes/@adm01':  { type: 'Select', optionId: 'admin_email' },
    '/attributes/@adm02':  email.toLowerCase().trim(),
    '/attributes/@adm03':  notes,
  });
}

// ─── Wall Posts ───────────────────────────────────────────────────────────────

export async function getWallPosts(): Promise<WallPost[]> {
  const { data } = await axios.get(`${BASE}/projects/${PROJECTS.wallPosts}/nodes`);
  const nodes = data?.payload?.nodes || [];
  return nodes.filter((n: any) => n.fieldValues?.['/attributes/@wp001']).map(parseWallPost);
}

export async function createWallPost(post: {
  authorUserId: string;
  authorName: string;
  postType: WallPost['postType'];
  scriptureReference?: string;
  scriptureText?: string;
  postContent: string;
  imageUrl?: string;
  videoUrl?: string;
  goodNewsId?: string;
}): Promise<void> {
  const label =
    post.postContent.trim().slice(0, 80) ||
    (post.imageUrl ? '📷 Image post' : post.videoUrl ? '🎬 Video post' : 'Wall post');

  await axios.post(`${BASE}/projects/${PROJECTS.wallPosts}/nodes`, {
    '/text':                  label,
    '/attributes/@wp001':     post.authorUserId,
    '/attributes/@wp002':     post.authorName,
    '/attributes/@wp004':     post.postType,
    '/attributes/@wp005':     post.scriptureReference || '',
    '/attributes/@wp006':     post.scriptureText || '',
    '/attributes/@wp007':     post.postContent,
    '/attributes/@wp008':     0,
    '/attributes/@wp009':     new Date().toISOString(),
    '/attributes/@wp010':     post.goodNewsId || '',
    '/attributes/@wp011':     post.imageUrl || '',
    '/attributes/@wp012':     post.videoUrl || '',
  });
}

export async function sparkWallPost(id: string, currentSparks: number): Promise<void> {
  await axios.patch(`${BASE}/projects/${PROJECTS.wallPosts}/nodes/${id}`, {
    '/attributes/@wp008': currentSparks + 1,
  });
}

// ─── Scriptures ───────────────────────────────────────────────────────────────

export async function getScriptures(): Promise<ScriptureEntry[]> {
  const { data } = await axios.get(`${BASE}/projects/${PROJECTS.scriptures}/nodes`);
  const nodes = data?.payload?.nodes || [];
  return nodes.filter((n: any) => n.fieldValues?.['/attributes/@sl001']).map(parseScripture);
}

export async function createScripture(entry: {
  topic: string;
  scriptureReference: string;
  scriptureText: string;
  theme: ScriptureEntry['theme'];
}): PromisePromisePromisePromise<{ id: string }> {
  const { data } = await axios.post(`${BASE}/projects/${PROJECTS.scriptures}/nodes`, {
    '/text':                  entry.topic,
    '/attributes/@sl001':     entry.topic,
    '/attributes/@sl002':     entry.scriptureReference,
    '/attributes/@sl003':     entry.scriptureText,
    '/attributes/@sl004':     entry.theme,
    '/attributes/@sl005':     0,
  });
  return { id: data?.payload?.node?.id || data?.id || '' };
}

export async function deleteScripture(id: string): Promise<void> {
  await axios.delete(`${BASE}/projects/${PROJECTS.scriptures}/nodes/${id}`);
}

export function getRandomScripture(scriptures: ScriptureEntry[]): ScriptureEntry | null {
  if (!scriptures.length) return null;
  return scriptures[Math.floor(Math.random() * scriptures.length)];
}

// ─── Grace Agent (SSE chat) ───────────────────────────────────────────────────

export async function createGraceConversation(): Promise<string> {
  const { data } = await axios.post(`${BASE}/agents/${AGENT_ID}/public-conversations`);
  return data.conversationId;
}

export function createGraceStream(conversationId: string): EventSource {
  return new EventSource(
    `${BASE}/agents/${AGENT_ID}/public-conversations/${conversationId}/stream`
  );
}

export async function sendGraceMessage(conversationId: string, text: string): Promise<void> {
  await axios.post(
    `${BASE}/agents/${AGENT_ID}/public-conversations/${conversationId}/messages`,
    { text }
  );
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

export async function triggerGoodNewsWebhook(payload: {
  sender_name: string;
  receiver_name: string;
  topic: string;
  scripture_reference: string;
  scripture_text: string;
  good_news_id: string;
}): PromisePromisePromisePromise<{ encouragement_message?: string }> {
  try {
    const { data } = await axios.post(`${BASE}/webhooks/${WEBHOOK_ID}/run`, payload);
    return data?.body || {};
  } catch {
    return {};
  }
}

// ─── Local storage helpers ────────────────────────────────────────────────────

export function getLocalUser(): User | null {
  try {
    const raw = localStorage.getItem('goodnews_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLocalUser(user: User): void {
  localStorage.setItem('goodnews_user', JSON.stringify(user));
}

export function clearLocalUser(): void {
  localStorage.removeItem('goodnews_user');
}
