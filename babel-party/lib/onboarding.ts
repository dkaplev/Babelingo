import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppGameId } from '@/lib/types';

const KEY_PREFIX = 'seen_howto_';

export async function hasSeenHowToForMode(mode: AppGameId): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(`${KEY_PREFIX}${mode}`);
    return v === '1';
  } catch {
    return true;
  }
}

export async function markHowToSeenForMode(mode: AppGameId): Promise<void> {
  try {
    await AsyncStorage.setItem(`${KEY_PREFIX}${mode}`, '1');
  } catch {
    /* non-fatal */
  }
}

const FIRST_LAUNCH_KEY = 'babelingo_first_launch_done';

export async function isFirstAppLaunch(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
    return v !== '1';
  } catch {
    return false;
  }
}

export async function markFirstLaunchDone(): Promise<void> {
  try {
    await AsyncStorage.setItem(FIRST_LAUNCH_KEY, '1');
  } catch {
    /* non-fatal */
  }
}
