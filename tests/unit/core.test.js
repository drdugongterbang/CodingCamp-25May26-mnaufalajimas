/**
 * Unit tests for Task 2 — state, persistence helpers, and core pure functions.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateTransaction,
  getCategoryTotals,
  getSortedTransactions,
  generateId,
  saveTransactions,
  loadTransactions,
  saveTheme,
  loadTheme,
  saveSpendingLimit,
  loadSpendingLimit,
} from '../../js/app.js';

// ---------------------------------------------------------------------------
// generateId
// ---------------------------------------------------------------------------
describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string');
    expect(generateId().length).toBeGreaterThan(0);
  });

  it('returns unique values on successive calls', () => {
    const ids = new Set(Array.from({ length: 20 }, generateId));
    expect(ids.size).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// validateTransaction
// ---------------------------------------------------------------------------
describe('validateTransaction', () => {
  it('returns empty array for valid inputs', () => {
    expect(validateTransaction('Coffee', '4.50')).toEqual([]);
    expect(validateTransaction('Bus ticket', 2)).toEqual([]);
  });

  it('returns error for empty name', () => {
    const errors = validateTransaction('', '5');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => /name/i.test(e))).toBe(true);
  });

  it('returns error for whitespace-only name', () => {
    const errors = validateTransaction('   ', '5');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns error for missing amount', () => {
    const errors = validateTransaction('Coffee', '');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => /amount/i.test(e))).toBe(true);
  });

  it('returns error for zero amount', () => {
    const errors = validateTransaction('Coffee', '0');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns error for negative amount', () => {
    const errors = validateTransaction('Coffee', '-3');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns error for non-numeric amount string', () => {
    const errors = validateTransaction('Coffee', 'abc');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns errors for both empty name and empty amount', () => {
    const errors = validateTransaction('', '');
    expect(errors.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// getCategoryTotals
// ---------------------------------------------------------------------------
describe('getCategoryTotals', () => {
  it('returns empty object for empty array', () => {
    expect(getCategoryTotals([])).toEqual({});
  });

  it('returns correct total for a single transaction', () => {
    const txns = [{ id: '1', name: 'Lunch', amount: 12.5, category: 'Food' }];
    expect(getCategoryTotals(txns)).toEqual({ Food: 12.5 });
  });

  it('sums amounts within the same category', () => {
    const txns = [
      { id: '1', name: 'Lunch', amount: 10, category: 'Food' },
      { id: '2', name: 'Dinner', amount: 20, category: 'Food' },
    ];
    expect(getCategoryTotals(txns)).toEqual({ Food: 30 });
  });

  it('handles multiple categories independently', () => {
    const txns = [
      { id: '1', name: 'Lunch', amount: 10, category: 'Food' },
      { id: '2', name: 'Bus', amount: 5, category: 'Transport' },
      { id: '3', name: 'Movie', amount: 15, category: 'Fun' },
    ];
    expect(getCategoryTotals(txns)).toEqual({ Food: 10, Transport: 5, Fun: 15 });
  });
});

// ---------------------------------------------------------------------------
// getSortedTransactions
// ---------------------------------------------------------------------------
describe('getSortedTransactions', () => {
  const txns = [
    { id: '1', name: 'C', amount: 30, category: 'Transport' },
    { id: '2', name: 'A', amount: 10, category: 'Fun' },
    { id: '3', name: 'B', amount: 20, category: 'Food' },
  ];

  it("returns a copy in insertion order for 'none'", () => {
    const result = getSortedTransactions(txns, 'none');
    expect(result.map(t => t.id)).toEqual(['1', '2', '3']);
  });

  it("sorts ascending by amount for 'amount-asc'", () => {
    const result = getSortedTransactions(txns, 'amount-asc');
    expect(result.map(t => t.amount)).toEqual([10, 20, 30]);
  });

  it("sorts descending by amount for 'amount-desc'", () => {
    const result = getSortedTransactions(txns, 'amount-desc');
    expect(result.map(t => t.amount)).toEqual([30, 20, 10]);
  });

  it("sorts alphabetically by category for 'category-asc'", () => {
    const result = getSortedTransactions(txns, 'category-asc');
    expect(result.map(t => t.category)).toEqual(['Food', 'Fun', 'Transport']);
  });

  it('does not mutate the original array', () => {
    const original = [...txns];
    getSortedTransactions(txns, 'amount-asc');
    expect(txns).toEqual(original);
  });

  it('handles an empty array', () => {
    expect(getSortedTransactions([], 'amount-asc')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Persistence helpers (using vi.stubGlobal to mock localStorage)
// ---------------------------------------------------------------------------
describe('persistence helpers', () => {
  let store = {};

  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: (key) => (key in store ? store[key] : null),
      setItem: (key, value) => { store[key] = String(value); },
      removeItem: (key) => { delete store[key]; },
    });
  });

  // saveTransactions / loadTransactions
  it('saveTransactions + loadTransactions round-trip preserves all fields', () => {
    const txns = [
      { id: 'abc', name: 'Coffee', amount: 3.5, category: 'Food' },
      { id: 'def', name: 'Bus', amount: 2, category: 'Transport' },
    ];
    saveTransactions(txns);
    expect(loadTransactions()).toEqual(txns);
  });

  it('loadTransactions returns [] when nothing is stored', () => {
    expect(loadTransactions()).toEqual([]);
  });

  it('saveTransactions propagates a thrown error', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => { throw new DOMException('QuotaExceededError'); },
      getItem: () => null,
      removeItem: () => {},
    });
    expect(() => saveTransactions([{ id: '1', name: 'x', amount: 1, category: 'Food' }])).toThrow();
  });

  it('loadTransactions returns [] when JSON is malformed', () => {
    store['ebv_transactions'] = 'not-json{{{';
    expect(loadTransactions()).toEqual([]);
  });

  // saveTheme / loadTheme
  it('saveTheme + loadTheme round-trip returns the saved theme', () => {
    saveTheme('dark');
    expect(loadTheme()).toBe('dark');
  });

  it("loadTheme returns 'light' when nothing is stored", () => {
    expect(loadTheme()).toBe('light');
  });

  // saveSpendingLimit / loadSpendingLimit
  it('saveSpendingLimit + loadSpendingLimit round-trip returns the saved number', () => {
    saveSpendingLimit(150.75);
    expect(loadSpendingLimit()).toBeCloseTo(150.75);
  });

  it('loadSpendingLimit returns null when nothing is stored', () => {
    expect(loadSpendingLimit()).toBeNull();
  });

  it('saveSpendingLimit(null) removes the key so loadSpendingLimit returns null', () => {
    saveSpendingLimit(100);
    saveSpendingLimit(null);
    expect(loadSpendingLimit()).toBeNull();
  });
});
