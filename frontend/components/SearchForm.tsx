"use client";

import { useState, useRef, useEffect, useMemo } from "react";

function AutocompleteInput({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  people,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  disabled: boolean;
  placeholder: string;
  people: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredPeople = useMemo(() => {
    if (!value) return people.slice(0, 50);
    const lowerValue = value.toLowerCase();
    return people
      .filter((p) => p.toLowerCase().includes(lowerValue))
      .slice(0, 50);
  }, [value, people]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex-1 w-full relative" ref={wrapperRef}>
      <label className="block text-[13px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={(e) => {
            e.target.select();
            setIsOpen(true);
          }}
          disabled={disabled}
          className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3.5 pr-10 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#E8C8C8] focus:border-[#D08B8B] transition-all shadow-sm placeholder:text-stone-300 dark:placeholder:text-stone-500 font-medium"
          placeholder={placeholder}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setIsOpen(true);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-[#D08B8B] transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        )}
      </div>

      {isOpen && !disabled && (
        <ul className="absolute z-50 w-full mt-2 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar ring-1 ring-black/5 py-2">
          {filteredPeople.length > 0 ? (
            filteredPeople.map((name) => (
              <li
                key={name}
                className="px-5 py-2.5 hover:bg-[#FAF9F6] dark:hover:bg-stone-700 hover:text-[#D08B8B] cursor-pointer text-stone-600 dark:text-stone-300 transition-colors text-sm font-medium"
                onClick={() => {
                  onChange(name);
                  setIsOpen(false);
                }}
              >
                {name}
              </li>
            ))
          ) : (
            <li className="px-5 py-3 text-stone-400 text-sm italic">
              Không tìm thấy diễn viên...
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

interface SearchFormProps {
  people: string[];
  isLoadingPeople: boolean;
  isSearching: boolean;
  onSearch: (start: string, end: string) => void;
}

export function SearchForm({
  people,
  isLoadingPeople,
  isSearching,
  onSearch,
}: SearchFormProps) {
  const [startNode, setStartNode] = useState("");
  const [endNode, setEndNode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (startNode && endNode && !isSearching) {
      onSearch(startNode, endNode);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-stone-900 p-6 md:p-8 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
    >
      <div className="flex flex-col md:flex-row gap-6 items-end">
        {/* Điểm Bắt Đầu */}
        <AutocompleteInput
          label="Điểm Bắt Đầu"
          value={startNode}
          onChange={setStartNode}
          disabled={isLoadingPeople || isSearching}
          placeholder="VD: Adam Driver"
          people={people}
        />

        {/* Mũi Tên Chuyển Giao (Trang trí) */}
        <div className="hidden md:flex items-center justify-center pb-4 text-stone-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </div>

        {/* Điểm Kết Thúc */}
        <AutocompleteInput
          label="Điểm Kết Thúc"
          value={endNode}
          onChange={setEndNode}
          disabled={isLoadingPeople || isSearching}
          placeholder="VD: Brad Pitt"
          people={people}
        />

        {/* Cụm Nút Bấm */}
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
          <button
            type="button"
            onClick={() => {
              setStartNode("");
              setEndNode("");
            }}
            disabled={isLoadingPeople || isSearching}
            className="w-full md:w-auto px-6 py-3.5 rounded-xl font-semibold text-stone-500 dark:text-stone-400 bg-[#FAF9F6] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-stone-700 dark:hover:text-stone-200 transition-all active:scale-[0.98] shadow-sm"
          >
            Làm Lại
          </button>

          <button
            type="submit"
            disabled={
              isLoadingPeople || isSearching || !startNode || !endNode
            }
            className={`w-full md:w-auto px-10 py-3.5 rounded-xl font-semibold text-white transition-all shadow-md tracking-wide shrink-0
              ${
                isSearching
                  ? "bg-[#D08B8B]/60 cursor-not-allowed animate-pulse"
                  : "bg-[#D08B8B] hover:bg-[#B87C7C] hover:shadow-lg hover:shadow-[#D08B8B]/20 active:scale-[0.98]"
              }
            `}
          >
            {isSearching ? "Đang dò tìm..." : "Kết Nối"}
          </button>
        </div>
      </div>

      {isLoadingPeople && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="w-4 h-4 border-2 border-[#D08B8B] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-stone-400">
            Đang đồng bộ dữ liệu diễn viên...
          </p>
        </div>
      )}
    </form>
  );
}
