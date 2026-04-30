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
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 p-5 overflow-hidden flex flex-col h-[360px] shadow-[inset_0_2px_10px_rgb(0,0,0,0.02)]">
      <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-700 pb-3 mb-3">
        <span className="text-stone-400 dark:text-stone-500 font-semibold uppercase tracking-widest text-[11px]">
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
        {logs.map((log, index) => {
          // Bảng màu cho từng cấp độ
          const levelColors = [
            "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-400", // Level 0
            "bg-sky-50 border-sky-100 text-sky-600 dark:bg-sky-950/60 dark:border-sky-800 dark:text-sky-400", // Level 1
            "bg-indigo-50 border-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-400", // Level 2
            "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-400", // Level 3
            "bg-[#FAF9F6] border-[#E8C8C8] text-[#B87C7C] dark:bg-stone-800 dark:border-stone-600 dark:text-[#D08B8B]", // Level 4
            "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-400", // Level 5+
          ];
          const colorClass = levelColors[log.level] || levelColors[levelColors.length - 1];

          return (
            <div
              key={index}
              className="text-stone-600 dark:text-stone-300 animate-fade-in flex gap-4 text-[13px] items-center"
            >
              <span className={`w-20 shrink-0 font-mono font-semibold text-[11px] py-1 px-2 rounded-md border text-center ${colorClass}`}>
                Level {log.level}
              </span>
              <span className="leading-relaxed">
                Mở rộng lớp thứ {log.level}... Phân tích thêm {" "}
                <span className="text-[#B87C7C] font-semibold">{log.count}</span> mối quan hệ.
              </span>
            </div>
          );
        })}
        {isSearching && (
          <div className="text-stone-400 dark:text-stone-500 animate-pulse mt-3 flex gap-4 text-[13px] items-center">
            <span className="w-20 shrink-0 text-center text-[18px]">
              ⚬ ⚬ ⚬
            </span>
            <span className="italic">Đang kiên nhẫn tìm kiếm...</span>
          </div>
        )}
        {logs.length === 0 && !isSearching && (
          <div className="flex h-full items-center justify-center text-stone-400 dark:text-stone-500 italic text-sm">
            Chưa có tiến trình nào. Hãy chọn hai diễn viên và bấm Kết Nối.
          </div>
        )}
      </div>
    </div>
  );
}
