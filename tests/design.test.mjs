import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { existsSync, readdirSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { distReal, document, pages, read } from './lib.mjs';

// Everything below observes the real build output only: the emitted HTML and
// every stylesheet it carries, whether Astro linked it or inlined it.
const styles = (out) => {
  const files = readdirSync(out, { recursive: true })
    .filter((f) => f.endsWith('.css'))
    .map((f) => read(out, f));
  const inline = pages(out).flatMap((page) =>
    [...document(out, page).querySelectorAll('style')].map((el) => el.textContent),
  );
  return [...files, ...inline].join('\n');
};

const css = styles(distReal);
const htmlPages = pages(distReal);

/** Bodies of every at-rule whose prelude matches, with braces balanced. */
const atRuleBodies = (source, prelude) => {
  const bodies = [];
  for (const match of source.matchAll(prelude)) {
    const open = source.indexOf('{', match.index);
    let depth = 0;
    let i = open;
    for (; i < source.length; i++) {
      if (source[i] === '{') depth++;
      else if (source[i] === '}' && --depth === 0) break;
    }
    bodies.push(source.slice(open + 1, i));
  }
  return bodies;
};

const DARK = ['#0e1419', '#151c22', '#1c252c', '#e3e7e7', '#9aa4a8', '#829096', '#c46b68'];
const LIGHT = ['#edf0f1', '#f7f8f7', '#e3e7e8', '#20272b', '#59666c', '#606d73', '#954746'];

test('both Hallownest palettes reach the emitted CSS', () => {
  for (const token of [...DARK, ...LIGHT]) {
    assert.ok(css.includes(token), `token ${token} missing from the emitted CSS`);
  }
});

test('the dark palette is bound to the OS preference and to the manual override', () => {
  const byPreference = atRuleBodies(css, /@media\s*\(prefers-color-scheme:\s*dark\)/g).join('\n');
  for (const token of DARK) {
    assert.ok(byPreference.includes(token), `${token} is not applied by OS preference`);
  }
  const override = css.slice(css.indexOf(':root[data-mode=dark]'));
  assert.match(override.slice(0, 400), /--bg:\s*#0e1419/);

  // And the OS-preference block must exclude an explicit light choice, or a
  // reader on a dark OS who chooses light is overruled for ever.
  const guarded = [
    ...css.matchAll(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*([^{]+)\{([^}]*)\}/g),
  ].filter(([, , body]) => body.includes('--bg:'));
  assert.equal(guarded.length, 1, 'expected exactly one OS-preference palette block');
  assert.match(guarded[0][1], /:not\(\[data-mode=/);
});

test('typography is native: no external font, no third-party subresource', () => {
  assert.ok(!/@font-face/i.test(css), 'a webfont is being loaded');
  assert.ok(!/@import/i.test(css), 'the CSS imports another stylesheet');
  assert.ok(!/url\(\s*["']?(https?:)?\/\//i.test(css), 'the CSS fetches a remote asset');
  assert.match(css, /--sans:\s*-apple-system[^;]*sans-serif/);
  assert.match(css, /--mono:[^;]*monospace/);

  for (const page of htmlPages) {
    const doc = document(distReal, page);
    const remote = [...doc.querySelectorAll('link[href], script[src], img[src], iframe[src]')]
      .map((el) => el.getAttribute('href') ?? el.getAttribute('src'))
      .filter((url) => /^(https?:)?\/\//i.test(url));
    assert.deepEqual(remote, [], `${page} requests a third-party subresource`);
  }
});

test('a no-flash theme script is inline in the head of every page', () => {
  for (const page of htmlPages) {
    const scripts = [...document(distReal, page).querySelectorAll('head script')];
    assert.equal(scripts.length, 1, `${page} should carry exactly one head script`);
    const [script] = scripts;
    assert.equal(script.getAttribute('src'), null, 'the theme script must be inline');
    // A module script is deferred, which is exactly the flash it must prevent.
    assert.equal(script.getAttribute('type'), null, 'the theme script must run synchronously');
  }
});

test('an ordinary page ships no JavaScript beyond that script', () => {
  for (const page of ['index.html', 'log/placeholder-entry/index.html']) {
    const scripts = [...document(distReal, page).querySelectorAll('script')];
    assert.equal(scripts.length, 1, `${page} ships extra script tags`);
    assert.equal(scripts[0].getAttribute('src'), null);
  }
  // No client framework or router payload anywhere in the build.
  const bundles = readdirSync(distReal, { recursive: true }).filter((f) => f.endsWith('.js'));
  assert.deepEqual(bundles, [], 'the build emitted a client JavaScript bundle');
});

// Runs the emitted theme script for real, against the emitted page, with the
// browser surfaces it touches stubbed. Still only build output: the script text
// and the toggle both come out of dist.
const runTheme = ({ osDark = false, stored = null, storageThrows = false } = {}) => {
  const { document: doc, Event } = parseHTML(read(distReal, 'index.html'));
  const store = new Map(stored === null ? [] : [['mode', stored]]);
  const guard = () => {
    if (storageThrows) throw new Error('storage unavailable');
  };
  const queries = [];
  const onChange = [];
  const media = {
    matches: osDark,
    addEventListener: (_, listener) => onChange.push(listener),
  };
  const sandbox = {
    document: doc,
    localStorage: {
      getItem(key) {
        guard();
        return store.get(key) ?? null;
      },
      setItem(key, value) {
        guard();
        store.set(key, value);
      },
    },
    matchMedia: (query) => {
      queries.push(query);
      return media;
    },
  };
  // A browser exposes these bare and on `window` alike; so must the harness,
  // or correct code written either way is rejected.
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  // A no-flash script runs while the head is still parsing, when there is no
  // body yet. Hiding it is what makes `document.body.x` fail here exactly as
  // it fails in Chrome, instead of passing against a fully parsed document.
  const body = doc.body;
  let ready = false;
  Object.defineProperty(doc, 'body', { configurable: true, get: () => (ready ? body : null) });

  vm.runInContext(doc.querySelector('head script').textContent, sandbox);
  const root = doc.documentElement;
  const beforeReady = root.dataset.mode ?? null;

  ready = true;
  doc.dispatchEvent(new Event('DOMContentLoaded'));
  const button = doc.querySelector('button.theme-toggle');

  return {
    beforeReady,
    queries,
    js: root.dataset.js,
    // Real clicks land on the glyph inside the button and bubble from there.
    click: () => button.querySelector('svg').dispatchEvent(new Event('click', { bubbles: true })),
    osChange: (dark) => {
      media.matches = dark;
      for (const listener of onChange) listener();
    },
    get applied() {
      return root.dataset.mode ?? null;
    },
    get persisted() {
      return store.get('mode') ?? null;
    },
    get pressed() {
      return button.getAttribute('aria-pressed');
    },
  };
};

test('the theme script resolves, reports and persists the mode in every combination', () => {
  // No stored choice leaves the root unstamped on purpose, so the CSS media
  // query decides; a stored choice is stamped before the page is ready, which
  // is the whole point of an inline script in the head.
  for (const cell of [
    { osDark: true, stored: null, beforeReady: null, pressed: 'true', clicked: 'light' },
    { osDark: false, stored: null, beforeReady: null, pressed: 'false', clicked: 'dark' },
    { osDark: true, stored: 'light', beforeReady: 'light', pressed: 'false', clicked: 'dark' },
    { osDark: false, stored: 'dark', beforeReady: 'dark', pressed: 'true', clicked: 'light' },
  ]) {
    const where = `OS ${cell.osDark ? 'dark' : 'light'}, stored ${cell.stored ?? 'nothing'}`;
    const theme = runTheme(cell);
    assert.equal(theme.beforeReady, cell.beforeReady, `${where}: applied before ready`);
    assert.equal(theme.js, '', `${where}: the toggle stays hidden without data-js`);
    assert.equal(theme.pressed, cell.pressed, `${where}: reported state`);

    theme.click();
    assert.equal(theme.applied, cell.clicked, `${where}: the click must flip the mode`);
    assert.equal(theme.persisted, cell.clicked, `${where}: the choice must survive the visit`);
    assert.equal(theme.pressed, String(cell.clicked === 'dark'), `${where}: state after click`);
  }
});

test('the theme script survives a browser that refuses localStorage', () => {
  const theme = runTheme({ osDark: true, storageThrows: true });
  assert.equal(theme.beforeReady, null);
  theme.click();
  assert.equal(theme.applied, 'light', 'the toggle must still work without storage');
});

test('an OS theme change while reading refreshes the reported state', () => {
  const theme = runTheme({ osDark: false });
  assert.deepEqual(theme.queries, ['(prefers-color-scheme: dark)'], 'wrong media feature watched');
  assert.equal(theme.pressed, 'false');
  theme.osChange(true);
  assert.equal(theme.pressed, 'true', 'aria-pressed goes stale when the OS theme changes');

  // A reader who chose a mode keeps it when the OS flips underneath them.
  const chosen = runTheme({ osDark: false, stored: 'light' });
  chosen.osChange(true);
  assert.equal(chosen.applied, 'light');
  assert.equal(chosen.pressed, 'false');
});

test('prefers-reduced-motion neutralises motes, reveals, smooth scroll and transitions', () => {
  const reduced = atRuleBodies(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/g).join('\n');
  assert.ok(reduced.length > 0, 'no prefers-reduced-motion block was emitted');
  assert.match(reduced, /scroll-behavior:\s*auto/, 'smooth scrolling survives');
  // The universal selector matters: scoping this to one element leaves the nav
  // underline, the toggle hover and the theme fade running.
  assert.match(reduced, /\*[^{}]*\{[^}]*animation:\s*none\s*!important/, 'reveals survive');
  assert.match(reduced, /\*[^{}]*\{[^}]*transition:\s*none\s*!important/, 'transitions survive');
  assert.match(reduced, /\.motes[^{}]*\{[^}]*display:\s*none/, 'the motes survive');
});

test('motion outside the reduced-motion block stays inside the spec envelope', () => {
  // Theme change 350 ms, content reveal 600 ms. Nothing decorative may run
  // longer than 600 ms, in any position of any shorthand.
  assert.match(css, /transition:\s*background\s*\.35s/, 'the 350 ms theme change is missing');
  assert.match(css, /animation:\s*\.6s[^;}]*reveal/, 'the 600 ms content reveal is missing');
  const durations = [];
  for (const [, , value] of css.matchAll(/(?:^|[;{])(transition|animation):([^;}]+)/g)) {
    for (const [, amount, unit] of value.matchAll(/(\d*\.?\d+)(ms|s)\b/g)) {
      durations.push(unit === 'ms' ? Number(amount) / 1000 : Number(amount));
    }
  }
  assert.ok(Math.max(...durations) <= 0.6, `a transition runs ${Math.max(...durations)}s`);
});

test('the content reveal cannot hide content from a reader without JavaScript', () => {
  // The reveal is a CSS animation with a from-keyframe, never a resting
  // opacity:0 that some script has to clear.
  assert.ok(!/main[^{}]*\{[^}]*opacity:\s*0[;}]/.test(css), 'main rests at opacity 0');
  for (const page of htmlPages) {
    assert.ok(document(distReal, page).querySelector('main').textContent.trim().length > 0);
  }
});

test('the theme toggle is a keyboard-operable button with an accessible name', () => {
  for (const page of htmlPages) {
    const button = document(distReal, page).querySelector('button.theme-toggle');
    assert.ok(button, `${page} has no theme toggle`);
    assert.equal(button.getAttribute('type'), 'button');
    assert.ok((button.getAttribute('aria-label') ?? '').trim().length > 0, 'no accessible name');
  }
  assert.match(css, /:focus-visible\{[^}]*outline:/, 'no visible focus style');
});

test('the local SVG favicon is referenced and emitted', () => {
  for (const page of htmlPages) {
    const icon = document(distReal, page).querySelector('link[rel="icon"]');
    assert.equal(icon.getAttribute('href'), '/favicon.svg');
  }
  assert.ok(existsSync(new URL('favicon.svg', distReal)));
});

// This is a rule check, not a layout measurement. It proves the containment
// rules for the surfaces that actually overflow a 390 px viewport are present;
// the viewport itself is spot-checked in a browser, as the spec prescribes.
test('the known horizontal-overflow sources carry containment rules', () => {
  const rule = (selector) => {
    const found = css.match(new RegExp(`(?:^|\\})${selector}\\{([^}]*)\\}`));
    assert.ok(found, `no rule for ${selector}`);
    return found[1];
  };
  for (const selector of ['table', 'pre']) {
    assert.match(rule(selector), /max-width:100%/, `${selector} is unbounded`);
    assert.match(rule(selector), /overflow-x:auto/, `${selector} cannot scroll itself`);
  }
  assert.match(rule('table'), /display:block/, 'a table only scrolls once it is a block');
  // One shared rule: an iframe bounded on its own still overflows beside a
  // <video controls>, so all three must carry max-width together.
  const media = css.match(/(?:^|\})([a-z,]*img[a-z,]*)\{([^}]*)\}/);
  assert.ok(media, 'no media reset rule');
  for (const tag of ['img', 'video', 'iframe']) {
    assert.match(media[1], new RegExp(`\\b${tag}\\b`), `${tag} is unbounded`);
  }
  assert.match(media[2], /max-width:100%/, 'embedded media is unbounded');
  assert.match(css, /overflow-wrap:\s*break-word/, 'long unbroken strings are unbounded');

  // And nothing may simply declare itself wider than the viewport. Media
  // preludes are stripped first so their breakpoints are not read as widths.
  const widest = { px: 390, '%': 100, vw: 100, rem: 390 / 16, em: 390 / 16 };
  const declarations = css.replace(/@[a-z-]+[^{]*(?=\{)/g, '');
  for (const [, kind, amount, unit] of declarations.matchAll(
    /(?:^|[;{])(min-)?width:\s*(\d*\.?\d+)(px|vw|rem|em|%)(?![a-z])/g,
  )) {
    assert.ok(
      Number(amount) <= widest[unit],
      `${kind ?? ''}width: ${amount}${unit} is wider than a 390 px viewport`,
    );
  }
});
