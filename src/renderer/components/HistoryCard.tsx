import { useState } from 'react';
import type { ClipboardRecord } from '../types';

interface HistoryCardProps {
  record: ClipboardRecord;
  onCopy: (id: number) => void;
  onPin: (id: number) => void;
  onDelete: (id: number) => void;
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return '刚刚';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

export default function HistoryCard({ record, onCopy, onPin, onDelete }: HistoryCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete(record.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`group bg-white rounded-lg border border-paste-200 shadow-sm
        hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]
        transition-shadow cursor-pointer focus-visible:ring-2 focus-visible:ring-paste-300 focus-visible:outline-none
        ${record.pinned ? 'ring-1 ring-paste-400' : ''}`}
      onClick={() => onCopy(record.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCopy(record.id);
        }
      }}
      aria-label={`${record.type === 'text' ? (record.content ?? '').slice(0, 50) : '图片'}，${formatTime(record.created_at)}`}
    >
      {record.type === 'text' ? (
        <div className="p-3">
          <p className="text-sm text-gray-800 leading-relaxed line-clamp-3 break-words">
            {record.content}
          </p>
        </div>
      ) : record.data_url ? (
        <div className="p-2">
          <img
            src={record.data_url}
            alt="剪贴板图片"
            className="w-full max-h-32 object-contain rounded"
          />
        </div>
      ) : (
        <div className="p-3 text-paste-400 text-sm">[图片已失效]</div>
      )}

      <div className="flex items-center justify-between px-3 pb-2">
        <span className="text-xs text-paste-400">{formatTime(record.created_at)}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onPin(record.id); }}
            className={`p-1 rounded hover:bg-paste-100 transition-colors focus-visible:ring-2 focus-visible:ring-paste-300 focus-visible:outline-none
              ${record.pinned ? 'text-orange-400' : 'text-paste-400'}`}
            aria-label={record.pinned ? '取消置顶' : '置顶'}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M11.3 1.05a1 1 0 011.4 0l6.25 6.25a1 1 0 010 1.4l-2.5 2.5a1 1 0 01-1.15.22l-3.03-1.21-2.96 2.96-.06 1.77a1 1 0 01-.28.67l-3 3a1 1 0 01-1.59-.25l-1.32-3.09-3.09-1.32a1 1 0 01-.25-1.59l3-3a1 1 0 01.67-.28l1.77-.06 2.96-2.96-1.21-3.03a1 1 0 01.22-1.15l2.5-2.5z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className={`p-1 rounded transition-colors focus-visible:ring-2 focus-visible:ring-paste-300 focus-visible:outline-none
              ${confirmDelete
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'text-paste-400 hover:bg-red-50 hover:text-red-500'}`}
            aria-label={confirmDelete ? '确认删除' : '删除'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
