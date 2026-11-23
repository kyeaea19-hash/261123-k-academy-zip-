// 첨부 허용 확장자 및 파일 형식 분석 모듈

const ALLOWED_EXTS = {
  // 이미지
  png: { mime: 'image/png', openMode: 'tab', isImage: true },
  jpg: { mime: 'image/jpeg', openMode: 'tab', isImage: true },
  jpeg: { mime: 'image/jpeg', openMode: 'tab', isImage: true },
  gif: { mime: 'image/gif', openMode: 'tab', isImage: true },
  webp: { mime: 'image/webp', openMode: 'tab', isImage: true },
  // PDF
  pdf: { mime: 'application/pdf', openMode: 'tab', isImage: false },
  // 텍스트
  txt: { mime: 'text/plain', openMode: 'tab', isImage: false },
  // 문서
  docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', openMode: 'download', isImage: false },
  xlsx: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', openMode: 'download', isImage: false },
  pptx: { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', openMode: 'download', isImage: false },
  hwp: { mime: 'application/octet-stream', openMode: 'download', isImage: false },
  hwpx: { mime: 'application/octet-stream', openMode: 'download', isImage: false },
  // 데이터 / 코드
  csv: { mime: 'text/csv', openMode: 'download', isImage: false },
  md: { mime: 'text/markdown', openMode: 'download', isImage: false },
  json: { mime: 'application/json', openMode: 'download', isImage: false },
  py: { mime: 'text/x-python', openMode: 'download', isImage: false },
  ipynb: { mime: 'application/json', openMode: 'download', isImage: false },
  // 압축
  zip: { mime: 'application/zip', openMode: 'download', isImage: false }
};

export const ACCEPT_ATTR = Object.keys(ALLOWED_EXTS).map(ext => `.${ext}`).join(',');

// 파일명으로부터 형식 정보 조회
export function getFileTypeInfo(fileName) {
  if (typeof fileName !== 'string') {
    return { allowed: false, ext: '', mime: '', openMode: 'download', isImage: false };
  }
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1 || lastDot === fileName.length - 1) {
    return { allowed: false, ext: '', mime: '', openMode: 'download', isImage: false };
  }
  const ext = fileName.slice(lastDot + 1).toLowerCase();
  const info = ALLOWED_EXTS[ext];

  if (!info) {
    return { allowed: false, ext, mime: '', openMode: 'download', isImage: false };
  }

  return {
    allowed: true,
    ext,
    mime: info.mime,
    openMode: info.openMode,
    isImage: info.isImage
  };
}
