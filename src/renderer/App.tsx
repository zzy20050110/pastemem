import { useState } from 'react';
import SearchBar from './components/SearchBar';
import HistoryList from './components/HistoryList';
import SettingsPanel from './components/SettingsPanel';
import { useHistory } from './hooks/useHistory';

export default function App() {
  const [search, setSearch] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { records, loading, handleCopy, handlePin, handleDelete } = useHistory(search);

  return (
    <div className="h-screen flex flex-col bg-paste-50 select-none relative overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between h-11 px-4 bg-white border-b border-paste-200 shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-paste-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            <path fillRule="evenodd" d="M6 3a3 3 0 013-3h2a3 3 0 013 3H6z" clipRule="evenodd" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H5z" />
          </svg>
          <h1 className="text-sm font-medium text-gray-700">PasteMemo</h1>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-1.5 rounded-lg hover:bg-paste-100 text-paste-500 transition-colors focus-visible:ring-2 focus-visible:ring-paste-300 focus-visible:outline-none"
          aria-label="打开设置"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {/* Search */}
      <SearchBar value={search} onChange={setSearch} />

      {/* History list */}
      <HistoryList
        records={records}
        loading={loading}
        onCopy={handleCopy}
        onPin={handlePin}
        onDelete={handleDelete}
      />

      {/* Settings panel */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
