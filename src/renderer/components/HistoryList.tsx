import type { ClipboardRecord } from '../types';
import HistoryCard from './HistoryCard';

interface HistoryListProps {
  records: ClipboardRecord[];
  loading: boolean;
  onCopy: (id: number) => void;
  onPin: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function HistoryList({ records, loading, onCopy, onPin, onDelete }: HistoryListProps) {
  const pinnedRecords = records.filter((r) => r.pinned);
  const normalRecords = records.filter((r) => !r.pinned);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-paste-300 border-t-paste-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-paste-400">暂无记录，试试复制一些文字或图片吧</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
      {pinnedRecords.length > 0 && (
        <>
          <div className="flex items-center gap-1 px-1">
            <svg className="w-3 h-3 text-orange-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M11.3 1.05a1 1 0 011.4 0l6.25 6.25a1 1 0 010 1.4l-2.5 2.5a1 1 0 01-1.15.22l-3.03-1.21-2.96 2.96-.06 1.77a1 1 0 01-.28.67l-3 3a1 1 0 01-1.59-.25l-1.32-3.09-3.09-1.32a1 1 0 01-.25-1.59l3-3a1 1 0 01.67-.28l1.77-.06 2.96-2.96-1.21-3.03a1 1 0 01.22-1.15l2.5-2.5z" />
            </svg>
            <span className="text-xs text-paste-500 font-medium">已置顶</span>
          </div>
          {pinnedRecords.map((record) => (
            <HistoryCard
              key={record.id}
              record={record}
              onCopy={onCopy}
              onPin={onPin}
              onDelete={onDelete}
            />
          ))}
          <div className="border-t border-paste-200 my-1" />
        </>
      )}
      {normalRecords.map((record) => (
        <HistoryCard
          key={record.id}
          record={record}
          onCopy={onCopy}
          onPin={onPin}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
