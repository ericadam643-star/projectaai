const https = require("https");

const API_KEY = process.env.ANTHROPIC_API_KEY || "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";

require("http").createServer((req, res) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };
  if (req.method === "OPTIONS") { res.writeHead(200, headers); return res.end("{}"); }
  if (req.method !== "POST") { res.writeHead(200, headers); return res.end(JSON.stringify({status:"running", key: API_KEY ? "found" : "missing"})); }
  let body = "";
  req.on("data", d => body += d);
  req.on("end", () => {
    try {
      const parsed = JSON.parse(body);
      const payload = JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:parsed.system||"",messages:parsed.messages||[]});
      const apiReq = https.request({hostname:"api.anthropic.com",path:"/v1/messages",method:"POST",headers:{"Content-Type":"application/json","x-api-key":API_KEY,"anthropic-version":"2023-06-01","Content-Length":Buffer.byteLength(payload)}}, apiRes => {
        let data = "";
        apiRes.on("data", d => data += d);
        apiRes.on("end", () => {
          try { const json = JSON.parse(data); res.writeHead(apiRes.statusCode, headers); res.end(JSON.stringify({text:(json.content||[]).map(b=>b.text||"").join("")})); }
          catch(e) { res.writeHead(500, headers); res.end(JSON.stringify({error:e.message})); }
        });
      });
      apiReq.on("error", e => { res.writeHead(500, headers); res.end(JSON.stringify({error:e.message})); });
      apiReq.write(payload);
      apiReq.end();
    } catch(e) { res.writeHead(400, headers); res.end(JSON.stringify({error:e.message})); }
  });
}).listen(process.env.PORT||3000, () => console.log("Proxy running, key:", API_KEY ? "found" : "MISSING"));
