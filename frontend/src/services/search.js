import api from './api.js';
import { resolveImage } from './shop.js';

const HISTORY_LIMIT = 10;

const historyKey = (username) => `tz_search_history_${username || 'guest'}`;

function readHistory(username) {
  try {
    const raw = localStorage.getItem(historyKey(username));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((k) => typeof k === 'string' && k.trim()) : [];
  } catch {
    return [];
  }
}

function writeHistory(username, keywords) {
  try {
    localStorage.setItem(historyKey(username), JSON.stringify(keywords));
  } catch {
    // Bộ nhớ đầy hoặc bị chặn: bỏ qua, đúng tính chất ephemeral của session PHP.
  }
}

/** Port đúng PHP upsertKeywordToHistory: từ mới lên đầu, trùng (lowercase) đẩy lên đầu, tối đa 10. */
export function saveKeyword(username, keyword) {
  const word = (keyword || '').trim();
  if (!word) return readHistory(username);
  const lower = word.toLowerCase();
  const next = [word, ...readHistory(username).filter((k) => k.toLowerCase() !== lower)];
  const trimmed = next.slice(0, HISTORY_LIMIT);
  writeHistory(username, trimmed);
  return trimmed;
}

export function getHistory(username) {
  return readHistory(username);
}

export function removeKeyword(username, keyword) {
  const lower = (keyword || '').toLowerCase();
  const next = readHistory(username).filter((k) => k.toLowerCase() !== lower);
  writeHistory(username, next);
  return next;
}

export function clearHistory(username) {
  writeHistory(username, []);
  return [];
}

export async function fetchSuggestions(query, limit = 8) {
  const q = (query || '').trim();
  if (!q) return [];
  const { data } = await api.get('/storefront/suggestions', { params: { q, limit } });
  return (Array.isArray(data) ? data : []).map((s) => ({
    code: s.code,
    name: s.name,
    img: resolveImage(s.imageUrl),
  }));
}
