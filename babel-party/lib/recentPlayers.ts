import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'babelingo_last_lobby_names_v1';

/** Persist last lobby display names so the next session can pre-fill the same roster. */
export async function saveLastLobbyPlayerNames(names: string[]): Promise<void> {
  try {
    const cleaned = names.map((n) => n.trim()).filter(Boolean);
    if (cleaned.length === 0) return;
    await AsyncStorage.setItem(KEY, JSON.stringify({ names: cleaned, at: Date.now() }));
  } catch {
    /* non-fatal */
  }
}

/**
 * Returns saved names if there are enough for the current headcount (or more — trimmed).
 */
export async function loadLastLobbyPlayerNames(expectedCount: number): Promise<string[] | null> {
  if (expectedCount < 1) return null;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { names?: string[] };
    const names = parsed.names;
    if (!Array.isArray(names) || names.length === 0) return null;
    const trimmed = names.map((n) => String(n).trim()).filter(Boolean);
    if (trimmed.length < expectedCount) return null;
    return trimmed.slice(0, expectedCount);
  } catch {
    return null;
  }
}
