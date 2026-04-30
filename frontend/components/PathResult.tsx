"use client";

import { PathResult as PathResultType } from "../hooks/useWebSocket";

interface PathResultProps {
  result: PathResultType | null;
}

export function PathResult({ result }: PathResultProps) {
  if (!result) {
    return (
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 p-8 md:p-10 shadow-[0_20px_50px_rgb(0,0,0,0.05)] mt-12 relative overflow-hidden flex flex-col items-center justify-center min-h-[320px]">
        {/* Góc hoa văn trang trí */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FAF9F6] dark:bg-stone-800 rounded-bl-full -z-10 border-l border-b border-stone-50 dark:border-stone-700"></div>
        <div className="text-stone-300 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8" />
            <path d="m12 8 4 4-4 4" />
          </svg>
        </div>
        <p className="text-stone-400 dark:text-stone-500 italic text-sm">
          Bản đồ kết nối sẽ hiển thị tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 p-8 md:p-10 shadow-[0_20px_50px_rgb(0,0,0,0.05)] animate-fade-in mt-12 relative overflow-hidden">
      {/* Hiệu ứng viền cầu vồng Gemini lướt 1 vòng */}
      <div className="gemini-sweep-effect"></div>

      {/* Góc hoa văn trang trí */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#FAF9F6] dark:bg-stone-800 rounded-bl-full -z-10 border-l border-b border-stone-50 dark:border-stone-700"></div>

      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
        <h3 className="text-2xl font-[family-name:var(--font-playfair)] font-bold text-stone-800 dark:text-stone-100 flex items-center gap-3">
          Sự Kết Nối Hoàn Hảo
        </h3>
        <span className="px-5 py-2 bg-[#FAF9F6] dark:bg-stone-800 text-[#B87C7C] border border-[#E8C8C8] dark:border-[#B87C7C] rounded-full font-medium text-sm tracking-wide shadow-sm">
          Khoảng cách: <span className="font-bold">{result.length}</span> Bước
        </span>
      </div>

      <div className="relative pt-4 pb-8">
        {/* Đường kẻ nối ngang */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-stone-200 dark:bg-stone-700 -translate-y-1/2 z-0 hidden md:block"></div>
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#D08B8B] -translate-y-1/2 z-0 hidden md:block animate-draw-line origin-left opacity-60"></div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 overflow-x-auto custom-scrollbar px-2 py-6 -my-6">
          {result.path.map((node, index) => (
            <div
              key={index}
              className="flex flex-col items-center group shrink-0"
            >
              {/* Thẻ Card Tên người */}
              <div
                className={`
                min-w-[140px] text-center px-6 py-4 rounded-2xl font-medium shadow-sm transition-all duration-500 transform group-hover:-translate-y-1
                ${
                  index === 0
                    ? "bg-[#FDFBF7] dark:bg-stone-800 border-1 border-[#E8C8C8] dark:border-[#D08B8B] text-[#B87C7C]"
                    : index === result.path.length - 1
                      ? "bg-[#D08B8B] border-2 border-[#D08B8B] text-white shadow-md shadow-[#D08B8B]/20"
                      : "bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 group-hover:border-[#E8C8C8] group-hover:text-stone-800 dark:group-hover:text-stone-100"
                }
              `}
                style={{
                  animationDelay: `${index * 150}ms`,
                  animationFillMode: "both",
                }}
              >
                {node}
              </div>

              {/* Nhãn vai trò */}
              <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-3 font-semibold uppercase tracking-widest">
                Bước {index + 1}
              </span>

              {/* Mũi tên dọc cho màn hình điện thoại */}
              {index < result.path.length - 1 && (
                <div className="md:hidden mt-4 mb-2 text-[#D08B8B] opacity-50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14" />
                    <path d="m19 12-7 7-7-7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
