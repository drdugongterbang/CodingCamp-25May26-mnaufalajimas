# Design Document: Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a single-page web application built with plain HTML, CSS, and Vanilla JavaScript. It allows users to record spending transactions, view a running balance, visualize spending by category via a pie chart, sort transactions, set per-category spending limits, and toggle between dark and light display modes. All data is persisted in the browser's LocalStorage. No frameworks, build tools, or backend are required.

The app is delivered as three files:
- `index.html` — markup and structure
- `css/style.css` — all styling, including responsive layout and theme variables
- `js/app.js` — all application logic

---

## Architecture

The application follows a simple **data-driven rendering** pattern:

1. **State** — a single in-memory `state` object holds all transactions, the current sort order, the spending limit, and the active theme.
2. **Mutations** — functions that modify state (add transaction, delete transaction, set sort, set limit, toggle theme).
3. **Render** — a `render()` function (and targeted sub-renders) reads state and updates the DOM. Called after every mutation.
4. **Persistence** — after every mutation, the relevant slice of state is written to LocalStorage. On page load, state is hydrated from LocalStorage.

```
User Action
    │
    ▼
Mutation Function  ──►  LocalStorage (write)
    │
    ▼
render()
    │
    ├──► renderBalance()
    ├──► renderTransactionList()
    └──► renderChart()
```

This keeps the data flow unidirectional and easy to reason about without a framework.

---

## Components and Interfaces

### State Object

```js
const state = {
  transactions: [],   // Array<Transaction>
  sortOrder: 'none',  // 'none' | 'amount-asc' | 'amount-desc' | 'category-asc'
  spendingLimit: null, // number | null
  theme: 'light'      // 'light' | 'dark'
};
```

### Transaction Object

```js
{
  id: string,        // crypto.randomUUID() or Date.now().toString()
  name: string,      // item name
  amount: number,    // positive number
  category: string   // 'Food' | 'Transport' | 'Fun'
}
```

### Input Form (`#transaction-form`)

- Fields: `#input-name` (text), `#input-amount` (number), `#input-category` (select)
- Submit button: `#btn-add`
- Error container: `#form-error` (inline, per-field or general)
- On submit: calls `addTransaction(name, amount, category)`

### Transaction List (`#transaction-list`)

- Rendered as a `<ul>` with one `<li>` per transaction
- Each `<li>` shows: name, formatted amount, category badge, delete button
- Categories exceeding the spending limit receive a CSS class `over-limit`
- Empty state: a `<p id="empty-message">` shown when list is empty

### Balance Display (`#total-balance`)

- A `<span>` or `<p>` at the top of the page
- Updated by `renderBalance()`

### Sort Control (`#sort-select`)

- A `<select>` with options: Default, Amount ↑, Amount ↓, Category A–Z
- On change: calls `setSortOrder(value)` then `render()`

### Spending Limit Input (`#spending-limit-input`)

- A numeric `<input>` with a "Set" button (`#btn-set-limit`)
- On click: calls `setSpendingLimit(value)` then `render()`

### Pie Chart (`#chart-canvas`)

- A `<canvas>` element rendered by Chart.js
- Managed by `renderChart()`
- Destroyed and re-created on each render to avoid Chart.js instance conflicts
- Empty state: canvas hidden, `#chart-empty` placeholder shown

### Theme Toggle (`#btn-theme-toggle`)

- A `<button>` (or checkbox) that calls `toggleTheme()`
- Theme applied via a `data-theme` attribute on `<html>` or `<body>`

---

## Data Models

### LocalStorage Keys

| Key | Value | Description |
|-----|-------|-------------|
| `ebv_transactions` | JSON string of `Transaction[]` | All saved transactions |
| `ebv_theme` | `'light'` or `'dark'` | Saved display mode |
| `ebv_spending_limit` | Number as string, or absent | Saved spending limit |

### Persistence Functions

```js
function saveTransactions(transactions) {
  localStorage.setItem('ebv_transactions', JSON.stringify(transactions));
}

function loadTransactions() {
  const raw = localStorage.getItem('ebv_transactions');
  return raw ? JSON.parse(raw) : [];
}

function saveTheme(theme) {
  localStorage.setItem('ebv_theme', theme);
}

function loadTheme() {
  return localStorage.getItem('ebv_theme') || 'light';
}

function saveSpendingLimit(limit) {
  if (limit === null) {
    localStorage.removeItem('ebv_spending_limit');
  } else {
    localStorage.setItem('ebv_spending_limit', String(limit));
  }
}

function loadSpendingLimit() {
  const raw = localStorage.getItem('ebv_spending_limit');
  return raw !== null ? parseFloat(raw) : null;
}
```

### Validation Logic

```js
function validateTransaction(name, amount) {
  const errors = [];
  if (!name || name.trim() === '') errors.push('Item name is required.');
  if (!amount || amount.trim() === '') errors.push('Amount is required.');
  else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)
    errors.push('Amount must be a positive number.');
  return errors; // empty array = valid
}
```

### Category Spending Aggregation

```js
function getCategoryTotals(transactions) {
  return transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
}
```

### Sort Logic

```js
function getSortedTransactions(transactions, sortOrder) {
  const copy = [...transactions];
  if (sortOrder === 'amount-asc') return copy.sort((a, b) => a.amount - b.amount);
  if (sortOrder === 'amount-desc') return copy.sort((a, b) => b.amount - a.amount);
  if (sortOrder === 'category-asc') return copy.sort((a, b) => a.category.localeCompare(b.category));
  return copy; // 'none' — insertion order
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Transaction addition grows the list

*For any* transaction list and any valid transaction (non-empty name, positive amount, valid category), adding the transaction to the list should result in the list length increasing by exactly one.

**Validates: Requirements 1.2**

---

### Property 2: Whitespace and invalid amounts are rejected

*For any* input where the name is empty or composed entirely of whitespace, or the amount is not a positive number, the Validator should return a non-empty errors array and the transaction list should remain unchanged.

**Validates: Requirements 1.3, 1.4**

---

### Property 3: Balance equals sum of all transaction amounts

*For any* collection of transactions, the computed balance should equal the arithmetic sum of all transaction amounts.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

---

### Property 4: Category totals partition the balance

*For any* collection of transactions, the sum of all per-category totals returned by `getCategoryTotals` should equal the total balance.

**Validates: Requirements 4.1, 4.2, 4.3**

---

### Property 5: Transaction persistence round-trip

*For any* array of transactions, serializing to JSON and deserializing should produce an array of transactions that is deeply equal to the original.

**Validates: Requirements 5.1, 5.3**

---

### Property 6: Sort order correctness

*For any* collection of transactions sorted by amount ascending, each consecutive pair of transactions should satisfy `a.amount <= b.amount`. For amount descending, `a.amount >= b.amount`. For category alphabetical, `a.category <= b.category`.

**Validates: Requirements 6.1, 6.2, 6.3**

---

### Property 7: Spending limit highlight consistency

*For any* collection of transactions and any spending limit value, a category should be flagged as over-limit if and only if its total spending strictly exceeds the limit.

**Validates: Requirements 7.2, 7.3**

---

### Property 8: Deletion removes exactly one transaction

*For any* transaction list containing a transaction with a given id, deleting by that id should produce a list that does not contain that id and has length exactly one less than the original.

**Validates: Requirements 2.3, 3.3**

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Empty name field on submit | Inline error shown; form not submitted |
| Empty amount field on submit | Inline error shown; form not submitted |
| Non-positive or non-numeric amount | Inline error shown; form not submitted |
| LocalStorage write failure (quota, private mode) | Transaction not added; error message shown to user |
| LocalStorage read failure on load | Gracefully default to empty state; no crash |
| Chart.js not loaded (CDN failure) | Chart section hidden; rest of app functional |
| All transactions deleted | Balance shows 0; list shows empty placeholder; chart shows placeholder |

---

## Testing Strategy

### Dual Testing Approach

This feature is well-suited for property-based testing because the core logic consists of pure functions (validation, sorting, aggregation, serialization) whose correctness must hold across a wide range of inputs.

**Unit tests** cover:
- Specific form submission examples (valid and invalid inputs)
- Empty state rendering (no transactions)
- Theme toggle behavior
- LocalStorage error handling (mocked)

**Property-based tests** cover:
- All 8 correctness properties defined above
- Each property is run with a minimum of 100 randomly generated inputs

### Recommended PBT Library

**fast-check** (JavaScript) — `npm install fast-check` or via CDN for browser-based testing.

### Property Test Configuration

Each property test must:
- Run a minimum of **100 iterations**
- Be tagged with a comment in the format:
  `// Feature: expense-budget-visualizer, Property N: <property_text>`
- Reference the design document property it validates

### Test File Structure

Since the app is plain JS with no build tool, tests can be run with a lightweight test runner (e.g., **Vitest** or **Jest** with a minimal config, or a browser-based harness):

```
tests/
  unit/
    validation.test.js
    balance.test.js
    sort.test.js
    persistence.test.js
    spending-limit.test.js
  property/
    validation.property.test.js   // Properties 1, 2
    balance.property.test.js      // Properties 3, 4
    persistence.property.test.js  // Property 5
    sort.property.test.js         // Property 6
    spending-limit.property.test.js // Property 7
    deletion.property.test.js     // Property 8
```

### Coverage Goals

| Area | Test Type | Properties |
|------|-----------|------------|
| Input validation | Property + Unit | 1, 2 |
| Balance calculation | Property | 3, 4 |
| LocalStorage round-trip | Property | 5 |
| Sort logic | Property | 6 |
| Spending limit logic | Property | 7 |
| Transaction deletion | Property | 8 |
| Theme toggle | Unit | — |
| Empty state rendering | Unit | — |
| Chart rendering | Unit (mock Chart.js) | — |
