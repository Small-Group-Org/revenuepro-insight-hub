export const getValue = (key: string): string | null => {
  try {
    return localStorage?.getItem(key) ?? null;
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
};

export const setValue = (key: string, value: string): void => {
  try {
    localStorage?.setItem(key, value);
  } catch (error) {
    console.error('Error setting localStorage:', error);
  }
};

export const removeValue = (key: string): void => {
  try {
    localStorage?.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ACCESS_TOKEN',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
};