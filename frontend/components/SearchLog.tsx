"use client";

import { useEffect, useRef } from "react";
import { LogEntry } from "../hooks/useWebSocket";

interface SearchLogProps {
  logs: LogEntry[];
  isSearching: boolean;
}

export function SearchLog({ logs, isSearching }: SearchLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 overflow-hidden flex flex-col h-72 shadow-[inset_0_2px_10px_rgb(0,0,0,0.02)]">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-3">
        <span className="text-stone-400 font-semibold uppercase tracking-widest text-[11px]">
          Nhật ký hệ thống
        </span>
        {isSearching && (
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D08B8B] opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D08B8B]"></span>
          </span>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {logs.map((log, index) => (
          <div
            key={index}
            className="text-stone-600 animate-fade-in flex gap-4 text-[13px] items-center"
          >
            <span className="text-stone-400 w-20 shrink-0 font-mono text-[11px] bg-stone-50 py-1 px-2 rounded-md border border-stone-100 text-center">
              Level {log.level}
            </span>
            <span className="leading-relaxed">
              Mở rộng lớp thứ {log.level}... Phân tích thêm {" "}
              <span className="text-[#B87C7C] font-semibold">{log.count}</span> mối quan hệ.
            </span>
          </div>
        ))}
        {isSearching && (
          <div className="text-stone-400 animate-pulse mt-3 flex gap-4 text-[13px] items-center">
            <span className="w-20 shrink-0 text-center text-[18px]">
              ⚬ ⚬ ⚬
            </span>
            <span className="italic">Đang kiên nhẫn tìm kiếm...</span>
          </div>
        )}
        {logs.length === 0 && !isSearching && (
          <div className="flex h-full items-center justify-center text-stone-400 italic text-sm">
            Chưa có tiến trình nào. Hãy chọn hai diễn viên và bấm Kết Nối.
          </div>
        )}
      </div>
    </div>
  );
}
