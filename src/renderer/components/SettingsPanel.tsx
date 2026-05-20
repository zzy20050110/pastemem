import { useState, useEffect } from 'react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const RETENTION_OPTIONS = [
  { value: '1', label: '1 天' },
  { value: '3', label: '3 天' },
  { value: '5', label: '5 天' },
];

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [retentionDays, setRetentionDays] = useState('3');

  useEffect(() => {
    window.pasteMemo.getSetting('retentionDays').then((v) => {
      if (v) setRetentionDays(v);
    });
  }, [isOpen]);

  const handleChange = async (value: string) => {
    setRetentionDays(value);
    await window.pasteMemo.setSetting('retentionDays', value);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-10 transition-opacity motion-safe:transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        role="dialog"
        aria-label="设置面板"
        aria-modal="true"
        className={`fixed right-0 top-0 h-full w-64 bg-white shadow-xl z-20
          overscroll-contain
          transform transition-transform duration-300 motion-safe:transition-transform motion-safe:duration-300 motion-reduce:transition-none
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-paste-200">
          <h2 className="text-sm font-medium text-gray-800">设置</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-paste-100 text-paste-500 focus-visible:ring-2 focus-visible:ring-paste-300 focus-visible:outline-none"
            aria-label="关闭设置"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <label className="block text-sm text-gray-700 mb-3">剪贴板保留天数</label>
          <div className="space-y-2" role="radiogroup" aria-label="保留天数选择">
            {RETENTION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleChange(opt.value)}
                role="radio"
                aria-checked={retentionDays === opt.value}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors focus-visible:ring-2 focus-visible:ring-paste-300 focus-visible:outline-none
                  ${retentionDays === opt.value
                    ? 'bg-paste-100 text-paste-700 font-medium'
                    : 'text-gray-600 hover:bg-paste-50'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
