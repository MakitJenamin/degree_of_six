// Graph = object mà KEY là tên người, VALUE là mảng tên người mà họ link tới
// Ví dụ: { "Einstein": ["Curie", "Bohr"], "Curie": ["Einstein", "Pierre"] }
export type Graph = Record<string, string[]>;

// Kết quả BFS trả về cho Frontend
export interface BfsResult {
  path: string[];      // Đường đi: ["Einstein", "Curie", "Obama"]
  length: number;      // Số bước (Khoảng cách)
}

// Tin nhắn WebSocket gửi cho frontend
export interface WsMessage {
  event: 'level_explored' | 'path_found' | 'error';
  data: any;
}
