/** Web dev preview: the browser's cookie jar holds the session; nothing to store here. */
export const secureStorage = {
  getItem: (_k: string): string | null => null,
  setItem: (_k: string, _v: string) => {},
  getItemAsync: async (_k: string): Promise<string | null> => null,
  setItemAsync: async (_k: string, _v: string) => {},
};
