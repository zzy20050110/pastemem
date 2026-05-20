export interface ClipboardRecord {
  id: number;
  type: 'text' | 'image';
  content: string | null;
  image_path: string | null;
  data_url: string | null;
  pinned: number;
  created_at: number;
}

export interface PasteMemoAPI {
  getHistory: (search?: string) => Promise<ClipboardRecord[]>;
  copyToClipboard: (id: number) => Promise<boolean>;
  togglePin: (id: number) => Promise<boolean>;
  deleteRecord: (id: number) => Promise<boolean>;
  getSetting: (key: string) => Promise<string>;
  setSetting: (key: string, value: string) => Promise<void>;
  onNewRecord: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    pasteMemo: PasteMemoAPI;
  }
}
