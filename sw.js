/**
 * 교무실ON 서비스워커 (앱 설치용)
 * - 화면 틀(index.html, app.js, style.css, 아이콘)만 다룹니다. 학교 자료(구글)는 절대 저장하지 않습니다.
 * - 항상 인터넷에서 최신 파일을 먼저 받고(network-first), 인터넷이 끊겼을 때만 저장본을 씁니다.
 *   → GitHub에 index.html·app.js·style.css를 새로 올리면 다음에 열 때 바로 반영됩니다.
 * - 파일을 고칠 때마다 아래 VERSION을 바꾸면 예전 저장본이 정리됩니다.
 */
const VERSION = '20261004d';
const CACHE = 'gyomusilon-shell-' + VERSION;
const SHELL = ['./', './index.html', './app.js?v=' + VERSION, './style.css?v=' + VERSION, './manifest.json', './icon-192.png', './icon-512.png', './favicon-32.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('gyomusilon-shell-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 구글·글꼴 등 다른 사이트 요청은 건드리지 않음

  event.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
      )
  );
});
