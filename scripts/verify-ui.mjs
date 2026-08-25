#!/usr/bin/env node
/**
 * UI verification harness — renders the exported web bundle in headless
 * Chrome (via the raw DevTools Protocol; zero npm dependencies) and asserts
 * that the NativeWind stylesheet is actually *applied*: theme backgrounds,
 * Sora typography, flex layout, card radii, and the absence of runtime
 * errors — in both light and dark schemes. Captures per-route screenshots.
 *
 * This exists because a styling regression once shipped to production
 * unnoticed: the app rendered as unstyled text while every build stayed
 * "green". Never skip this check before deploying.
 *
 * Usage:
 *   node scripts/verify-ui.mjs                       # serve ./dist and verify
 *   node scripts/verify-ui.mjs --dist ./dist --out ./artifacts/ui
 *   node scripts/verify-ui.mjs --url https://naptie.github.io \
 *        --routes '/nearcade-app/,/nearcade-app/rankings.html'
 *
 * Requires Node >= 21 (built-in WebSocket) and Chrome/Chromium on PATH
 * (or CHROME_PATH).
 */

import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync } from 'node:fs';

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

function parseArgs(argv) {
  const opts = {
    dist: 'dist',
    out: 'artifacts/ui',
    url: null,
    base: '/nearcade-app',
    routes: null,
    timeoutMs: 90_000,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dist') opts.dist = argv[++i];
    else if (a === '--out') opts.out = argv[++i];
    else if (a === '--url') opts.url = argv[++i];
    else if (a === '--base') opts.base = argv[++i];
    else if (a === '--routes') opts.routes = argv[++i];
    else if (a === '--timeout') opts.timeoutMs = Number(argv[++i]);
    else if (a === '--help') usage();
  }
  if (opts.routes) opts.routes = opts.routes.split(',').map((r) => r.trim()).filter(Boolean);
  return opts;
}

function usage() {
  console.error('See header of scripts/verify-ui.mjs for usage.');
  process.exit(2);
}

const opts = parseArgs(process.argv);

/* ------------------------------------------------------------------ */
/* Expectations (calibrated against the daisyUI emerald/forest tokens) */
/* ------------------------------------------------------------------ */

const ROUTES = opts.routes ?? [
  opts.base + '/',
  opts.base + '/rankings',
  opts.base + '/community',
  opts.base + '/me',
];

const SCHEMES = {
  light: { bg: 'rgb(255, 255, 255)' },
  dark: { bg: 'rgb(27, 23, 23)' },
};

const PROBE = `
(function() {
  const all = (sel) => Array.from(document.querySelectorAll(sel));
  const screen = all('div').find((e) => /(^|\\s)bg-base-100(\\s|$)/.test(e.className || ''));
  const card = all('div').find((e) => /bg-base-200\\/60/.test(e.className || ''));
  const sora = all('span,div').some(
    (e) => e.childElementCount === 0 && /Sora/.test(getComputedStyle(e).fontFamily)
  );
  const flexRow = all('div').some((e) => {
    const c = (e.className || '').toString();
    return /flex-row/.test(c) && getComputedStyle(e).display === 'flex' &&
      getComputedStyle(e).flexDirection === 'row';
  });
  const pill = all('div,button').some((e) => {
    const r = parseFloat(getComputedStyle(e).borderRadius);
    return Number.isFinite(r) && r >= 100;
  });
  return JSON.stringify({
    mounted: Boolean(screen),
    screenBg: screen ? getComputedStyle(screen).backgroundColor : null,
    cardRadius: card ? getComputedStyle(card).borderRadius : null,
    sora,
    flexRow,
    pill,
    textLen: document.body.innerText.length,
    errors: (window.__errors || []).slice(0, 5),
  });
})()
`;

/* ------------------------------------------------------------------ */
/* Static server (serves dist under the app's baseUrl)                 */
/* ------------------------------------------------------------------ */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.json': 'application/json',
};

const ERROR_TRAP = `<script>(function(){window.__errors=[];window.addEventListener('error',function(e){if(e&&e.message)window.__errors.push(String(e.message)+' @ '+(e.filename||'')+':'+e.lineno)});window.addEventListener('unhandledrejection',function(e){window.__errors.push('rejection: '+String((e.reason&&(e.reason.stack||e.reason))||e.reason))});})()</script>`;

async function startServer() {
  const root = normalize(opts.dist);
  const server = createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (path === opts.base || path === opts.base + '/') path = opts.base + '/index.html';
      if (!path.startsWith(opts.base + '/')) {
        res.writeHead(302, { Location: opts.base + '/' });
        return res.end();
      }
      const rel = path.slice(opts.base.length + 1).split('?')[0];
      const file = normalize(join(root, rel));
      if (!file.startsWith(root)) throw new Error('traversal');
      if (file.endsWith('.html') && existsSync(file)) {
        const html = await readFile(file, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(html.replace('<head>', '<head>' + ERROR_TRAP));
      }
      const data = await readFile(existsSync(file) ? file : join(root, 'index.html'), 'utf8');
      res.writeHead(200, {
        'Content-Type': existsSync(file) && !file.endsWith('.html')
          ? MIME[extname(file)] ?? 'application/octet-stream'
          : 'text/html; charset=utf-8',
      });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  return { close: () => new Promise((r) => server.close(r)), origin: `http://127.0.0.1:${port}` };
}

/* ------------------------------------------------------------------ */
/* Chrome + minimal CDP client                                         */
/* ------------------------------------------------------------------ */

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      execFileSync(c, ['--version'], { stdio: 'pipe' });
      return c;
    } catch {
      /* try next */
    }
  }
  console.error('No Chrome/Chromium found. Install one or set CHROME_PATH.');
  process.exit(2);
}

async function launchChrome() {
  const chrome = findChrome();
  const userDataDir = mkdtempSync(join(tmpdir(), 'ui-verify-'));
  const args = [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${userDataDir}`,
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--hide-scrollbars',
    'about:blank',
  ];
  const child = spawn(chrome, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => reject(new Error('Chrome did not expose a DevTools socket')), 20_000);
    const onData = (d) => {
      buf += d.toString();
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) {
        clearTimeout(timer);
        child.stderr.off('data', onData);
        resolve(m[1]);
      }
    };
    child.stderr.on('data', onData);
    child.on('exit', () => reject(new Error('Chrome exited immediately')));
  });
  return { child, wsUrl, userDataDir };
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.listeners = [];
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message}: ${msg.error.data ?? ''}`));
        else resolve(msg.result);
      } else if (msg.method) {
        for (const l of this.listeners) l(msg);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, 30_000);
    });
  }
  on(fn) {
    this.listeners.push(fn);
  }
}

function waitForEvent(cdp, method, sessionId, timeoutMs = 20_000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cdp.listeners = cdp.listeners.filter((l) => l !== listener);
      reject(new Error(`Event timeout: ${method}`));
    }, timeoutMs);
    const listener = (msg) => {
      if (msg.method === method && (!sessionId || msg.sessionId === sessionId)) {
        clearTimeout(timer);
        cdp.listeners = cdp.listeners.filter((l) => l !== listener);
        resolve(msg.params);
      }
    };
    cdp.on(listener);
  });
}

async function evaluate(cdp, sessionId, expression) {
  const res = await cdp.send(
    'Runtime.evaluate',
    { expression, returnByValue: true, awaitPromise: true },
    sessionId
  );
  if (res.exceptionDetails) {
    throw new Error(`Probe failed: ${res.exceptionDetails.exception?.description ?? 'unknown'}`);
  }
  return res.result.value;
}

async function waitReady(cdp, sessionId) {
  await evaluate(
    cdp,
    sessionId,
    `(async () => {
      const t0 = Date.now();
      while (Date.now() - t0 < 25000) {
        const r = document.getElementById('root');
        if (document.readyState === 'complete' && r && r.children.length > 0) return 'ready';
        await new Promise((s) => setTimeout(s, 200));
      }
      return 'timeout';
    })()`
  );
  await new Promise((r) => setTimeout(r, 1500)); // let queries/fonts settle
}

async function screenshot(cdp, sessionId, file) {
  const res = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 60 }, sessionId);
  await writeFile(file, Buffer.from(res.data, 'base64'));
}

/* ------------------------------------------------------------------ */
/* Assertions                                                          */
/* ------------------------------------------------------------------ */

const failures = [];
const report = { startedAt: new Date().toISOString(), url: null, checks: [], screenshots: [] };

function check(name, ok, detail) {
  report.checks.push({ name, ok, detail });
  if (!ok) failures.push(`${name} — ${detail}`);
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${ok ? '' : ` (${detail})`}`);
}

async function verifyRoute(cdp, sessionId, url, scheme, label, outDir) {
  process.stdout.write(`• ${label} [${scheme}]\n`);
  const raw = await evaluate(cdp, sessionId, PROBE);
  const r = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const expectBg = SCHEMES[scheme].bg;

  check(`${label}: app mounts`, r.mounted, 'no bg-base-100 screen found — stylesheet not applied?');
  check(`${label}: theme background`, r.screenBg === expectBg, `expected ${expectBg}, got ${r.screenBg}`);
  check(`${label}: Sora font applied`, r.sora, 'no text element resolves to a Sora family');
  check(`${label}: flex-row layout computed`, r.flexRow, 'flex-row class has no computed flex layout');
  check(`${label}: pill radii present`, r.pill, 'no element with border-radius ≥ 100px');
  check(`${label}: page has content`, r.textLen > 50, `body text length ${r.textLen}`);
  // Card radius depends on API data arriving (shop/university lists); only
  // assert it when a card is actually present to avoid network-timing flakiness.
  if (r.cardRadius != null) {
    check(`${label}: card radius 16px`, r.cardRadius === '16px', `got ${r.cardRadius}`);
  } else {
    console.log(`  · ${label}: no cards rendered (empty data) — skipping radius assert`);
  }
  // Environment noise (blocked external hosts) can surface as network-only
  // unhandled rejections; real JS crashes still fail the check.
  const realErrors = (r.errors ?? []).filter(
    (e) => !/NetworkError|Failed to fetch|TypeError: Failed to fetch|net::/i.test(e)
  );
  check(`${label}: no runtime errors`, realErrors.length === 0, realErrors.join(' | ') || '');

  const shot = join(outDir, `${label.replace(/[^\w-]+/g, '_')}-${scheme}.jpg`);
  await screenshot(cdp, sessionId, shot);
  report.screenshots.push(shot);
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  await rm(opts.out, { recursive: true, force: true });
  await mkdir(opts.out, { recursive: true });

  let server = null;
  let origin;
  if (opts.url) {
    origin = opts.url.replace(/\/+$/, '');
    report.url = origin + ROUTES[0];
  } else {
    if (!existsSync(join(opts.dist, 'index.html'))) {
      console.error(`No export found at ${opts.dist}/. Run: npx expo export --platform web`);
      process.exit(2);
    }
    server = await startServer();
    origin = server.origin;
    report.url = origin + ROUTES[0];
  }

  console.log(`Verifying UI at ${report.url}\n`);
  const { child, wsUrl, userDataDir } = await launchChrome();
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', () => reject(new Error('WebSocket to Chrome failed')));
  });
  const cdp = new CDP(ws);

  try {
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
    }, sessionId);
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `window.__errors=[];window.addEventListener('error',function(e){if(e&&e.message)window.__errors.push(String(e.message)+' @ '+(e.filename||'')+':'+e.lineno)});window.addEventListener('unhandledrejection',function(e){window.__errors.push('rejection: '+String((e.reason&&(e.reason.stack||e.reason))||e.reason))});`,
    }, sessionId);

    // Light pass — every route.
    for (const route of ROUTES) {
      const label = route.split('/').pop() || 'index';
      const load = waitForEvent(cdp, 'Page.loadEventFired', sessionId);
      await cdp.send('Page.navigate', { url: origin + route }, sessionId);
      await load;
      await waitReady(cdp, sessionId);
      await verifyRoute(cdp, sessionId, origin + route, 'light', label || 'index', opts.out);
    }

    // Dark pass — first route, via prefers-color-scheme emulation.
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: 'dark' }],
    }, sessionId);
    {
      const label = (ROUTES[0].split('/').pop() || 'index');
      const load = waitForEvent(cdp, 'Page.loadEventFired', sessionId);
      await cdp.send('Page.reload', {}, sessionId);
      await load;
      await waitReady(cdp, sessionId);
      await verifyRoute(cdp, sessionId, origin + ROUTES[0], 'dark', label, opts.out);
    }
  } finally {
    try { await cdp.send('Browser.close'); } catch { /* already gone */ }
    child.kill('SIGKILL');
    if (server) await server.close();
    await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
  }

  report.finishedAt = new Date().toISOString();
  report.failures = failures;
  await writeFile(join(opts.out, 'report.json'), JSON.stringify(report, null, 2));

  if (failures.length > 0) {
    console.error(`\nUI VERIFICATION FAILED — ${failures.length} problem(s):`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    console.error(`Report + screenshots: ${opts.out}/`);
    process.exit(1);
  }
  console.log(`\nUI VERIFICATION PASSED — ${report.checks.length} checks, ${report.screenshots.length} screenshots (${opts.out}/)`);
}

const timer = setTimeout(() => {
  console.error('UI verification timed out.');
  process.exit(3);
}, opts.timeoutMs);
timer.unref();

main().catch((err) => {
  console.error('UI verification crashed:', err);
  process.exit(1);
});
