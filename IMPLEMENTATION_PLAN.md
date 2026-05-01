# 🗺️ Kế Hoạch Build Dự Án "Degree of Six"

> **Tech Stack**: Next.js + NestJS + Tailwind CSS v4
> **Ngày bắt đầu**: 2026-04-19
> **Trạng thái**: `pending`

---

## Tổng Quan Các Phase

| Phase | Tên                                                   | Mô tả                             | Độ khó   |
| ----- | ----------------------------------------------------- | --------------------------------- | -------- |
| 0     | [Setup Dự Án](#phase-0-setup-dự-án)                   | Khởi tạo Next.js + NestJS         | ⭐       |
| 1     | [Crawl Wikipedia](#phase-1-crawl-dữ-liệu-wikipedia)   | Thu thập data, tạo graph.json     | ⭐⭐     |
| 2     | [Backend Core](#phase-2-backend-core---bfs--rest-api) | Load graph, BFS, REST API         | ⭐⭐⭐   |
| 3     | [WebSocket](#phase-3-websocket---bfs-real-time)       | Stream BFS qua WS                 | ⭐⭐⭐   |
| 4     | [Frontend UI](#phase-4-frontend---search-ui)          | Giao diện search + autocomplete   | ⭐⭐     |
| 5     | [Graph Viz](#phase-5-frontend---graph-visualization)  | Vẽ network graph                  | ⭐⭐⭐⭐ |
| 6     | [Polish](#phase-6-polish--animations)                 | Animation, responsive, hoàn thiện | ⭐⭐     |
| 7     | [Deploy](#phase-7-docker--deploy)                     | Docker, đưa lên production        | ⭐⭐     |

---

## Cấu trúc thư mục cuối cùng

```
degree_of_six/
├── frontend/                  ← Next.js app
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           ← Trang chính
│   │   └── globals.css
│   ├── components/
│   │   ├── SearchForm.tsx     ← Form chọn người
│   │   ├── SearchLog.tsx      ← Log BFS real-time
│   │   ├── GraphCanvas.tsx    ← Graph visualization
│   │   └── PathResult.tsx     ← Hiển thị đường đi
│   ├── hooks/
│   │   ├── useWebSocket.ts    ← Hook quản lý WS
│   │   └── usePeople.ts      ← Hook lấy danh sách người
│   ├── lib/
│   │   └── api.ts             ← Gọi API helper
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/                   ← NestJS app
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── graph/
│   │   │   ├── graph.module.ts
│   │   │   ├── graph.service.ts     ← Load graph + BFS
│   │   │   ├── graph.controller.ts  ← REST API
│   │   │   └── graph.gateway.ts     ← WebSocket handler
│   │   └── types/
│   │       └── index.ts             ← TypeScript types
│   └── package.json
│
├── data/
│   ├── seed_names.txt         ← 10k+ tên nhân vật
│   └── graph.json             ← Graph data (generated)
│
├── scripts/
│   └── crawl-wikipedia.ts     ← Script crawl Wikipedia
│
└── IMPLEMENTATION_PLAN.md     ← File này
```

---

## Phase 0: Setup Dự Án

**Trạng thái**: `pending`
**Mục tiêu**: Khởi tạo 2 project (frontend + backend) và chạy được

### Bước 0.1 — Tạo thư mục dự án

```bash
# Tại c:\Users\letpl\Desktop\project\degree_of_six\
mkdir data scripts
```

### Bước 0.2 — Khởi tạo Next.js (Frontend)

```bash
npx -y create-next-app@latest ./frontend
```

Khi được hỏi, chọn:

- TypeScript? → **Yes**
- ESLint? → **Yes**
- Tailwind CSS? → **Yes**
- `src/` directory? → **No** (dùng `app/` trực tiếp)
- App Router? → **Yes**
- Import alias? → **Mặc định @/\***

### Bước 0.3 — Khởi tạo NestJS (Backend)

```bash
npx -y @nestjs/cli new backend --package-manager npm --skip-git
```

Cài thêm packages cần thiết:

```bash
cd backend
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install @nestjs/serve-static
```

### Bước 0.4 — Test cả 2 chạy được

```bash
# Terminal 1: Frontend (port 3000)
cd frontend && npm run dev

# Terminal 2: Backend (port 3001)
cd backend && npm run start:dev
```

### ✅ Checklist Phase 0

- [ ] Frontend chạy trên http://localhost:3000
- [ ] Backend chạy trên http://localhost:3001 (đổi port trong `main.ts`)
- [ ] Cả 2 đều không báo lỗi

> [!NOTE]
> **Cách đổi port NestJS:** Mở `backend/src/main.ts`, sửa `app.listen(3001)` thay vì 3000 để không đụng với Next.js.

---

## Phase 1: Crawl Dữ Liệu Wikipedia

**Trạng thái**: `pending`
**Mục tiêu**: Tạo file `graph.json` chứa mạng lưới liên kết Wikipedia

### Bước 1.1 — Chuẩn bị danh sách nhân vật (seed_names.txt)

Bạn có 2 lựa chọn:

- **Cách 1 (Nhanh)**: Download file `seed_names.txt` từ repo gốc: https://raw.githubusercontent.com/Rani-Codes/sixth_degree/main/seed_names.txt
- **Cách 2 (Tự làm)**: Tạo danh sách nhỏ hơn (~100 người) để test nhanh

```txt
# data/seed_names.txt (mỗi dòng 1 tên, đúng như tên trang Wikipedia)
Albert Einstein
Barack Obama
Marie Curie
Elon Musk
Steve Jobs
...
```

### Bước 1.2 — Viết script crawl Wikipedia

Tạo file `scripts/crawl-wikipedia.ts`:

**Ý tưởng của script:**

```
Với MỖI tên người trong seed_names.txt:
  1. Gọi Wikipedia API → lấy tất cả links trong trang đó
  2. Lọc: chỉ giữ links mà tên cũng có trong seed_names.txt
  3. Lưu vào object: { "tên người": ["link1", "link2", ...] }

Cuối cùng → ghi ra file graph.json
```

**Wikipedia API cần gọi:**

```
https://en.wikipedia.org/w/api.php?action=query&titles=Albert_Einstein&prop=links&pllimit=max&format=json
```

**Giải thích các tham số:**

- `action=query` → yêu cầu truy vấn dữ liệu
- `titles=Albert_Einstein` → trang cần lấy (dấu cách = dấu `_`)
- `prop=links` → lấy tất cả links trong bài
- `pllimit=max` → lấy tối đa (500 links/request)
- `format=json` → trả về JSON

> [!IMPORTANT]
> Wikipedia API có **pagination** — nếu trang có > 500 links, cần gọi tiếp với `plcontinue` token. Script cần handle vụ này.

### Bước 1.3 — Chạy script và tạo graph.json

```bash
npx tsx scripts/crawl-wikipedia.ts
# → Tạo ra data/graph.json
```

**Kết quả file `graph.json` sẽ trông như:**

```json
{
  "Albert Einstein": ["Marie Curie", "Max Planck", "Niels Bohr"],
  "Marie Curie": ["Pierre Curie", "Albert Einstein", "Nobel Prize"],
  "Barack Obama": ["Joe Biden", "Michelle Obama", "Harvard University"],
  ...
}
```

### ✅ Checklist Phase 1

- [ ] File `data/seed_names.txt` có ít nhất 100 tên
- [ ] Script crawl chạy thành công
- [ ] File `data/graph.json` được tạo ra
- [ ] Kiểm tra: mở graph.json, thấy dữ liệu hợp lý

> [!TIP]
> **Mẹo cho sinh viên**: Khi đang dev, dùng dataset NHỎ (~100-500 người) để test nhanh. Khi hoàn thiện rồi mới chạy full 10k+. Crawl 10k trang Wikipedia mất khoảng 3-5 phút.

---

## Phase 2: Backend Core — BFS + REST API

**Trạng thái**: `pending`
**Mục tiêu**: NestJS load được graph, chạy được BFS, có REST API

### Bước 2.1 — Định nghĩa Types

Tạo `backend/src/types/index.ts`:

```typescript
// Graph = object mà KEY là tên người, VALUE là mảng tên người mà họ link tới
// Ví dụ: { "Einstein": ["Curie", "Bohr"], "Curie": ["Einstein", "Pierre"] }
export type Graph = Record<string, string[]>;

// Kết quả BFS trả về
export interface BfsResult {
  path: string[]; // Đường đi: ["Einstein", "Curie", "Obama"]
  length: number; // Số bước: 3
}

// Tin nhắn WebSocket gửi cho frontend
export interface WsMessage {
  type: "level_explored" | "node_explored" | "path_found" | "error";
  data: any;
}
```

### Bước 2.2 — GraphService: Load graph + BFS

Tạo `backend/src/graph/graph.service.ts`:

**Chức năng:**

1. Khi NestJS khởi động → đọc `graph.json` → lưu vào RAM
2. Hàm `getPeople()` → trả về danh sách tất cả tên
3. Hàm `bfs(start, end)` → chạy thuật toán BFS, trả về đường đi ngắn nhất

**Thuật toán BFS (pseudocode):**

```
function bfs(graph, start, end):
    queue = [start]           // Hàng đợi: bắt đầu từ start
    visited = {start: null}   // Đã ghé thăm: start (chưa có "cha")

    while queue không rỗng:
        current = queue.lấy_đầu_hàng()

        if current == end:
            // TÌM THẤY! → truy ngược đường đi
            path = []
            node = end
            while node != null:
                path.thêm_đầu(node)
                node = visited[node]  // đi ngược về "cha"
            return path

        for each neighbor in graph[current]:
            if neighbor chưa visited:
                visited[neighbor] = current  // ghi nhớ "cha" của neighbor
                queue.thêm_cuối(neighbor)

    return null  // Không tìm thấy đường đi
```

### Bước 2.3 — GraphController: REST API

Tạo `backend/src/graph/graph.controller.ts`:

**2 endpoints:**

| Method | URL           | Trả về                     | Mục đích                           |
| ------ | ------------- | -------------------------- | ---------------------------------- |
| `GET`  | `/api/people` | `string[]` (danh sách tên) | Cho frontend hiển thị autocomplete |
| `GET`  | `/api/graph`  | `Graph` (toàn bộ graph)    | Cho frontend vẽ network ban đầu    |

### Bước 2.4 — Bật CORS

Trong `backend/src/main.ts`, bật CORS để frontend (port 3000) gọi được backend (port 3001):

```typescript
app.enableCors({
  origin: "http://localhost:3000", // Cho phép frontend gọi
});
```

### Bước 2.5 — Test bằng trình duyệt

```
GET http://localhost:3001/api/people
→ Phải trả về mảng tên: ["Albert Einstein", "Barack Obama", ...]

GET http://localhost:3001/api/graph
→ Phải trả về object graph
```

### ✅ Checklist Phase 2

- [ ] NestJS khởi động → log ra "Loaded graph with X nodes"
- [ ] `GET /api/people` trả về danh sách tên
- [ ] `GET /api/graph` trả về graph data
- [ ] BFS logic hoạt động (test trong terminal trước)

---

## Phase 3: WebSocket — BFS Real-time

**Trạng thái**: `pending`
**Mục tiêu**: Frontend gửi 2 tên → Backend stream từng bước BFS qua WebSocket

### Bước 3.1 — Tạo WebSocket Gateway

Tạo `backend/src/graph/graph.gateway.ts`:

**Giải thích WebSocket trong NestJS:**

```
NestJS dùng "Gateway" để xử lý WebSocket.
Gateway giống Controller, nhưng thay vì HTTP request/response,
nó lắng nghe "events" và gửi "events" qua kết nối WS.
```

**Flow WebSocket:**

```
Frontend gửi event "search":
  { startNode: "Einstein", endNode: "Obama" }
        ↓
Backend nhận → chạy BFS → mỗi level xong → gửi event "level_explored"
        ↓
Backend tìm thấy path → gửi event "path_found"
```

### Bước 3.2 — Sửa BFS để gọi callback mỗi level

BFS gốc chạy "âm thầm" → cần sửa để **mỗi khi xong 1 level**, gọi callback báo cho Gateway biết → Gateway gửi WS message cho frontend.

**Ý tưởng:**

```typescript
// BFS có callback
bfsWithCallback(start, end, onLevelComplete) {
    // ... BFS logic ...
    // Mỗi khi xong 1 level:
    onLevelComplete({
      level: currentLevel,
      nodesExplored: nodesInThisLevel,
      count: nodesInThisLevel.length
    });
}
```

### Bước 3.3 — Các message types gửi qua WS

| Event name       | Khi nào                      | Data gửi kèm                                                 |
| ---------------- | ---------------------------- | ------------------------------------------------------------ |
| `level_explored` | Mỗi level BFS xong           | `{ level: 1, nodes: ["Curie", "Bohr"], count: 2 }`           |
| `node_explored`  | Cho từng node trên path cuối | `{ level: 2, node: "Roosevelt", nodesExploredAtLevel: 150 }` |
| `path_found`     | Tìm thấy đường đi            | `{ path: ["Einstein", "Curie", "Obama"], length: 3 }`        |
| `error`          | Không tìm thấy / lỗi         | `{ message: "No path found" }`                               |

### ✅ Checklist Phase 3

- [ ] WebSocket Gateway chạy được
- [ ] Gửi search event → nhận được messages
- [ ] Nhận được `level_explored` theo từng level
- [ ] Nhận được `path_found` ở cuối

> [!TIP]
> **Test WebSocket nhanh**: Dùng extension "WebSocket King" trên Chrome hoặc `wscat` trên terminal.
>
> ```bash
> npx wscat -c ws://localhost:3001
> ```

---

## Phase 4: Frontend — Search UI

**Trạng thái**: `pending`
**Mục tiêu**: Trang chính có form tìm kiếm + hiển thị kết quả real-time

### Bước 4.1 — Layout trang chính (`app/page.tsx`)

```
┌──────────────────────────────────────────────────────────┐
│              🕸️ Degree of Six                             │
│         "Mọi người cách nhau tối đa 6 bước"              │
├─────────────────┬────────────────────────────────────────┤
│  SEARCH PANEL   │        GRAPH VISUALIZATION             │
│  (bên trái)     │        (bên phải)                      │
│                 │                                        │
│  [Start ▾]      │           (Phase 5 mới làm)            │
│  [End   ▾]      │                                        │
│  [🔍 Search]    │                                        │
│                 │                                        │
│  ─── LOG ───    │                                        │
│  Connected ✓    │                                        │
│  Level 1: 5     │                                        │
│  Level 2: 47    │                                        │
│  Path found!    │                                        │
│  3 degrees      │                                        │
│                 │                                        │
│  ─ RESULT ──    │                                        │
│  Einstein       │                                        │
│    → Curie      │                                        │
│    → Roosevelt  │                                        │
│    → Obama      │                                        │
└─────────────────┴────────────────────────────────────────┘
```

### Bước 4.2 — Components cần tạo

**Component 1: `SearchForm.tsx`**

```
Chức năng:
- 2 ô input với autocomplete (gõ → gợi ý tên)
- Nút "Search"
- Lấy danh sách tên từ API GET /api/people
- Khi bấm Search → emit event lên parent
```

**Component 2: `SearchLog.tsx`**

```
Chức năng:
- Hiển thị danh sách các bước BFS đang diễn ra
- Mỗi dòng: "Level X: đã kiểm tra Y nodes"
- Cuối cùng: "Path found! Z degrees of separation"
- Có animation khi dòng mới xuất hiện
```

**Component 3: `PathResult.tsx`**

```
Chức năng:
- Hiển thị đường đi: A → B → C → D
- Mỗi node là 1 thẻ/card có thể click
- Có animation nối giữa các cards
```

### Bước 4.3 — Custom Hook: `useWebSocket.ts`

```
Chức năng:
- Kết nối tới WebSocket backend (ws://localhost:3001)
- Gửi search request
- Lắng nghe messages → cập nhật state
- Tự đóng/mở kết nối khi search mới
```

**Flow trong hook:**

```
1. User bấm Search
2. Hook mở WS connection
3. Gửi { startNode, endNode }
4. Lắng nghe events:
   - "level_explored" → thêm vào log
   - "path_found" → lưu path, đóng kết nối
   - "error" → hiển thị lỗi
5. Return: { logs, path, isSearching, error }
```

### Bước 4.4 — Custom Hook: `usePeople.ts`

```
Chức năng:
- Gọi GET /api/people khi component mount
- Cache lại kết quả (gọi 1 lần dùng mãi)
- Return: { people, isLoading }
```

### ✅ Checklist Phase 4

- [ ] Autocomplete hoạt động — gõ tên → gợi ý
- [ ] Bấm Search → WebSocket kết nối thành công
- [ ] Search Log hiển thị từng level real-time
- [ ] Path Result hiển thị đường đi sau khi tìm thấy
- [ ] Xử lý case: không tìm thấy → hiện thông báo lỗi

---

## Phase 5: Frontend — Graph Visualization

**Trạng thái**: `pending`
**Mục tiêu**: Vẽ mạng lưới nodes và edges, highlight path tìm được

### Bước 5.1 — Cài thư viện

```bash
cd frontend
npm install graphology sigma @react-sigma/core
```

**Giải thích thư viện:**

- **Graphology**: Quản lý dữ liệu graph (nodes, edges) trong JavaScript
- **Sigma.js**: Render (vẽ) graph lên canvas HTML5 — hỗ trợ zoom, pan, click
- **@react-sigma/core**: Wrapper của Sigma.js cho React

### Bước 5.2 — Component `GraphCanvas.tsx`

**Chức năng:**

```
1. Nhận data từ WebSocket (nodes explored ở mỗi level)
2. Thêm nodes vào graph (Graphology)
3. Sigma.js tự động render
4. Khi có path → highlight nodes & edges trên path
   - Start node: màu XANH LÁ
   - End node: màu ĐỎ
   - Path nodes: màu XANH DƯƠNG, kích thước LỚN
   - Explored nodes: màu TÍM, kích thước NHỎ
```

### Bước 5.3 — Layout thuật toán cho nodes

Khi có 1000+ nodes, cần **thuật toán sắp xếp vị trí** (layout) để không chồng chéo:

```bash
npm install graphology-layout graphology-layout-forceatlas2
```

```
- Dùng ForceAtlas2 layout (có sẵn trong graphology)
- Hoặc circular layout cho nodes trên path
- Explored nodes xếp xung quanh
```

### Bước 5.4 — Tương tác

```
- Zoom in/out bằng scroll chuột
- Kéo thả canvas
- Hover node → hiện tooltip tên
- Click node → mở trang Wikipedia
```

### ✅ Checklist Phase 5

- [ ] Graph canvas hiển thị được
- [ ] Explored nodes xuất hiện real-time theo mỗi level BFS
- [ ] Path được highlight rõ ràng (màu khác, size lớn)
- [ ] Zoom/Pan hoạt động mượt
- [ ] Hover hiện tên node

> [!WARNING]
> **Đây là phase khó nhất!** Sigma.js có learning curve. Nếu bị stuck, có thể tạm thời skip phase này và quay lại sau. App vẫn hoạt động tốt chỉ với Search Log + Path Result.

---

## Phase 6: Polish & Animations

**Trạng thái**: `pending`
**Mục tiêu**: Làm UI đẹp, animation mượt, responsive

### Bước 6.1 — Dark Mode Theme

```
Thiết kế tổng thể:
- Nền: gradient xanh đen sâu (#0a0a1a → #111133)
- Text: trắng sáng
- Accent: xanh neon (#00ff88), tím (#8855ff)
- Cards: bg tối + border mờ (glassmorphism)
- Font: Inter hoặc Space Grotesk (Google Fonts)
```

### Bước 6.2 — Micro-animations

```
1. Tiêu đề: Glow effect nhấp nháy nhẹ
2. Search Log: Mỗi dòng mới → fade-in + slide-up
3. Path Result: Cards xuất hiện tuần tự với delay
4. Mũi tên giữa path cards: animate draw
5. Nút Search: Ripple effect khi click
6. Graph nodes: Fade-in khi xuất hiện
```

### Bước 6.3 — Responsive

```
- Desktop (>1024px): 2 cột — search panel bên trái | graph canvas bên phải
- Tablet (768-1024px): 2 cột, graph nhỏ hơn
- Mobile (<768px): 1 cột — search panel trên, graph dưới
```

### Bước 6.4 — Loading States

```
- Khi đang load danh sách người: Skeleton UI
- Khi đang search BFS: Spinner + pulse animation
- Search button disabled trong khi searching
```

### ✅ Checklist Phase 6

- [ ] Dark mode đẹp, nhìn chuyên nghiệp
- [ ] Animations mượt, không lag
- [ ] Responsive trên mobile
- [ ] Loading states cho mọi async action
- [ ] Error states có UI rõ ràng

---

## Phase 7: Docker & Deploy

**Trạng thái**: `pending`
**Mục tiêu**: Đóng gói + deploy lên production

### Bước 7.1 — Dockerfile

```dockerfile
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS backend-builder
WORKDIR /backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build

# Stage 3: Production
FROM node:20-alpine
WORKDIR /app
COPY --from=backend-builder /backend/dist ./dist
COPY --from=backend-builder /backend/node_modules ./node_modules
COPY --from=frontend-builder /frontend/out ./public
COPY data/graph.json ./data/
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

### Bước 7.2 — Deploy options

| Platform          | Miễn phí?    | Ghi chú                               |
| ----------------- | ------------ | ------------------------------------- |
| **Railway**       | ✅ Free tier | Đơn giản nhất, connect GitHub là xong |
| **Render**        | ✅ Free tier | Tương tự Railway                      |
| **Digital Ocean** | 💰 ~$5/tháng | Ổn định hơn, dùng credit sinh viên    |
| **VPS tự quản**   | 💰           | Cần biết Linux, Nginx                 |

### ✅ Checklist Phase 7

- [ ] Docker build thành công
- [ ] Docker run local hoạt động
- [ ] Deploy lên platform chọn
- [ ] Truy cập qua URL public

---

## Lộ Trình Thời Gian & Ưu Tiên

rồi

```
Phase 0 (Setup) ─────────────────── 1-2 giờ
    ↓
Phase 1 (Crawl Wikipedia) ──────── 3-4 giờ
    ↓
Phase 2 (Backend BFS + API) ────── 4-6 giờ     ← CỐT LÕI
    ↓
Phase 3 (WebSocket) ────────────── 3-4 giờ     ← CỐT LÕI
    ↓
Phase 4 (Frontend Search UI) ──── 4-6 giờ     ← CỐT LÕI
    ↓
  ╔═════════════════════════════════════════╗
  ║  🎉 MVP HOÀN THÀNH! App đã chạy được!  ║
  ║  (khoảng 15-22 giờ tổng cộng)          ║
  ╚═════════════════════════════════════════╝
    ↓
Phase 5 (Graph Viz) ────────────── 6-8 giờ    ← Khó nhưng WOW
    ↓
Phase 6 (Polish) ───────────────── 4-6 giờ    ← Làm đẹp
    ↓
Phase 7 (Deploy) ───────────────── 2-3 giờ    ← Đưa lên mạng
```

> [!IMPORTANT]
> **Sau Phase 4 bạn đã có app HOẠT ĐỘNG ĐẦY ĐỦ!** Phase 5-7 là nâng cấp thêm. Đừng cố làm tất cả cùng lúc — build từng phase, test xong mới sang phase tiếp theo.

---

## Tips Cho Sinh Viên

### 🧪 Test từng bước nhỏ

```
❌ ĐỪNG: Code xong hết rồi mới test
✅ NÊN:  Code 1 function → test ngay → hoạt động → tiếp

Ví dụ Phase 2:
1. Viết loadGraph() → console.log() xem data đúng chưa
2. Viết bfs() → test với 2 người gần nhau trước
3. Viết API endpoint → test bằng browser
```

### 🐛 Khi bị bug

```
1. Đọc error message (thường nó nói rõ lỗi gì)
2. console.log() data ở mỗi bước
3. Google error message
4. Hỏi AI / StackOverflow
```

### 📁 Git commit thường xuyên

```bash
git init
git add .
git commit -m "Phase 0: setup frontend + backend"
# ... làm xong Phase 1 ...
git add .
git commit -m "Phase 1: crawl Wikipedia completed, graph.json generated"
```

### 📚 Tài liệu tham khảo

- [NestJS WebSocket Gateway docs](https://docs.nestjs.com/websockets/gateways)
- [Next.js App Router docs](https://nextjs.org/docs/app)
- [Sigma.js examples](https://www.sigmajs.org/)
- [Wikipedia API sandbox](https://en.wikipedia.org/wiki/Special:ApiSandbox)
- [Tailwind CSS v4 docs](https://tailwindcss.com/docs)
