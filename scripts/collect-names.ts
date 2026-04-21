/**
 * Script 1: Thu thập tên diễn viên từ trang Wikipedia
 *
 * Cách hoạt động:
 * 1. Gọi Wikipedia API lấy tất cả LINKS trong trang danh sách
 * 2. Lọc sơ bộ: bỏ tên phim, lễ trao giải, trang kỹ thuật
 * 3. Xác nhận bằng Wikipedia API: kiểm tra mô tả ngắn (description)
 *    → chỉ giữ những trang mà Wikipedia ghi rõ là "actor", "actress", v.v.
 * 4. Ghi kết quả ra data/seed_names.txt
 *
 * Chạy: npx tsx scripts/collect-names.ts
 */

import * as fs from "fs";
import * as path from "path";

// ===== CẤU HÌNH =====

// Trang Wikipedia chứa danh sách diễn viên bạn muốn crawl
// Bạn có thể thêm nhiều trang vào mảng này
const LIST_PAGES = [
  "List_of_actors_with_more_than_one_Academy_Award_nomination_in_the_acting_categories",
];

const USER_AGENT = "DegreeOfSix/1.0 (student-project)";

// ===== LOGIC CHÍNH =====

/**
 * Gọi Wikipedia API để lấy tất cả links trong 1 trang
 */
async function getLinksFromPage(pageTitle: string): Promise<string[]> {
  const allLinks: string[] = [];
  let continueToken: string | undefined = undefined;

  console.log(`📖 Đang đọc trang: ${pageTitle}`);

  while (true) {
    const params = new URLSearchParams({
      action: "query",
      titles: pageTitle,
      prop: "links",
      pllimit: "500",
      plnamespace: "0",
      format: "json",
    });

    if (continueToken) {
      params.set("plcontinue", continueToken);
    }

    const url = `https://en.wikipedia.org/w/api.php?${params.toString()}`;
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!response.ok) {
      throw new Error(`Wikipedia API lỗi: ${response.status}`);
    }

    const data = await response.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    const links = pages[pageId].links || [];

    for (const link of links) {
      allLinks.push(link.title);
    }

    console.log(`   → Lấy được ${links.length} links (tổng: ${allLinks.length})`);

    if (data.continue && data.continue.plcontinue) {
      continueToken = data.continue.plcontinue;
    } else {
      break;
    }

    await sleep(100);
  }

  return allLinks;
}

/**
 * Lọc sơ bộ: loại bỏ những thứ CHẮC CHẮN không phải người
 */
function quickFilter(names: string[]): string[] {
  return names.filter((name) => {
    // Bỏ tên quá ngắn
    if (name.length < 4) return false;

    // Bỏ trang kỹ thuật Wikipedia
    if (name.includes(":")) return false;

    // Bỏ tên bắt đầu bằng số (VD: "1st Academy Awards", "12 Monkeys")
    if (/^\d/.test(name)) return false;

    // Bỏ tên phim có năm trong ngoặc: "12 Years a Slave (film)"
    if (/\(film\)/.test(name)) return false;
    if (/\(.*\d{4}.*film\)/.test(name)) return false;

    // Bỏ các trang danh sách, giải thưởng, khái niệm
    const lowerName = name.toLowerCase();
    const excludePatterns = [
      "list of", "academy award", "golden globe", "screen actors guild",
      "bafta", "emmy award", "grammy", "tony award",
      "oscar", "nomination", "ceremony", "award",
      "filmography", "discography", "bibliography",
      "film festival", "television", "musical",
      "theatre", "theater", "broadway",
      "united states", "united kingdom", "new york",
      "los angeles", "california", "london", "hollywood",
      "english language", "american film",
    ];

    for (const pattern of excludePatterns) {
      if (lowerName.includes(pattern)) return false;
    }

    return true;
  });
}

/**
 * Xác nhận bằng Wikipedia API: kiểm tra description ngắn
 * Wikipedia/Wikidata mô tả mỗi trang bằng 1 câu ngắn, VD:
 * - "Albert Einstein" → "German-born theoretical physicist"
 * - "Barack Obama" → "President of the United States from 2009 to 2017"
 * - "Meryl Streep" → "American actress (born 1949)"
 *
 * Ta kiểm tra description có chứa từ khóa liên quan "người" không.
 */
async function verifyPeople(names: string[]): Promise<string[]> {
  const confirmedPeople: string[] = [];
  const BATCH_SIZE = 50; // Wikipedia API cho phép query 50 trang 1 lần

  // Từ khóa trong description cho thấy đây là NGƯỜI (chỉ nghề nghiệp, không dùng quốc tịch)
  const personKeywords = [
    "actor", "actress", "singer", "musician", "director",
    "politician", "president", "writer", "author", "poet",
    "painter", "artist", "composer", "dancer", "comedian",
    "producer", "filmmaker", "screenwriter", "playwright",
    "entertainer", "performer", "model", "athlete",
    "businessperson", "entrepreneur", "activist",
    "philanthropist", "diplomat", "lawyer", "judge",
    "scientist", "physicist", "chemist", "biologist",
    "engineer", "mathematician", "philosopher",
    "born 1", "born 2", // "born 1949", "born 2001" — chỉ match "born" kèm số năm
    "died 1", "died 2",
  ];

  console.log(`\n🔍 Đang xác nhận ${names.length} tên qua Wikipedia API...`);

  for (let i = 0; i < names.length; i += BATCH_SIZE) {
    const batch = names.slice(i, i + BATCH_SIZE);

    // Gọi API với prop=description (Wikidata short description)
    const params = new URLSearchParams({
      action: "query",
      titles: batch.join("|"), // Ghép 50 tên bằng dấu |
      prop: "description",
      format: "json",
    });

    const url = `https://en.wikipedia.org/w/api.php?${params.toString()}`;
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!response.ok) {
      console.log(`   ⚠️ API lỗi batch ${i}-${i + BATCH_SIZE}, bỏ qua`);
      continue;
    }

    const data = await response.json();
    const pages = data.query.pages;

    for (const pageId of Object.keys(pages)) {
      const page = pages[pageId];

      // Bỏ trang không tồn tại
      if (pageId === "-1" || page.missing !== undefined) continue;

      const title = page.title;
      const desc = (page.description || "").toLowerCase();

      // Kiểm tra description có chứa từ khóa "người" không
      const isPerson = personKeywords.some((keyword) => desc.includes(keyword));

      if (isPerson) {
        confirmedPeople.push(title);
      }
    }

    const processed = Math.min(i + BATCH_SIZE, names.length);
    console.log(`   📊 Đã kiểm tra ${processed}/${names.length} — Xác nhận: ${confirmedPeople.length} người`);

    await sleep(100);
  }

  return confirmedPeople;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ===== CHẠY CHƯƠNG TRÌNH =====

async function main() {
  console.log("🚀 Bắt đầu thu thập tên diễn viên từ Wikipedia...\n");

  const allNames = new Set<string>();

  // Bước 1: Lấy tất cả links từ trang danh sách
  for (const page of LIST_PAGES) {
    const links = await getLinksFromPage(page);
    console.log(`   📝 Tổng links thô: ${links.length}`);

    // Bước 2: Lọc sơ bộ
    const quickFiltered = quickFilter(links);
    console.log(`   🧹 Sau lọc sơ bộ: ${quickFiltered.length}`);

    for (const name of quickFiltered) {
      allNames.add(name);
    }
  }

  // Bước 3: Xác nhận bằng Wikipedia description API
  const uniqueNames = Array.from(allNames);
  const confirmedPeople = await verifyPeople(uniqueNames);

  // Sắp xếp theo ABC
  const sortedNames = confirmedPeople.sort();

  // Ghi ra file
  const outputPath = path.join(__dirname, "..", "data", "seed_names.txt");
  fs.writeFileSync(outputPath, sortedNames.join("\n"), "utf-8");

  console.log(`\n🎉 Hoàn thành!`);
  console.log(`📄 File: ${outputPath}`);
  console.log(`👥 Tổng số người xác nhận: ${sortedNames.length}`);
  console.log(`\n📋 10 tên đầu tiên:`);
  sortedNames.slice(0, 10).forEach((name, i) => {
    console.log(`   ${i + 1}. ${name}`);
  });
}

main().catch((err) => {
  console.error("❌ Lỗi:", err.message);
  process.exit(1);
});
