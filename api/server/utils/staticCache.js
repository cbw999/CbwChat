const path = require('path');
const expressStaticGzip = require('express-static-gzip');

const oneDayInSeconds = 24 * 60 * 60;

const sMaxAge = process.env.STATIC_CACHE_S_MAX_AGE || oneDayInSeconds;
const maxAge = process.env.STATIC_CACHE_MAX_AGE || oneDayInSeconds * 2;

/**
 * Creates an Express static middleware with gzip compression and configurable caching
 * Express.js 서버에서 정적 파일(static files) 을 Gzip 압축과 함께 효율적으로 서빙하고,
 * 파일 유형에 따라 캐시 정책을 유연하게 설정하기 위한 커스텀 미들웨어 생성 함수입니다.
 *
 * @param {string} staticPath - The file system path to serve static files from
 * @param {Object} [options={}] - Configuration options
 * @param {boolean} [options.noCache=false] - If true, disables caching entirely for all files
 * @returns {ReturnType<expressStaticGzip>} Express middleware function for serving static files
 */
function staticCache(staticPath, options = {}) {
  const { noCache = false } = options;
  return expressStaticGzip(staticPath, {
    enableBrotli: false,
    orderPreference: ['gz'],
    setHeaders: (res, filePath) => {
      if (process.env.NODE_ENV?.toLowerCase() !== 'production') {
        return;
      }
      if (noCache) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        return;
      }
      if (filePath.includes('/dist/images/')) {
        return;
      }
      const fileName = path.basename(filePath);

      if (
        fileName === 'index.html' ||
        fileName.endsWith('.webmanifest') ||
        fileName === 'manifest.json' ||
        fileName === 'sw.js'
      ) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      } else {
        res.setHeader('Cache-Control', `public, max-age=${maxAge}, s-maxage=${sMaxAge}`);
      }
    },
    index: false,
  });
}

module.exports = staticCache;
