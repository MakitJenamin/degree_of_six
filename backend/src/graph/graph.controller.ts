import { Controller, Get, Query } from '@nestjs/common';
import { GraphService } from './graph.service';

@Controller('api')
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  // Luồng dữ liệu: Client -> GET /api/people -> Trả về mảng tên phục vụ Autocomplete
  @Get('people')
  getPeople(): string[] {
    return this.graphService.getAllNames();
  }

  // Luồng dữ liệu: Client -> GET /api/graph -> Trả về Graph phục vụ tính năng vẽ giao diện mạng lưới
  @Get('graph')
  getGraph() {
    return this.graphService.getGraph();
  }

  // API kiểm tra nhanh thuật toán BFS bằng tay
  @Get('test-bfs')
  testBfs(@Query('start') start: string, @Query('end') end: string) {
    if (!start || !end) {
      return { error: 'Vui lòng cung cấp điểm start và end' };
    }

    const result = this.graphService.findShortestPath(start, end);
    if (!result) {
      return { message: 'Không tìm thấy đường đi nối giữa 2 người này!' };
    }

    return result;
  }
}
