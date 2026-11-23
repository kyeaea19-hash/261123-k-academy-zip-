import crypto from 'node:crypto';

// JSON 응답 전송
export function sendJson(res, status, obj) {
  const json = JSON.stringify(obj);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(json);
}

// 에러 응답 전송
export function sendError(res, status, code, message) {
  sendJson(res, status, { error: { code, message } });
}

// 허용 HTTP 메서드 검사
export function allowMethods(req, res, methods) {
  if (!methods.includes(req.method)) {
    res.setHeader('Allow', methods.join(', '));
    sendError(res, 405, 'METHOD_NOT_ALLOWED', '지원하지 않는 메서드예요.');
    return false;
  }
  return true;
}

// 요청 JSON 본문 읽기 (최대 100KB)
export async function readJson(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      throw { status: 400, code: 'INVALID_INPUT', message: '올바른 JSON 형식이 아니에요.' };
    }
  }

  return new Promise((resolve, reject) => {
    let body = '';
    let bytes = 0;
    const maxBytes = 102400; // 100KB

    let tooLarge = false;
    req.on('data', chunk => {
      if (tooLarge) return; // 넘친 뒤에는 나머지를 읽고 버린다 (연결을 끊으면 413 응답이 전달되지 않음)
      bytes += chunk.length;
      if (bytes > maxBytes) {
        tooLarge = true;
        body = '';
        reject({ status: 413, code: 'INVALID_INPUT', message: '요청 내용이 100KB를 넘어요.' });
        return;
      }
      body += chunk;
    });

    req.on('end', () => {
      if (tooLarge) return;
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject({ status: 400, code: 'INVALID_INPUT', message: '올바른 JSON 형식이 아니에요.' });
      }
    });

    req.on('error', err => {
      reject({ status: 400, code: 'INVALID_INPUT', message: err.message });
    });
  });
}

// AI 접근 코드 검증 (timing-safe 비교)
export function checkAccess(req) {
  const serverCode = process.env.ACCESS_CODE;
  if (!serverCode || serverCode.trim() === '') {
    return true;
  }
  const clientCode = req.headers['x-access-code'] || '';
  if (!clientCode) {
    return false;
  }
  const hash1 = crypto.createHash('sha256').update(serverCode).digest();
  const hash2 = crypto.createHash('sha256').update(String(clientCode)).digest();
  return crypto.timingSafeEqual(hash1, hash2);
}
