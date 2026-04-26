import { io } from 'socket.io-client';

console.log('Đang thử kết nối WebSocket tới cổng 3001...');
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('✅ Đã kết nối thành công tới Server WebSocket!');

  console.log('Đang gửi lệnh tìm kiếm: "Adam Driver" -> "Barbra Streisand"');
  socket.emit('search', {
    startNode: 'Adam Driver',
    endNode: 'Barbra Streisand',
  });
});

// Lắng nghe sự kiện báo cáo từng Level từ Backend
socket.on('level_explored', (data) => {
  console.log(`📡 [Level ${data.level}] Vừa quét xong ${data.count} người...`);
  console.log(`Danh sách người: ${data.nodes.join(', ')}`);
});

// Lắng nghe sự kiện tìm thấy đường đi
socket.on('path_found', (data) => {
  console.log('🎉 TÌM THẤY ĐƯỜNG ĐI RỒI!');
  console.log(`Độ dài (Số bước): ${data.length}`);
  console.log(`Con đường: ${data.path.join(' ➔ ')}`);
  process.exit(0);
});

socket.on('error', (err) => {
  console.error('❌ SERVER BÁO LỖI:', err.message);
  process.exit(1);
});
