const http = require("http");

// Old CloudBase Run service replaced by static hosting; keep this URL updated if hosting ever moves.
const TARGET_ORIGIN = "https://kaifanmiao-d4g695xaj0f058d58-1378999953.tcloudbaseapp.com";
const PORT = process.env.PORT || 3000;

http
  .createServer((req, res) => {
    const location = TARGET_ORIGIN + (req.url || "/");
    res.writeHead(302, {
      Location: location,
      "Content-Type": "text/plain; charset=utf-8",
    });
    res.end(`Redirecting to ${location}`);
  })
  .listen(PORT, () => {
    console.log(`Redirect server listening on port ${PORT}, forwarding to ${TARGET_ORIGIN}`);
  });
