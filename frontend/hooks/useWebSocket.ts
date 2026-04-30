import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface LogEntry {
  level: number;
  count: number;
  nodes: string[];
}

export interface PathResult {
  path: string[];
  length: number;
}

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pathResult, setPathResult] = useState<PathResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Khởi tạo kết nối 1 lần duy nhất khi Component Mount
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const newSocket = io(backendUrl);
    setSocket(newSocket);

    // Dọn dẹp khi Component bị tắt đi
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Đăng ký các bộ lắng nghe sự kiện từ Server
  useEffect(() => {
    if (!socket) return;

    // Reset lại lỗi mỗi khi bắt đầu nghe
    socket.on('level_explored', (data: LogEntry) => {
      // Nhét log mới nhất vào mảng
      setLogs((prev) => [...prev, data]);
    });

    socket.on('path_found', (data: PathResult) => {
      setPathResult(data);
      setIsSearching(false);
    });

    socket.on('error', (err: { message: string }) => {
      setError(err.message);
      setIsSearching(false);
    });

    // Xoá lắng nghe cũ để tránh bị nhân đôi log khi re-render
    return () => {
      socket.off('level_explored');
      socket.off('path_found');
      socket.off('error');
    };
  }, [socket]);

  // Hàm để giao diện gọi khi user bấm nút "Tìm Kiếm"
  const startSearch = useCallback(
    (startNode: string, endNode: string) => {
      if (!socket) return;
      
      // Reset trạng thái màn hình trước khi tìm mới
      setLogs([]);
      setPathResult(null);
      setError(null);
      setIsSearching(true);

      socket.emit('search', { startNode, endNode });
    },
    [socket]
  );

  return { logs, pathResult, isSearching, error, startSearch };
}
