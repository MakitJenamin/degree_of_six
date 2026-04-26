import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { GraphService } from './graph.service';
import { WsMessage } from '../types';

// Bật CORS để cho phép Frontend React (3000) kết nối vào WebSocket
@WebSocketGateway({ cors: { origin: 'http://localhost:3000' } })
export class GraphGateway {
  constructor(private readonly graphService: GraphService) {}

  // Lắng nghe sự kiện 'search' được gửi lên từ Trình duyệt
  @SubscribeMessage('search')
  async handleSearch(
    @MessageBody() data: { startNode: string; endNode: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { startNode, endNode } = data;

    if (!startNode || !endNode) {
      this.sendError(client, 'Vui lòng cung cấp cả điểm bắt đầu và kết thúc!');
      return;
    }

    try {
      // Chạy BFS bản Real-time, truyền vào 1 hàm Callback
      // Hàm này sẽ tự động được gọi mỗi khi quét xong 1 lớp
      const result = await this.graphService.findShortestPathWithCallback(
        startNode,
        endNode,
        (level, count, nodes) => {
          // Đóng gói tin nhắn và bắn trả về cho Frontend ngay lập tức
          const message: WsMessage = {
            event: 'level_explored',
            data: { level, count, nodes },
          };
          client.emit(message.event, message.data);
        },
      );

      if (result) {
        // Khi vòng lặp đã chạy xong và tìm thấy kết quả cuối cùng
        const successMsg: WsMessage = {
          event: 'path_found',
          data: result,
        };
        client.emit(successMsg.event, successMsg.data);
      } else {
        // Cụt đường
        this.sendError(client, 'Không tìm thấy đường đi nối giữa 2 người này.');
      }
    } catch (err) {
      this.sendError(client, 'Có lỗi xảy ra trên server!');
    }
  }

  // Hàm phụ trợ: Bắn tin nhắn báo lỗi
  private sendError(client: Socket, message: string) {
    const errorMsg: WsMessage = {
      event: 'error',
      data: { message },
    };
    client.emit(errorMsg.event, errorMsg.data);
  }
}
