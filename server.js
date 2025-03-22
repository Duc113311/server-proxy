const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const https = require("https");
const { decodeBase64 } = require("./EncoderDecoderUtils");

const app = express();
const PORT = 3001;

const ALLOWED_APIS = {
  swtapi: "https://swtapi.tohapp.com",
  airapi: "https://airapi.tohapp.com",
  ipfind: "https://ipfind.co",
  sradar: "https://sradar.tohapp.com",
};

app.use(cors());
app.use(express.json());

app.use("/proxy/:apiName/*", async (req, res) => {
  const { apiName } = req.params;
  const targetBase = ALLOWED_APIS[apiName];

  if (!targetBase) {
    return res.status(400).json({ error: "API không hợp lệ" });
  }

  const targetPath = req.params[0] ? `/${req.params[0]}` : "";
  const fullUrl = `${targetBase}${targetPath}${req._parsedUrl.search || ""}`;

  console.log(`[→] Proxy ${req.method} ${fullUrl}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
    console.log("[⏰] Request timed out");
  }, 10000);

  try {
    const fetchRes = await fetch(fullUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        "Content-Type": req.headers["content-type"] || "application/json",
      },
      body:
        ["POST", "PUT", "PATCH"].includes(req.method) &&
        req.body &&
        Object.keys(req.body).length
          ? JSON.stringify(req.body)
          : undefined,
      agent: new https.Agent({ rejectUnauthorized: false }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    console.log(`[✓] Response nhận được từ ${apiName}`);

    const raw = await fetchRes.text();
    console.log("[DEBUG] Raw response:", raw.slice(0, 100)); // in trước 100 ký tự

    let decoded;
    try {
      decoded = decodeBase64(raw);
      if (decoded) {
        const parsed = JSON.parse(decoded);
        console.log("[✓] Decode & JSON.parse thành công");
        return res.status(fetchRes.status).json(parsed);
      } else {
        throw new Error("decodeBase64 trả về null");
      }
    } catch (e) {
      console.warn("[!] Không decode được, trả về raw text:", e.message);
      return res.status(fetchRes.status).send(raw); // fallback
    }

  } catch (err) {
    clearTimeout(timeout);
    console.error(`[✖] Proxy lỗi: ${err.message}`);
    res.status(500).json({
      error: "Lỗi proxy",
      message: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server chạy tại http://localhost:${PORT}`);
});
