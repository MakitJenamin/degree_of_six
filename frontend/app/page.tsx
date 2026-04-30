"use client";

import { useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { SearchForm } from "../components/SearchForm";
import { SearchLog } from "../components/SearchLog";
import { PathResult } from "../components/PathResult";
import { DarkModeToggle } from "../components/DarkModeToggle";
import { usePeople } from "../hooks/usePeople";
import { useWebSocket } from "../hooks/useWebSocket";
import { useGraphData } from "../hooks/useGraphData";

// GraphCanvas dùng Sigma.js (WebGL) → không thể render trên server
// Phải dùng dynamic import với ssr: false để chỉ chạy ở client-side
const GraphCanvas = dynamic(
  () => import("../components/GraphCanvas").then((mod) => mod.GraphCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] rounded-3xl border border-stone-100 dark:border-stone-800 flex items-center justify-center text-stone-400 dark:text-stone-500 italic text-sm">
        Đang khởi động vũ trụ liên kết...
      </div>
    ),
  }
);

export default function Home() {
  const { people, isLoading } = usePeople();
  const { logs, pathResult, isSearching, error, startSearch } = useWebSocket();
  const { graphData } = useGraphData();
  const resultRef = useRef<HTMLDivElement>(null);

  // Cuộn xuống khi bắt đầu tìm kiếm
  const handleSearch = (start: string, end: string) => {
    startSearch(start, end);
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  };

  // Cuộn xuống tận cùng một lần nữa khi có kết quả (vì lúc này thẻ kết quả sẽ phình to ra)
  useEffect(() => {
    if (pathResult) {
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [pathResult]);

  return (
    <>
      <DarkModeToggle />
      <main className="min-h-screen bg-[#FAF9F6] dark:bg-stone-950 text-stone-800 dark:text-stone-100 p-4 md:p-8 font-[family-name:var(--font-inter)] selection:bg-[#E8C8C8] selection:text-stone-900">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <header className="text-center space-y-4 pt-12 pb-6">
          <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-playfair)] font-medium text-stone-800 dark:text-stone-100 tracking-tight">
            Khoảng Cách{" "}
            <span className="text-[#D08B8B] font-[family-name:var(--font-dancing)] text-5xl md:text-6xl px-1">
              Sáu Phân Cấp
            </span>
          </h1>
          <p className="text-stone-500 dark:text-stone-400 max-w-2xl mx-auto text-[15px] leading-relaxed">
            Mọi người trên thế giới đều có thể được kết nối với nhau thông qua
            tối đa 6 mối quan hệ. Hãy tìm kiếm sự liên kết giữa hai diễn viên
            bất kỳ trên bách khoa toàn thư Wikipedia.
          </p>
        </header>

        {/* Khung tìm kiếm */}
        <SearchForm
          people={people}
          isLoadingPeople={isLoading}
          isSearching={isSearching}
          onSearch={handleSearch}
        />

        {/* Thông báo lỗi */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 text-red-500 dark:text-red-400 px-6 py-4 rounded-xl text-center font-medium animate-fade-in shadow-sm">
            {error}
          </div>
        )}

        {/* Khung chia cột: Logs (Trái) - Graph (Phải) */}
        <div
          ref={resultRef}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-stone-200/60 dark:border-stone-700/60 scroll-mt-6"
        >
          {/* Cột trái: Tiến Trình Mở Rộng */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="space-y-4 pt-2">
              <h2 className="text-lg font-[family-name:var(--font-playfair)] font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-[#D08B8B] rounded-full block"></span>
                Tiến Trình Mở Rộng
              </h2>
              <p className="text-[14px] text-stone-500 dark:text-stone-400 leading-relaxed text-justify">
                Thuật toán đang từ từ trải rộng từng lớp mối quan hệ. Dữ liệu
                được truyền tải trực tiếp từ máy chủ mang lại trải nghiệm thời
                gian thực vô cùng mượt mà.
              </p>
            </div>

            <div className="flex-1">
              <SearchLog logs={logs} isSearching={isSearching} />
            </div>
          </div>

          {/* Cột phải: Vũ Trụ Liên Kết */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="flex items-center gap-3 mb-6 pt-2">
              <span className="w-1.5 h-6 bg-[#D08B8B] rounded-full block"></span>
              <h2 className="text-lg font-[family-name:var(--font-playfair)] font-semibold text-stone-800 dark:text-stone-100">
                Vũ Trụ Liên Kết
              </h2>
            </div>
            <div className="flex-1 rounded-3xl overflow-hidden shadow-sm">
              <GraphCanvas
                logs={logs}
                pathResult={pathResult}
                graphData={graphData}
              />
            </div>
          </div>
        </div>

        {/* Kết quả đường đi */}
        <PathResult result={pathResult} />
      </div>
      </main>
    </>
  );
}
