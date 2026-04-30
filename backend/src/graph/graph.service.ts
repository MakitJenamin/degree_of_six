import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Graph, BfsResult } from '../types';

@Injectable()
export class GraphService implements OnModuleInit {
  private readonly logger = new Logger(GraphService.name);
  private graphData: Graph = {};

  // Khởi động: Nạp toàn bộ file graph.json vào RAM để tối ưu tốc độ đọc
  onModuleInit() {
    this.loadGraphFromDisk();
  }

  private loadGraphFromDisk() {
    try {
      // GRAPH_DATA_PATH env var: set trong Docker → /app/data/graph.json
      // Fallback khi local npm run dev: ../data/graph.json (từ backend/ lên root)
      const graphPath = process.env.GRAPH_DATA_PATH ||
        path.join(process.cwd(), '..', 'data', 'graph.json');
      this.logger.log(`Đang đọc file graph tại: ${graphPath}`);

      const fileContent = fs.readFileSync(graphPath, 'utf-8');
      this.graphData = JSON.parse(fileContent);

      const totalNodes = Object.keys(this.graphData).length;
      this.logger.log(
        `✅ Khởi động thành công! Đã nạp ${totalNodes} diễn viên vào RAM.`,
      );
    } catch (error) {
      this.logger.error('❌ Lỗi không thể nạp graph.json!', error.message);
    }
  }

  getAllNames(): string[] {
    return Object.keys(this.graphData);
  }

  getGraph(): Graph {
    return this.graphData;
  }

  // Thuật toán BFS (Tìm đường ngắn nhất):
  // Flow: Lấy node trong queue ra -> Kiểm tra đích -> Nếu chưa tới đích thì đẩy hàng xóm chưa đi qua vào queue -> Lặp lại.
  findShortestPath(start: string, end: string): BfsResult | null {
    if (!this.graphData[start] || !this.graphData[end]) {
      return null;
    }

    if (start === end) {
      return { path: [start], length: 0 };
    }

    const queue: string[] = [start];
    const visited: Record<string, string | null> = {};
    visited[start] = null;

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current === end) {
        return this.buildPath(visited, start, end);
      }

      const neighbors = this.graphData[current] || [];
      for (const neighbor of neighbors) {
        if (visited[neighbor] === undefined) {
          visited[neighbor] = current;
          // đáng ra dòng này nên check current = end ở đây để tối ưu performance
          queue.push(neighbor);
        }
      }
    }

    return null;
  }

  // Thuật toán BFS Real-time dành cho WebSocket
  async findShortestPathWithCallback(
    start: string,
    end: string,
    onLevelComplete: (level: number, count: number, nodes: string[]) => void,
  ): Promise<BfsResult | null> {
    if (!this.graphData[start] || !this.graphData[end]) {
      return null;
    }
    if (start === end) {
      return { path: [start], length: 0 };
    }

    const queue: string[] = [start];
    const visited: Record<string, string | null> = {};
    visited[start] = null;

    let currentLevel = 0;

    while (queue.length > 0) {
      // Phải chốt số lượng người hiện có trong queue để biết được lớp hiện tại to cỡ nào
      const levelSize = queue.length;
      const nodesExploredThisLevel: string[] = [];

      // Chỉ lặp đúng số lượng người của lớp hiện tại
      for (let i = 0; i < levelSize; i++) {
        const current = queue.shift()!;
        nodesExploredThisLevel.push(current);

        if (current === end) {
          // Báo nốt lớp cuối
          onLevelComplete(
            currentLevel,
            nodesExploredThisLevel.length,
            nodesExploredThisLevel,
          );
          return this.buildPath(visited, start, end);
        }

        const neighbors = this.graphData[current] || [];
        for (const neighbor of neighbors) {
          if (visited[neighbor] === undefined) {
            visited[neighbor] = current;
            // if (nodesExploredThisLevel.length == 0) {
            //   nodesExploredThisLevel.push(current);
            // }
            // nodesExploredThisLevel.push(neighbor);
            // if (neighbor === end) {
            //   onLevelComplete(
            //     currentLevel,
            //     nodesExploredThisLevel.length,
            //     nodesExploredThisLevel,
            //   );
            //   return this.buildPath(visited, start, end);
            // }
            queue.push(neighbor);
          }
        }
      }

      // Xử lý xong 1 level -> Báo cáo ra ngoài cho WebSocket
      onLevelComplete(
        currentLevel,
        nodesExploredThisLevel.length,
        nodesExploredThisLevel,
      );
      currentLevel++;

      // TRỌNG TÂM: Phải có delay 100ms để nhường chỗ cho Event Loop của NodeJS
      // đẩy cục tin nhắn WebSocket qua mạng Internet cho Client, nếu không nó bị kẹt lại.
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return null;
  }

  // Truy ngược: Dò mảng visited từ End về Start để tạo con đường hoàn chỉnh
  private buildPath(
    visited: Record<string, string | null>,
    start: string,
    end: string,
  ): BfsResult {
    const path: string[] = [];
    let current: string | null = end;

    while (current !== null) {
      path.push(current);
      current = visited[current];
    }

    path.reverse();

    return {
      path: path,
      length: path.length,
    };
  }
}
