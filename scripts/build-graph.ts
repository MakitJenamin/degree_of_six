/**
 * Script 2: Xây dựng graph.json từ seed_names.txt
 *
 * SỬ DỤNG PROXY TRUNG GIAN để tránh bị Wikipedia rate-limit.
 * Script sẽ xoay vòng giữa 3 proxy → mỗi proxy chỉ chịu 1/3 số request.
 *
 * Tính năng:
 * - Xoay vòng 3 proxy (round-robin)
 * - Tự lưu mỗi 20 người (không mất data nếu bị dừng)
 * - Tự resume từ chỗ cũ nếu chạy lại
 * - Retry tự động khi gặp lỗi
 *
 * Chạy: npx tsx scripts/build-graph.ts
 */

import * as fs from "fs";
import * as path from "path";

// Cần cài undici để dùng proxy với fetch
// undici là thư viện HTTP mà Node.js dùng bên dưới, nhưng ta cần import trực tiếp
// để dùng ProxyAgent (giúp gửi request qua proxy)
import { ProxyAgent } from "undici";

// ===== CẤU HÌNH =====

// Danh sách proxy trung gian
// Mỗi request sẽ dùng 1 proxy khác nhau (xoay vòng)
// → Wikipedia thấy 3 IP khác nhau → không block
const PROXIES = [
  "http://160.250.166.35:10645",
  "http://160.250.166.28:10735",
  "http://160.250.166.33:10951",
];

// User-Agent giả lập trình duyệt (Wikipedia thân thiện hơn với browser)
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Delay giữa mỗi request (ms) — 500ms là đủ khi có proxy
const DELAY = 500;

// Số lần retry khi gặp lỗi
const MAX_RETRIES = 3;

// ===== TYPES =====

// Graph: { "Tên người": ["Người link tới 1", "Người link tới 2", ...] }
type Graph = Record<string, string[]>;

// ===== BIẾN TOÀN CỤC =====

// Biến đếm để xoay vòng proxy
let proxyIndex = 0;

/**
 * Lấy proxy tiếp theo (xoay vòng)
 * VD: request 1 → proxy 0, request 2 → proxy 1, request 3 → proxy 2,
 *     request 4 → proxy 0 (quay lại), ...
 */
function getNextProxy(): ProxyAgent {
  const proxyUrl = PROXIES[proxyIndex % PROXIES.length];
  proxyIndex++;
  return new ProxyAgent(proxyUrl);
}

// ===== CÁC HÀM CHÍNH =====

/**
 * Đọc file seed_names.txt → trả về mảng tên
 */
function loadSeedNames(): string[] {
  // Thử đọc từ data/ trước, nếu không có thì đọc từ thư mục gốc
  let filePath = path.join(__dirname, "..", "data", "seed_names.txt");
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, "..", "seed_names.txt");
  }
  if (!fs.existsSync(filePath)) {
    throw new Error("Không tìm thấy seed_names.txt ở data/ hoặc thư mục gốc!");
  }

  console.log(`📖 Đọc file: ${filePath}`);
  return fs
    .readFileSync(filePath, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/**
 * Đọc graph.json đã có sẵn (nếu script bị dừng giữa chừng → tiếp tục từ đó)
 */
function loadExistingGraph(): Graph {
  const filePath = path.join(__dirname, "..", "data", "graph.json");
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Ghi graph ra file JSON
 */
function saveGraph(graph: Graph): void {
  const filePath = path.join(__dirname, "..", "data", "graph.json");
  fs.writeFileSync(filePath, JSON.stringify(graph, null, 2), "utf-8");
}

/**
 * Gọi Wikipedia API lấy tất cả outbound links từ 1 trang
 * Dùng PROXY để gửi request → Wikipedia thấy IP của proxy, không phải IP của bạn
 *
 * @param pageTitle - Tên trang Wikipedia (VD: "Albert Einstein")
 * @returns Mảng tên các trang mà trang này link tới
 */
async function getLinksFromPage(pageTitle: string): Promise<string[]> {
  const allLinks: string[] = [];
  let continueToken: string | undefined = undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      while (true) {
        // Xây dựng URL cho Wikipedia API
        const params = new URLSearchParams({
          action: "query",       // Loại request: truy vấn dữ liệu
          titles: pageTitle,     // Tên trang cần lấy links
          prop: "links",         // Thuộc tính cần lấy: danh sách links
          pllimit: "500",        // Tối đa 500 links/request
          plnamespace: "0",      // Chỉ lấy bài viết chính (không phải Category, User, v.v.)
          format: "json",        // Trả về JSON
        });

        // Nếu trang có > 500 links, cần gọi tiếp với continue token
        if (continueToken) {
          params.set("plcontinue", continueToken);
        }

        const url = `https://en.wikipedia.org/w/api.php?${params.toString()}`;

        // Lấy proxy tiếp theo (xoay vòng giữa 3 proxy)
        const proxyAgent = getNextProxy();

        // Gửi request QUA PROXY
        // dispatcher: proxyAgent → bảo fetch gửi request qua proxy thay vì trực tiếp
        const response = await fetch(url, {
          headers: {
            "User-Agent": USER_AGENT,
            Accept: "application/json",
          },
          // @ts-ignore — TypeScript chưa nhận diện dispatcher, nhưng Node.js 18+ hỗ trợ
          dispatcher: proxyAgent,
        });

        // Nếu bị rate-limited (HTTP 429) → đợi rồi thử lại
        if (response.status === 429) {
          const waitTime = (attempt + 1) * 5000;
          console.log(`   ⏳ Rate-limited, đợi ${waitTime / 1000}s...`);
          await sleep(waitTime);
          throw new Error("rate-limited");
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // Parse JSON response từ Wikipedia
        const data = await response.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];

        // pageId = "-1" nghĩa là trang không tồn tại trên Wikipedia
        if (pageId === "-1") return [];

        // Lấy danh sách links từ response
        const links = pages[pageId].links || [];
        for (const link of links) {
          allLinks.push(link.title);
        }

        // Kiểm tra pagination: Wikipedia chỉ trả 500 links/lần
        // Nếu còn nhiều hơn → data.continue chứa token để gọi tiếp
        if (data.continue && data.continue.plcontinue) {
          continueToken = data.continue.plcontinue;
          await sleep(200); // Delay nhỏ giữa các page
        } else {
          return allLinks; // Đã lấy hết!
        }
      }
    } catch (err: any) {
      if (err.message === "rate-limited" && attempt < MAX_RETRIES - 1) {
        continue; // Thử lại với proxy khác
      }
      if (attempt === MAX_RETRIES - 1) {
        console.log(`   ⚠️ Bỏ qua "${pageTitle}" sau ${MAX_RETRIES} lần thử`);
        return allLinks;
      }
    }
  }

  return allLinks;
}

/**
 * Hàm đợi X mili giây
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ===== CHẠY CHƯƠNG TRÌNH CHÍNH =====

async function main() {
  // Bước 1: Đọc danh sách tên từ seed_names.txt
  const seedNames = loadSeedNames();

  // Tạo Set để tra cứu nhanh O(1)
  // Set giống mảng nhưng tra cứu "có tên X không?" cực nhanh
  const seedSet = new Set(seedNames);

  // Bước 2: Load graph cũ (nếu có) để tiếp tục từ chỗ dừng
  const graph = loadExistingGraph();
  const alreadyDone = Object.keys(graph).length;

  console.log(`🚀 Bắt đầu xây dựng graph...`);
  console.log(`👥 Tổng số người: ${seedNames.length}`);
  console.log(`🔀 Proxy: ${PROXIES.length} cái (xoay vòng)`);
  if (alreadyDone > 0) {
    console.log(`♻️  Đã có: ${alreadyDone} người → tiếp tục từ đây`);
  }
  console.log();

  const startTime = Date.now();

  // Bước 3: Lọc ra những người chưa crawl
  const remaining = seedNames.filter((name) => graph[name] === undefined);
  console.log(`📋 Còn lại: ${remaining.length} người cần crawl\n`);

  // Bước 4: Crawl song song — 3 người cùng lúc (mỗi proxy 1 cái)
  // PROXIES.length = 3, nên mỗi batch xử lý 3 người song song
  const BATCH_SIZE = PROXIES.length; // = 3

  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE);

    // Promise.all = chạy TẤT CẢ cùng lúc, đợi TẤT CẢ xong mới tiếp
    const results = await Promise.all(
      batch.map(async (name) => {
        const allLinks = await getLinksFromPage(name);
        // LỌC: chỉ giữ links cũng nằm trong danh sách seed
        const relevantLinks = allLinks.filter(
          (link) => seedSet.has(link) && link !== name
        );
        return { name, relevantLinks };
      })
    );

    // Lưu kết quả vào graph
    for (const { name, relevantLinks } of results) {
      graph[name] = relevantLinks;
    }

    // Hiển thị tiến trình
    const done = Object.keys(graph).length;
    const percent = ((done / seedNames.length) * 100).toFixed(1);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const names = results.map((r) => `${r.name}(${r.relevantLinks.length})`).join(", ");
    console.log(`   📊 ${done}/${seedNames.length} (${percent}%) [${elapsed}s] — ${names}`);

    // Lưu file mỗi 21 người (7 batch × 3)
    if (done % 21 < BATCH_SIZE) {
      saveGraph(graph);
      console.log(`   💾 Đã lưu graph.json`);
    }

    // Delay nhỏ giữa các batch
    await sleep(DELAY);
  }

  // Bước 4: Lưu lần cuối
  saveGraph(graph);

  // Bước 5: Hiển thị thống kê
  const totalEdges = Object.values(graph).reduce((s, l) => s + l.length, 0);
  const withLinks = Object.values(graph).filter((l) => l.length > 0).length;
  const isolated = Object.values(graph).filter((l) => l.length === 0).length;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n🎉 Hoàn thành trong ${elapsed} giây!`);
  console.log(`📊 Thống kê:`);
  console.log(`   Nodes (người): ${Object.keys(graph).length}`);
  console.log(`   Edges (liên kết): ${totalEdges}`);
  console.log(`   Có liên kết: ${withLinks} người`);
  console.log(`   Không có liên kết: ${isolated} người`);
  console.log(
    `   Trung bình: ${(totalEdges / Object.keys(graph).length).toFixed(1)} liên kết/người`
  );

  // Hiển thị ví dụ 3 người đầu tiên
  console.log(`\n📋 Ví dụ 3 người đầu:`);
  Object.entries(graph)
    .filter(([_, links]) => links.length > 0)
    .slice(0, 3)
    .forEach(([name, links]) => {
      console.log(
        `   ${name} → [${links.slice(0, 5).join(", ")}${links.length > 5 ? ", ..." : ""}] (${links.length})`
      );
    });
}

main().catch((err) => {
  console.error("❌ Lỗi:", err.message);
  process.exit(1);
});
