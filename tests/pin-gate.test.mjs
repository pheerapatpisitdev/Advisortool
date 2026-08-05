import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const gateSource = readFileSync(new URL('../assets/pin-gate.js', import.meta.url), 'utf8');
const configSource = readFileSync(new URL('../assets/pin-gate.config.js', import.meta.url), 'utf8');

class ClassList {
  constructor() { this.values = new Set(); }
  add(value) { this.values.add(value); }
  remove(value) { this.values.delete(value); }
  contains(value) { return this.values.has(value); }
  toggle(value, force) {
    if (force === undefined ? !this.contains(value) : force) this.add(value);
    else this.remove(value);
  }
}

class Element {
  constructor(tagName = 'div') {
    this.tagName = tagName;
    this.classList = new ClassList();
    this.listeners = {};
    this.children = [];
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.offsetWidth = 0;
  }
  addEventListener(type, handler) { this.listeners[type] = handler; }
  appendChild(child) { child.parentNode = this; this.children.push(child); }
  removeChild(child) { this.children = this.children.filter((item) => item !== child); child.parentNode = null; }
  setAttribute() {}
  focus() {}
  querySelector(selector) {
    this.queries ||= {};
    if (!this.queries[selector]) this.queries[selector] = new Element(selector);
    return this.queries[selector];
  }
}

function createHarness(fetchImpl, config = {}) {
  const root = new Element('html');
  const body = new Element('body');
  const storage = new Map();
  let overlay;
  const document = {
    body,
    documentElement: root,
    currentScript: { src: 'https://example.test/assets/pin-gate.js' },
    createElement(tagName) {
      const element = new Element(tagName);
      if (tagName === 'div' && !overlay) overlay = element;
      return element;
    },
    addEventListener() {},
    getElementById() { return null; }
  };
  const localStorage = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
  };
  const window = {
    PIN_GATE_CONFIG: {
      supabaseUrl: 'https://project.example.test',
      supabaseAnonKey: 'publishable-test-key',
      supabaseTimeoutMs: 8000,
      ...config
    },
    location: { href: 'https://example.test/' },
    dispatchEvent() {}
  };
  const context = {
    AbortController,
    Event,
    URL,
    document,
    fetch: fetchImpl,
    localStorage,
    location: { pathname: '/ihealthy/' },
    navigator: { userAgent: 'pin-gate-test' },
    setTimeout(handler, delay) {
      if (delay < 1000) queueMicrotask(handler);
      return 1;
    },
    clearTimeout() {},
    window
  };
  vm.runInNewContext(gateSource, context);
  return { root, storage, overlay };
}

async function submitPin(harness, pin = '123456') {
  const form = harness.overlay.querySelector('.az-pin__form');
  const input = harness.overlay.querySelector('.az-pin__input');
  input.value = pin;
  form.listeners.submit({ preventDefault() {} });
  for (let i = 0; i < 12; i++) await Promise.resolve();
}

test('configuration contains no browser-side PIN fallback', () => {
  const forbiddenKey = ['frontend', 'Pin'].join('');
  assert.equal(configSource.includes(forbiddenKey), false);
  assert.equal(gateSource.includes(forbiddenKey), false);
});

test('server approval unlocks and stores the session', async () => {
  const harness = createHarness(async () => ({ ok: true, json: async () => ({ ok: true }) }));
  await submitPin(harness);
  assert.equal(harness.root.classList.contains('az-locked'), false);
  assert.equal(JSON.parse(harness.storage.get('az_gate')).unlocked, true);
});

test('network failure fails closed', async () => {
  const harness = createHarness(async () => { throw new Error('offline'); });
  await submitPin(harness);
  assert.equal(harness.root.classList.contains('az-locked'), true);
  assert.equal(harness.storage.has('az_gate'), false);
  assert.match(harness.overlay.querySelector('.az-pin__msg').textContent, /เชื่อมต่อระบบตรวจสอบไม่ได้/);
});

test('server denial fails closed', async () => {
  const harness = createHarness(async () => ({ ok: true, json: async () => ({ ok: false, locked: false }) }));
  await submitPin(harness);
  assert.equal(harness.root.classList.contains('az-locked'), true);
  assert.equal(harness.storage.has('az_gate'), false);
  assert.match(harness.overlay.querySelector('.az-pin__msg').textContent, /รหัสไม่ถูกต้อง/);
});

test('missing server configuration renders a locked configuration error', () => {
  const harness = createHarness(async () => { throw new Error('must not be called'); }, {
    supabaseUrl: '',
    supabaseAnonKey: ''
  });
  assert.equal(harness.root.classList.contains('az-locked'), true);
  assert.equal(harness.storage.has('az_gate'), false);
  assert.match(harness.overlay.innerHTML, /ตั้งค่าระบบตรวจสอบไม่ถูกต้อง/);
});
