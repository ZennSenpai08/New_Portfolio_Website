import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const script = readFileSync(resolve(root, 'script.js'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'IDs must be unique');
for (const [, target] of html.matchAll(/\bhref="#([^"]+)"/g)) {
  assert(ids.includes(target), `Missing anchor target: ${target}`);
}
for (const [, resource] of html.matchAll(/\b(?:src|href)="([^"#]+)"/g)) {
  if (/^(https?:|mailto:)/.test(resource)) continue;
  assert(existsSync(resolve(root, resource)), `Missing resource: ${resource}`);
}
for (const [link] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
  assert(/rel="[^"]*noopener/.test(link), 'External tabs need noopener');
}
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'One primary heading');
assert(!html.includes('id="cv-download"'), 'CV action must not be a disabled download');
assert(/class="button button-outline" href="mailto:[^"]+subject=CV%20request"/.test(html));
console.log('PASS: unique IDs, anchor targets, local assets, external link safety, heading and CV action');

// Dependency-free behavior checks. These are DOM stubs, not browser layout tests.
class Element {
  listeners = new Map();
  attrs = new Map();
  classes = new Set();
  hidden = true;
  disabled = false;
  textContent = '';
  focused = false;
  classList = {
    add: name => this.classes.add(name),
    remove: name => this.classes.delete(name),
    contains: name => this.classes.has(name),
    toggle: name => {
      if (this.classes.has(name)) { this.classes.delete(name); return false; }
      this.classes.add(name); return true;
    }
  };
  addEventListener(name, listener) {
    this.listeners.set(name, [...(this.listeners.get(name) || []), listener]);
  }
  async fire(name, event = {}) {
    for (const listener of this.listeners.get(name) || []) await listener(event);
  }
  setAttribute(name, value) { this.attrs.set(name, value); }
  getAttribute(name) { return this.attrs.get(name); }
  removeAttribute(name) { this.attrs.delete(name); }
  contains(target) { return target === this; }
  focus() { this.focused = true; }
}

const selectors = ['.menu-toggle', '#main-nav', '#copy-email', '#copy-status', '.email-link', '#year'];
const elements = Object.fromEntries(selectors.map(selector => [selector, new Element()]));
const [menu, nav, copy, feedback, email, year] = selectors.map(selector => elements[selector]);
email.textContent = 'romcillaquino@gmail.com';
const document = new Element();
document.documentElement = new Element();
document.querySelector = selector => elements[selector];
const media = new Element();
const window = { matchMedia: () => media, isSecureContext: true };
let copied;
const navigator = { clipboard: { writeText: async value => { copied = value; } } };
vm.runInNewContext(script, { document, window, navigator, Date });

assert.equal(menu.hidden, false);
assert.equal(copy.hidden, false);
assert.equal(year.textContent, String(new Date().getFullYear()));
await menu.fire('click');
assert.equal(menu.getAttribute('aria-expanded'), 'true');
assert(nav.classList.contains('is-open'));
await document.fire('click', { target: menu });
assert(nav.classList.contains('is-open'), 'The opening click must not immediately close the menu');
await document.fire('keydown', { key: 'Escape' });
assert.equal(menu.getAttribute('aria-expanded'), 'false');
assert(menu.focused, 'Escape should return focus to the menu toggle');
await menu.fire('click');
await nav.fire('click', { target: { closest: () => ({}) } });
assert(!nav.classList.contains('is-open'), 'Selecting a link closes the menu');
await menu.fire('click');
await document.fire('click', { target: new Element() });
assert(!nav.classList.contains('is-open'), 'Outside click closes the menu');
await menu.fire('click');
await media.fire('change');
assert(!nav.classList.contains('is-open'), 'Crossing the breakpoint clears menu state');
console.log('PASS: menu toggle, Escape and focus, link selection, outside click, breakpoint reset, year');

await copy.fire('click');
assert.equal(copied, email.textContent);
assert.equal(feedback.textContent, 'Email copied to clipboard.');
assert.equal(copy.disabled, false);
navigator.clipboard.writeText = async () => { throw new Error('Permission denied'); };
await copy.fire('click');
assert(feedback.textContent.startsWith('Could not copy.'));
assert.equal(copy.disabled, false);
window.isSecureContext = false;
await copy.fire('click');
assert(feedback.textContent.startsWith('Could not copy.'));
assert.equal(copy.disabled, false);
console.log('PASS: clipboard success, denied permission, insecure context, button recovery');

function motionScenario({ reduced = false, observerSupport = true } = {}) {
  const nodes = Object.fromEntries(selectors.map(selector => [selector, new Element()]));
  nodes['#main-nav'].querySelectorAll = () => [];
  const target = new Element();
  const running = [];
  target.animate = (frames, options) => {
    assert.equal(frames.at(-1).opacity, 1);
    assert.equal(frames.at(-1).transform, 'translateY(0)');
    assert(options.duration <= 1000, 'Reveal should be brief');
    const animation = { cancelled: false, cancel() { this.cancelled = true; } };
    running.push(animation);
    return animation;
  };
  const doc = new Element();
  doc.documentElement = new Element();
  doc.querySelector = selector => nodes[selector];
  doc.querySelectorAll = selector => selector === 'main section[id]' ? [] : [target];
  const preference = new Element();
  preference.matches = reduced;
  const observers = [];
  class Observer {
    observed = new Set();
    disconnected = false;
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(element) { this.observed.add(element); }
    unobserve(element) { this.observed.delete(element); }
    disconnect() { this.disconnected = true; this.observed.clear(); }
  }
  const win = {
    matchMedia: query => query.includes('prefers-reduced-motion') ? preference : new Element(),
    isSecureContext: true
  };
  if (observerSupport) win.IntersectionObserver = Observer;
  vm.runInNewContext(script, { document: doc, window: win, navigator: {}, Date, IntersectionObserver: Observer });
  return { target, preference, observers, running };
}

const motion = motionScenario();
const reveal = motion.observers[0];
reveal.callback([{ target: motion.target, isIntersecting: false }]);
assert.equal(motion.running.length, 0, 'Offscreen content does not animate');
reveal.callback([{ target: motion.target, isIntersecting: true }]);
assert.equal(motion.running.length, 1);
assert(!reveal.observed.has(motion.target), 'Reveal target is unobserved after entry');
motion.preference.matches = true;
await motion.preference.fire('change');
assert(reveal.disconnected);
assert(motion.running[0].cancelled, 'Enabling reduced motion stops active reveals');
assert.equal(motionScenario({ reduced: true }).observers.length, 1, 'Reduced motion only creates navigation observer');
assert.equal(motionScenario({ observerSupport: false }).observers.length, 0);
const fallback = motionScenario();
delete fallback.target.animate;
assert.doesNotThrow(() => fallback.observers[0].callback([{ target: fallback.target, isIntersecting: true }]));
console.log('PASS: scroll reveals, one-time observation, live reduced-motion cancellation, unsupported-API fallback');
