import http from 'node:http';
import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const API_DIR = path.join(ROOT_DIR, 'api');

// 환경변수 로드 (.env.local)
if (existsSync(path.join(ROOT_DIR, '.env.local'))) {
  try {
    process.loadEnvFile(path.join(ROOT_DIR, '.env.local'));
  } catch (err) {
    console.warn('[경고] .env.local 로드 실패:', err.message);
  }
} else {
  console.warn('[안내] .env.local 파일이 없습니다. 기본 환경변수로 실행합니다.');
}

// vercel.json에서 보안 헤더 로드
let securityHeaders = [];
try {
  const vercelJsonPath = path.join(ROOT_DIR, 'vercel.json');
  if (existsSync(vercelJsonPath)) {
    const vdata = JSON.parse(readFileSync(vercelJsonPath, 'utf-8'));
    if (vdata.headers && vdata.headers[0]?.headers) {
      securityHeaders = vdata.headers[0].headers;
    }
  }
} catch (e) {
  console.warn('[경고] vercel.json 헤더 파싱 실패:', e.message);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8'
};

const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer(async (req, res) => {
  const startTime = Date.now();
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // 보안 헤더 적용
  for (const h of securityHeaders) {
    res.setHeader(h.key, h.value);
  }

  // 로깅 함수
  const logResponse = (status) => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${pathname} ${status} ${duration}ms`);
  };

  // 1. API 요청 처리 (/api/*)
  if (pathname.startsWith('/api/')) {
    const apiName = pathname.slice(5);

    // 유효하지 않은 API 경로 검사 (/, ., _ 시작 등)
    if (!apiName || apiName.includes('/') || apiName.includes('..') || apiName.startsWith('_')) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: '없는 API예요.' } }));
      logResponse(404);
      return;
    }

    const apiFilePath = path.join(API_DIR, `${apiName}.js`);
    if (!existsSync(apiFilePath)) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: '없는 API예요.' } }));
      logResponse(404);
      return;
    }

    try {
      const moduleUrl = `${path.toNamespacedPath(apiFilePath)}?t=${Date.now()}`;
      const mod = await import(`file://${apiFilePath.replace(/\\/g, '/')}?t=${Date.now()}`);
      if (typeof mod.default === 'function') {
        await mod.default(req, res);
        logResponse(res.statusCode);
      } else {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'API 핸들러가 올바르지 않아요.' } }));
        logResponse(500);
      }
    } catch (err) {
      if (err.status) {
        res.statusCode = err.status;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: { code: err.code || 'ERROR', message: err.message } }));
        logResponse(err.status);
      } else {
        console.error('[API 오류]', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: { code: 'SERVER_ERROR', message: '서버 내부 오류가 발생했어요.' } }));
        logResponse(500);
      }
    }
    return;
  }

  // 2. 정적 파일 처리 (public/*)
  // 디렉터리 탐색 차단
  if (pathname.includes('..')) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('접근할 수 없는 경로예요.');
    logResponse(403);
    return;
  }

  let relPath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  let filePath = path.join(PUBLIC_DIR, relPath);

  // 디렉터리인 경우 index.html
  try {
    const stat = await fs.stat(filePath).catch(() => null);
    if (stat && stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch {}

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.statusCode = 200;
    res.setHeader('Content-Type', mime);
    res.end(data);
    logResponse(200);
  } catch {
    // SPA 라우팅을 위한 fallback (index.html) 또는 정적 파일 404
    if (!path.extname(pathname)) {
      try {
        const indexData = await fs.readFile(path.join(PUBLIC_DIR, 'index.html'));
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(indexData);
        logResponse(200);
        return;
      } catch {}
    }
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('파일을 찾을 수 없어요.');
    logResponse(404);
  }
});

server.listen(PORT, () => {
  console.log(`[개발 서버 실행 중] http://localhost:${PORT}`);
});
