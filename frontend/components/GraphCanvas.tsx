"use client";

import { useEffect, useState, useRef } from "react";
import {
  SigmaContainer,
  useSigma,
  useRegisterEvents,
  ControlsContainer,
  ZoomControl,
  FullScreenControl,
} from "@react-sigma/core";
import { useWorkerLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import "@react-sigma/core/lib/style.css";
import { LogEntry, PathResult } from "../hooks/useWebSocket";

interface GraphCanvasProps {
  logs: LogEntry[];
  pathResult: PathResult | null;
  graphData: Record<string, string[]> | null;
}

// Bảng màu cho các node để nhìn sinh động hơn
const PALETTE = [
  "#D08B8B",
  "#B87C7C",
  "#E8C8C8",
  "#e7e5e4",
  "#d6d3d1",
  "#f5f5f4",
];

function GraphUpdater({ logs, pathResult, graphData }: GraphCanvasProps) {
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const { start, kill } = useWorkerLayoutForceAtlas2({
    settings: {
      slowDown: 1000,
      gravity: 2, // Lực hút trung tâm mạnh hơn để "chụm gần vào nhau"
      scalingRatio: 1, // Khoảng cách giữa các cụm
      barnesHutOptimize: true, // Bật tối ưu hoá cho đồ thị lớn
    },
  });

  const hasFadedRef = useRef(false);
  const registerEvents = useRegisterEvents();

  // Lắng nghe sự kiện click node → mở trang Wikipedia tương ứng
  useEffect(() => {
    registerEvents({
      clickNode: (event) => {
        const nodeName = event.node; // Tên node = tên diễn viên
        // Đổi khoảng trắng thành dấu _ để tạo URL Wikipedia
        const wikiSlug = nodeName.replace(/ /g, "_");
        window.open(`https://en.wikipedia.org/wiki/${wikiSlug}`, "_blank");
      },
      // Đổi con trỏ chuột khi hover lên node để gợi ý có thể click
      enterNode: () => {
        sigma.getContainer().style.cursor = "pointer";
      },
      leaveNode: () => {
        sigma.getContainer().style.cursor = "default";
      },
    });
  }, [registerEvents, sigma]);

  // Khởi tạo đồ thị với đầy đủ mạng lưới node và edge
  useEffect(() => {
    if (graph.order === 0 && graphData) {
      // 1. Nạp toàn bộ Nodes
      Object.keys(graphData).forEach((node) => {
        // Khởi tạo vị trí ngẫu nhiên trong một vòng tròn nhỏ
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 10;

        graph.addNode(node, {
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
          size: 4 + Math.random() * 2, // Cho node to hơn (4-6px)
          label: node,
          // Tô màu ngẫu nhiên để đồ thị rực rỡ
          color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        });
      });

      // 2. Nạp toàn bộ Liên kết (Edges)
      Object.entries(graphData).forEach(([source, targets]) => {
        targets.forEach((target) => {
          if (graph.hasNode(source) && graph.hasNode(target)) {
            // Tránh vẽ 2 chiều để giảm tải cho đồ thị
            if (
              !graph.hasEdge(source, target) &&
              !graph.hasEdge(target, source)
            ) {
              graph.addEdge(source, target, {
                color: "#f0ebeb",
                size: 1,
                zIndex: 0,
              });
            }
          }
        });
      });

      // 3. Chạy thuật toán ForceAtlas2 để tự động dàn xếp và chụm các cụm (communities)
      start();

      // Cho thuật toán chạy 5 giây rồi tắt để tiết kiệm pin/CPU
      const timer = setTimeout(() => {
        kill();
      }, 10000);

      return () => {
        clearTimeout(timer);
        kill();
      };
    }
  }, [graph, graphData, start, kill]);

  // Cập nhật khi có lượt tìm kiếm mới
  useEffect(() => {
    if (graph.order === 0) return;

    // Reset lại nếu bắt đầu tìm kiếm mới
    if (logs.length === 0 && !pathResult) {
      hasFadedRef.current = false;
      graph.forEachNode((node) => {
        // Trả về màu cũ (ta lấy ngẫu nhiên theo id để ổn định)
        const charCode = node.charCodeAt(0) || 0;
        graph.setNodeAttribute(
          node,
          "color",
          PALETTE[charCode % PALETTE.length],
        );
        graph.setNodeAttribute(node, "size", 4);
        graph.setNodeAttribute(node, "label", "");
      });
      // Đặt lại màu viền xám nhạt cho tất cả edge
      graph.forEachEdge((edge) => {
        graph.setEdgeAttribute(edge, "color", "#f0ebeb");
        graph.setEdgeAttribute(edge, "size", 1);
        graph.setEdgeAttribute(edge, "zIndex", 0);
      });
      return;
    }

    // 1. Xử lý khi ĐANG tìm kiếm (chưa có kết quả)
    if (!pathResult) {
      // Làm mờ toàn bộ graph NGAY KHI bắt đầu search (1 lần duy nhất)
      if (logs.length > 0 && !hasFadedRef.current) {
        graph.forEachNode((node) => {
          graph.setNodeAttribute(node, "color", "#f5f5f4"); // tàng hình
          graph.setNodeAttribute(node, "size", 1.5);
        });
        graph.forEachEdge((edge) => {
          graph.setEdgeAttribute(edge, "color", "#fafafa");
          graph.setEdgeAttribute(edge, "size", 0.5);
        });
        hasFadedRef.current = true;
      }

      // Thắp sáng các node được quét qua (dấu chân của BFS)
      logs.forEach((log) => {
        log.nodes.forEach((node) => {
          if (graph.hasNode(node)) {
            graph.setNodeAttribute(
              node,
              "color",
              log.level === 0 ? "#B87C7C" : "#E8C8C8",
            );
            graph.setNodeAttribute(node, "size", log.level === 0 ? 10 : 4);
            if (log.level === 0) {
              graph.setNodeAttribute(node, "label", node);
            }
          }
        });
      });
    }

    // 2. Chốt hạ đường đi (ĐÃ CÓ KẾT QUẢ)
    if (pathResult) {
      const pathSet = new Set(pathResult.path);

      // Tắt điện TẤT CẢ các node bị nhiễu (kể cả những node BFS vừa thắp sáng)
      graph.forEachNode((node) => {
        if (!pathSet.has(node)) {
          graph.setNodeAttribute(node, "color", "#e3e3e3");
          graph.setNodeAttribute(node, "size", 4 + Math.random() * 2);
          graph.setNodeAttribute(node, "label", "");
        }
      });

      // Phục hồi lại độ đậm của các edge xám trong nền
      graph.forEachEdge((edge) => {
        graph.setEdgeAttribute(edge, "color", "#f2f2f2"); // Màu xám nhạt nhưng đủ nhìn thấy
        graph.setEdgeAttribute(edge, "size", 1); // Tăng size lên để không bị "mất hút"
      });

      // Highlight các node trên đường đi
      pathResult.path.forEach((node, i) => {
        if (graph.hasNode(node)) {
          graph.setNodeAttribute(
            node,
            "size",
            i === 0 || i === pathResult.path.length - 1 ? 12 : 8,
          );

          let nodeColor = "#D08B8B"; // Điểm trung gian
          if (i === 0)
            nodeColor = "#10b981"; // Điểm bắt đầu (Màu xanh ngọc)
          else if (i === pathResult.path.length - 1) nodeColor = "#6366f1"; // Điểm đích (Màu xanh dương)

          graph.setNodeAttribute(node, "color", nodeColor);
          graph.setNodeAttribute(node, "label", node);
        }

        // Highlight cạnh kết nối
        if (i > 0) {
          const prevNode = pathResult.path[i - 1];
          if (graph.hasNode(prevNode) && graph.hasNode(node)) {
            const edge =
              graph.edge(prevNode, node) || graph.edge(node, prevNode);
            if (edge) {
              graph.dropEdge(edge);
            }
            graph.addEdge(prevNode, node, {
              color: "#D08B8B",
              size: 5,
              zIndex: 10,
            });
          }
        }
      });
    }
  }, [graph, logs, pathResult]);

  return null;
}

export function GraphCanvas({ logs, pathResult, graphData }: GraphCanvasProps) {
  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 h-[600px] shadow-[inset_0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden relative">
      {!graphData ? (
        <div className="absolute inset-0 flex items-center justify-center text-stone-400 italic z-10">
          Đang tải toàn bộ vũ trụ liên kết từ máy chủ...
        </div>
      ) : null}

      {/* Chú thích màu sắc (Legend) */}
      <div className="absolute top-4 left-4 bg-white/95 dark:bg-stone-800/95 backdrop-blur-sm border border-stone-100 dark:border-stone-700 p-3.5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] z-10 flex flex-col gap-2.5 text-[13px] text-stone-600 dark:text-stone-300 font-medium">
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded-full bg-[#10b981] shadow-inner"></div>
          <span>Điểm bắt đầu</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded-full bg-[#D08B8B] shadow-inner"></div>
          <span>Người trung gian</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded-full bg-[#6366f1] shadow-inner"></div>
          <span>Điểm đích</span>
        </div>
      </div>

      <SigmaContainer
        style={{ height: "100%", width: "100%" }}
        settings={{
          defaultNodeColor: "#f5f5f4",
          defaultEdgeColor: "#f0ebeb",
          labelFont: "Inter, sans-serif",
          labelColor: { color: "#57534e" },
          labelSize: 14,
          labelWeight: "bold",
          renderEdgeLabels: true,
          // Đảm bảo zIndex hoạt động
          zIndex: true,
        }}
      >
        <GraphUpdater
          logs={logs}
          pathResult={pathResult}
          graphData={graphData}
        />
        <ControlsContainer position={"bottom-right"}>
          <ZoomControl />
          <FullScreenControl />
        </ControlsContainer>
      </SigmaContainer>
    </div>
  );
}
