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
  let raw = "";

  try {
    const fetchRes = await fetch(fullUrl, {
      method: req.method,
      headers: {
        "User-Agent": "Node.js Proxy Server",
        Accept: "application/json",
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

    const contentType = fetchRes.headers.get("content-type") || "";
    raw = await fetchRes.text(); // lấy trước dù là ipfind hay không

    if (apiName === "ipfind") {
      try {
        const json = JSON.parse(raw); // parse JSON nếu ipfind
        return res.status(fetchRes.status).json(json);
      } catch (e) {
        console.warn(`[ipfind] ❌ JSON parse lỗi, trả raw`, e.message);
        return res.status(fetchRes.status).send(raw);
      }
    } else {
      const decoded = decodeBase64(raw);
      const parsed = JSON.parse(decoded);
      return res.status(fetchRes.status).json(parsed);
    }
  } catch (err) {
    clearTimeout(timeout);
    console.error(`[✖] Proxy lỗi: ${err.message}`);
    return res.status(500).json({
      error: "Lỗi proxy",
      message: err.message,
      raw: raw?.slice?.(0, 100),
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server chạy tại http://localhost:${PORT}`);
});
