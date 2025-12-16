/**
 * instakoo Backend Server
 * Monolith Deployment for Cloud Run (Express serving React Static Files)
 */

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import NodeCache from "node-cache";
import rateLimit from "express-rate-limit";
import axios from "axios";
import * as cheerio from "cheerio";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";
import dotenv from "dotenv";

dotenv.config();

// ESM __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// --------------------
// Middlewares
// --------------------
app.use(cors());
app.use(bodyParser.json());

// --------------------
// Cache
// --------------------
const diagnosisCache = new NodeCache({ stdTTL: 43200 });

// --------------------
// Rate Limit
// --------------------
const diagnosisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const naverPlaceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

// --------------------
// Utils
// --------------------
const parseIgNumber = (str) => {
  if (!str) return 0;
  let clean = str.replace(/,/g, "").replace(/\s/g, "").toLowerCase();
  let multiplier = 1;
  if (clean.includes("k")) multiplier = 1000;
  if (clean.includes("m")) multiplier = 1_000_000;
  if (clean.includes("b")) multiplier = 1_000_000_000;
  clean = clean.replace(/[kmb]/g, "");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.floor(num * multiplier);
};

const extractKeywords = (text) => {
  if (!text) return { main: [], sub: [] };
  const tokens = text.replace(/[^\w\s가-힣]/g, " ").split(/\s+/);
  const stopWords = ["있는", "없는", "하는", "및", "등", "를", "을", "가", "이", "은", "는", "에", "의", "도", "다"];
  const freq = {};
  tokens.forEach((t) => {
    if (t.length > 1 && !stopWords.includes(t)) {
      freq[t] = (freq[t] || 0) + 1;
    }
  });
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return {
    main: sorted.slice(0, 5).map((x) => x[0]),
    sub: sorted.slice(5, 12).map((x) => x[0]),
  };
};

/**
 * ✅ naver.me / map.naver.com 어떤 형태든
 * placeId 뽑아서 네가 원하는 정본 URL로 통일:
 * https://map.naver.com/p/entry/place/{placeId}
 */
const resolveNaverPlaceUrl = async (inputUrl) => {
  try {
    const res = await axios.get(inputUrl, {
      maxRedirects: 10,
      validateStatus: (s) => s < 400,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      timeout: 8000,
    });

    const finalUrl = res.request?.res?.responseUrl || inputUrl;

    // ✅ /place/2098086907 형태에서 placeId 추출 (v5/entry든 p/entry든 공통)
    const match = finalUrl.match(/\/place\/(\d+)/);
    const placeId = match ? match[1] : null;

    // ✅ 정본 URL
    const canonicalUrl = placeId
      ? `https://map.naver.com/p/entry/place/${placeId}`
      : finalUrl;

    return { inputUrl, finalUrl, placeId, canonicalUrl };
  } catch (e) {
    return { inputUrl, finalUrl: inputUrl, placeId: null, canonicalUrl: inputUrl };
  }
};

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`TIMEOUT_${ms}`)), ms)),
  ]);

// --------------------
// Playwright Scraper
// --------------------
const scrapeNaverPlace = async (url) => {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const context = await browser.newContext({
      locale: "ko-KR",
      timezoneId: "Asia/Seoul",
    });

    const page = await context.newPage();
    page.setDefaultTimeout(3000);

    await page.route("**/*", (route) => {
      const t = route.request().resourceType();
      if (["image", "font", "media"].includes(t)) return route.abort();
      route.continue();
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1500);

    const dom = await page.evaluate(() => {
      const bodyText = document.body?.innerText || "";
      const title =
        document.querySelector("h1")?.innerText ||
        document.querySelector("[role='heading']")?.innerText ||
        "Unknown";
      return { bodyText: bodyText.slice(0, 20000), placeName: title };
    });

    const receiptMatch = dom.bodyText.match(/방문자리뷰\s*([0-9.,kmKM]+)/);
    const blogMatch = dom.bodyText.match(/블로그리뷰\s*([0-9.,kmKM]+)/);

    return {
      placeName: dom.placeName,
      directionsText: "",
      storeInfoText: dom.bodyText.slice(0, 4000),
      photoCount: dom.bodyText.includes("사진") ? 10 : 0,
      blogReviewCount: blogMatch ? parseIgNumber(blogMatch[1]) : 0,
      receiptReviewCount: receiptMatch ? parseIgNumber(receiptMatch[1]) : 0,
      menuCount: 0,
      menuWithDescriptionCount: 0,
      fullText: dom.bodyText.slice(0, 5000),
    };
  } catch (e) {
    throw new Error("SCRAPE_FAILED");
  } finally {
    if (browser) await browser.close();
  }
};

// --------------------
// Naver Score
// --------------------
const calculateNaverScore = (data) => {
  let score = 0;
  const keywords = extractKeywords(data.fullText);
  if (data.storeInfoText.length > 300) score += 25;
  if (data.receiptReviewCount > 50) score += 15;
  if (data.blogReviewCount > 10) score += 15;
  if (data.photoCount > 5) score += 10;
  if (keywords.main.length >= 3) score += 10;

  let grade = "D";
  if (score >= 90) grade = "S";
  else if (score >= 70) grade = "A";
  else if (score >= 50) grade = "B";
  else if (score >= 30) grade = "C";

  return { score, grade, keywords, breakdown: [], recommendations: [] };
};

// --------------------
// Instagram Diagnosis
// --------------------
app.get("/api/diagnosis/instagram", diagnosisLimiter, async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ success: false });

  const cacheKey = `ig_${username}`;
  const cached = diagnosisCache.get(cacheKey);
  if (cached) return res.json({ success: true, source: "cache", data: cached });

  try {
    const html = (await axios.get(`https://www.instagram.com/${username}/`)).data;
    const $ = cheerio.load(html);
    const meta = $('meta[property="og:description"]').attr("content");
    const match = meta?.match(/([0-9.,km]+)\s*Followers?,\s*([0-9.,km]+)\s*Following,\s*([0-9.,km]+)\s*Posts?/i);
    if (!match) throw new Error("PARSE_FAILED");

    const data = {
      followers: parseIgNumber(match[1]),
      following: parseIgNumber(match[2]),
      posts: parseIgNumber(match[3]),
    };

    diagnosisCache.set(cacheKey, data);
    res.json({ success: true, source: "live", data });
  } catch {
    res.status(503).json({ success: false });
  }
});

// --------------------
// Naver Place Diagnosis (✅ naver.me -> p/entry 정규화)
// --------------------
app.post("/api/diagnosis/naver-place", naverPlaceLimiter, async (req, res) => {
  const { url } = req.body;

  if (!url || (!url.includes("naver.me") && !url.includes("naver.com"))) {
    return res.status(400).json({
      ok: false,
      error: "INVALID_URL",
      message: "올바른 네이버 플레이스 링크(naver.me 또는 map.naver.com)를 입력해주세요.",
    });
  }

  let resolved = null;

  try {
    // ✅ 1) 정규화 (naver.me → finalUrl → placeId → canonicalUrl)
    resolved = await resolveNaverPlaceUrl(url);

    // ✅ 2) 캐시 키: placeId가 있으면 그걸로 고정 (제일 안정적)
    const cacheKey = resolved.placeId
      ? `np_id_${resolved.placeId}`
      : `np_url_${Buffer.from(resolved.canonicalUrl).toString("base64")}`;

    const cached = diagnosisCache.get(cacheKey);
    if (cached) return res.json(cached);

    // ✅ 3) 스크래핑은 canonicalUrl로 (네가 원하는 형태)
    const scraped = await withTimeout(scrapeNaverPlace(resolved.canonicalUrl), 55000);
    const analysis = calculateNaverScore(scraped);

    const response = {
      ok: true,
      inputUrl: url,
      finalUrl: resolved.finalUrl,
      canonicalUrl: resolved.canonicalUrl,
      placeId: resolved.placeId,
      placeName: scraped.placeName,
      metrics: scraped,
      score: analysis.score,
      grade: analysis.grade,
      keywords: analysis.keywords,
    };

    diagnosisCache.set(cacheKey, response);
    res.json(response);
  } catch (e) {
    const msg = String(e?.message || e);

    if (msg.startsWith("TIMEOUT_") || msg.startsWith("TIMEOUT")) {
      return res.status(504).json({
        ok: false,
        error: "TIMEOUT",
        message: "네이버 페이지 응답이 지연되어 분석이 중단되었습니다.",
        debug: { message: msg, resolved },
      });
    }

    return res.status(500).json({
      ok: false,
      error: "SCRAPE_FAILED",
      message: "페이지 정보를 수집하는데 실패했습니다.",
      debug: { message: msg, resolved },
    });
  }
});

// --------------------
// Health & Version
// --------------------
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.get("/api/version", (req, res) => res.json({ ok: true, version: "stable-v2-p-entry" }));

// --------------------
// Runtime Config
// --------------------
app.get("/runtime-config.js", (req, res) => {
  res.type("application/javascript");
  res.setHeader("Cache-Control", "no-store");
  res.send(`window.__RUNTIME_CONFIG__ = { API_BASE_URL: "${process.env.API_URL || ""}" };`);
});

// --------------------
// Static + SPA
// --------------------
app.use(express.static(path.join(__dirname, "../dist")));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "../dist", "index.html")));

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
