interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative mx-3 mt-3">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paste-400"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <label htmlFor="clipboard-search" className="sr-only">搜索剪贴板内容</label>
      <input
        id="clipboard-search"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜索文字内容…"
        className="w-full h-9 pl-9 pr-8 text-sm bg-paste-100 text-gray-800
          rounded-full outline-none placeholder:text-paste-400
          focus:ring-2 focus:ring-paste-300 transition-shadow"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-paste-400 hover:text-paste-600"
          aria-label="清除搜索"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
