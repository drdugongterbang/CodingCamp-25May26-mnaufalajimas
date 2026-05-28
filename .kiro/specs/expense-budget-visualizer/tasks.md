# Implementation Plan: Expense & Budget Visualizer

## Overview

This plan implements the Expense & Budget Visualizer as a plain HTML/CSS/Vanilla JS single-page application. Tasks are ordered so that foundational layers (scaffold, state, persistence) are built first, followed by UI features, then unit tests, and finally property-based tests that validate the correctness properties defined in the design document.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1"],
      "description": "Project scaffold — file structure, dependencies, and test runner setup"
    },
    {
      "wave": 2,
      "tasks": ["2"],
      "description": "State object, LocalStorage persistence helpers, and core pure functions"
    },
    {
      "wave": 3,
      "tasks": ["3", "4", "5"],
      "description": "Transaction input form, transaction list + balance display, and pie chart"
    },
    {
      "wave": 4,
      "tasks": ["9", "10", "11"],
      "description": "Sort controls, spending limit highlight, and dark/light mode toggle"
    },
    {
      "wave": 5,
      "tasks": ["6", "7", "8", "12", "13"],
      "description": "Unit tests (validation, balance, chart, persistence, theme) and responsive/accessible UI"
    },
    {
      "wave": 6,
      "tasks": ["14", "15", "16", "17", "18", "19"],
      "description": "Property-based tests for all 8 correctness properties"
    }
  ]
}
```

## Tasks

- [x] 1. Project scaffold — create file structure and load dependencies
  - Create `index.html` as the single HTML entry point with correct `<head>` metadata, viewport meta tag, and links to `css/style.css` and `js/app.js`
  - Add a `<script>` tag loading Chart.js from the official CDN (`https://cdn.jsdelivr.net/npm/chart.js`)
  - Create `css/style.css` as an empty file ready for styling
  - Create `js/app.js` as an empty file ready for application logic
  - Create the `tests/unit/` and `tests/property/` directories
  - Add a `package.json` with Vitest and fast-check as dev dependencies, and a `test` script that runs `vitest run`
  - Add a minimal `vitest.config.js` so Vitest can resolve the plain JS source files under `js/`
  - Verify the HTML file opens in a browser without console errors

- [x] 2. State object, LocalStorage persistence, and core pure functions
  - Define the `state` object in `js/app.js` with fields: `transactions`, `sortOrder`, `spendingLimit`, `theme` (matching the design's State Object schema)
  - Implement `saveTransactions`, `loadTransactions`, `saveTheme`, `loadTheme`, `saveSpendingLimit`, and `loadSpendingLimit` exactly as specified in the design's Persistence Functions section
  - Implement `validateTransaction(name, amount)` returning an array of error strings (empty = valid), matching the design's Validation Logic
  - Implement `getCategoryTotals(transactions)` returning a category-keyed object of summed amounts
  - Implement `getSortedTransactions(transactions, sortOrder)` supporting `'none'`, `'amount-asc'`, `'amount-desc'`, and `'category-asc'`
  - Implement `generateId()` using `crypto.randomUUID()` with a `Date.now().toString()` fallback
  - On page load, hydrate `state` from LocalStorage using the load functions; default to empty transactions, `'none'` sort, `null` limit, and `'light'` theme if nothing is stored
  - Wrap LocalStorage writes in try/catch; surface failures to the caller so the UI layer can display an error (Requirement 5.1)
  - Wrap LocalStorage reads in try/catch; default to safe empty values on failure

- [x] 3. Transaction input form — markup, validation, and add logic
  - Add the `#transaction-form` markup to `index.html` with: `#input-name` (text input), `#input-amount` (number input), `#input-category` (select with options Food, Transport, Fun), `#btn-add` (submit button), and `#form-error` (error container, initially hidden)
  - Implement `addTransaction(name, amount, category)` in `js/app.js`:
    - Call `validateTransaction`; if errors exist, display them in `#form-error` and abort
    - Attempt to persist via `saveTransactions`; if it throws, display a LocalStorage error in `#form-error` and abort (Requirement 5.1)
    - On success: create a Transaction object with a generated id, push it to `state.transactions`, clear `#form-error`, reset the form fields, and call `render()`
  - Attach a `submit` event listener to `#transaction-form` that calls `addTransaction` with the current field values (Requirement 1.2)
  - Inline error messages must identify which field(s) are missing (Requirements 1.3, 1.4)
  - After a successful add, all form fields must return to their default empty/unselected state (Requirement 1.5)

- [x] 4. Transaction list rendering and balance display
  - Add `#transaction-list` (`<ul>`) and `#empty-message` (`<p>`) to `index.html`; add `#total-balance` display element at the top of the page
  - Implement `renderBalance()`: compute the sum of all `state.transactions` amounts and update `#total-balance`; display `0` when the list is empty (Requirements 3.1–3.4)
  - Implement `renderTransactionList()`:
    - Call `getSortedTransactions` with the current `state.sortOrder`
    - For each transaction render a `<li>` containing: item name, formatted amount, category badge, and a delete button with `data-id` attribute
    - Apply the CSS class `over-limit` to any `<li>` whose category total exceeds `state.spendingLimit` (when a limit is set)
    - Show `#empty-message` and hide the list when there are no transactions; hide the message and show the list otherwise (Requirement 2.4)
  - Implement `deleteTransaction(id)`: remove the transaction from `state.transactions`, call `saveTransactions`, and call `render()` (Requirements 2.3, 3.3)
  - Attach a delegated `click` event listener on `#transaction-list` that calls `deleteTransaction` when a delete button is clicked
  - Implement the top-level `render()` function that calls `renderBalance()`, `renderTransactionList()`, and `renderChart()`

- [x] 5. Pie chart visualization with Chart.js
  - Add `#chart-canvas` (`<canvas>`) and `#chart-empty` (placeholder element) to `index.html`
  - Implement `renderChart()`:
    - If `state.transactions` is empty, hide `#chart-canvas` and show `#chart-empty` (Requirement 4.4)
    - Otherwise, show `#chart-canvas` and hide `#chart-empty`
    - Destroy any existing Chart.js instance before creating a new one to avoid conflicts
    - Create a `'pie'` Chart.js instance on `#chart-canvas` using data from `getCategoryTotals(state.transactions)`
    - Assign distinct colors to Food, Transport, and Fun (Requirement 4.5)
    - Wrap Chart.js instantiation in a try/catch; if Chart.js is unavailable, hide the chart section gracefully
  - Chart must update immediately on every add and delete (Requirements 4.2, 4.3)

- [ ] 6. Unit tests — input validation and form behavior
  - Create `tests/unit/validation.test.js`
  - Import `validateTransaction` from `js/app.js` (or a dedicated module if extracted)
  - Test: valid input (non-empty name, positive amount) returns an empty errors array
  - Test: empty name returns an error mentioning the name field
  - Test: whitespace-only name returns an error
  - Test: empty amount returns an error mentioning the amount field
  - Test: zero amount returns an error
  - Test: negative amount returns an error
  - Test: non-numeric amount string returns an error
  - Run `npm test` and confirm all tests pass

- [ ] 7. Unit tests — balance calculation and category totals
  - Create `tests/unit/balance.test.js`
  - Import `getCategoryTotals` and the balance computation logic from `js/app.js`
  - Test: balance of an empty transaction array is `0`
  - Test: balance of a single transaction equals its amount
  - Test: balance of multiple transactions equals their arithmetic sum
  - Test: `getCategoryTotals` returns correct per-category sums for a mixed transaction list
  - Test: `getCategoryTotals` returns an empty object for an empty transaction list
  - Run `npm test` and confirm all tests pass

- [ ] 8. Unit tests — chart rendering and empty state
  - Create `tests/unit/chart.test.js`
  - Mock Chart.js (or stub the canvas context) and verify that `renderChart` hides the canvas and shows the placeholder when transactions are empty
  - Verify that `renderChart` shows the canvas when transactions exist
  - Verify that `renderChart` does not throw when Chart.js is unavailable (graceful degradation)
  - Run `npm test` and confirm all tests pass

- [x] 9. Sort controls
  - Add `#sort-select` (`<select>`) to `index.html` with options: Default (`none`), Amount ↑ (`amount-asc`), Amount ↓ (`amount-desc`), Category A–Z (`category-asc`)
  - Implement `setSortOrder(value)`: update `state.sortOrder` and call `render()`
  - Attach a `change` event listener on `#sort-select` that calls `setSortOrder` (Requirement 6.1)
  - Verify that selecting a sort option immediately re-renders the list in the correct order (Requirement 6.2)
  - Verify that adding a new transaction while a sort is active inserts it in the correct sorted position (Requirement 6.3)

- [x] 10. Spending limit input and highlight logic
  - Add `#spending-limit-input` (number input) and `#btn-set-limit` (button) to `index.html`
  - Implement `setSpendingLimit(value)`: parse the value as a float; if valid and positive, set `state.spendingLimit` and call `saveSpendingLimit`; if empty or invalid, set `state.spendingLimit` to `null` and call `saveSpendingLimit(null)`; then call `render()` (Requirements 7.1, 7.4)
  - Attach a `click` event listener on `#btn-set-limit` that calls `setSpendingLimit`
  - In `renderTransactionList()`, apply the `over-limit` CSS class to each `<li>` whose category total exceeds `state.spendingLimit` (Requirement 7.2)
  - In `renderChart()`, visually highlight over-limit categories (e.g., via a distinct border color) (Requirement 7.2)
  - When the limit is updated, `render()` must re-evaluate all categories so highlights are immediately synchronized (Requirement 7.3)
  - On page load, restore `state.spendingLimit` from LocalStorage and populate `#spending-limit-input` with the saved value

- [x] 11. Dark/light mode toggle
  - Add `#btn-theme-toggle` (button) to `index.html`
  - Implement `toggleTheme()`: flip `state.theme` between `'light'` and `'dark'`, call `saveTheme`, and apply the theme by setting a `data-theme` attribute on `<html>` (Requirements 8.1–8.3)
  - In `css/style.css`, define CSS custom properties for both themes under `[data-theme="light"]` and `[data-theme="dark"]` selectors, covering background, text, surface, and accent colors (Requirements 8.2, 8.3)
  - On page load, call `loadTheme()`, set `state.theme`, apply the `data-theme` attribute, and update the toggle control to reflect the current mode (Requirement 8.4)
  - Persist the selected mode to LocalStorage immediately on change (Requirement 8.5)

- [ ] 12. Unit tests — LocalStorage persistence helpers and theme toggle
  - Create `tests/unit/persistence.test.js` and `tests/unit/theme.test.js`
  - In `persistence.test.js` (mock `localStorage` using `vi.stubGlobal` or an in-memory stub):
    - Test: `saveTransactions` + `loadTransactions` round-trip preserves all transaction fields
    - Test: `loadTransactions` returns `[]` when LocalStorage is empty
    - Test: `saveSpendingLimit` + `loadSpendingLimit` round-trip returns the saved number
    - Test: `loadSpendingLimit` returns `null` when nothing is stored
    - Test: `saveTransactions` propagates a thrown error so the caller can handle it
  - In `theme.test.js`:
    - Test: `toggleTheme` switches `state.theme` from `'light'` to `'dark'` and back
    - Test: `saveTheme` + `loadTheme` round-trip returns the saved theme
    - Test: `loadTheme` returns `'light'` when nothing is stored
  - Run `npm test` and confirm all tests pass

- [x] 13. Responsive layout and accessibility
  - In `css/style.css`, implement a responsive layout using CSS Grid or Flexbox that adapts from 320 px to 1440 px without horizontal scrolling (Requirement 9.1)
  - Ensure all body text uses a minimum font size of 14 px (Requirement 9.2)
  - Add `aria-label` or `aria-labelledby` attributes to all interactive controls (form inputs, buttons, select, canvas)
  - Add `role="alert"` to `#form-error` so screen readers announce validation errors
  - Ensure color contrast ratios meet WCAG AA for both light and dark themes
  - Verify the app loads and renders within 3 seconds on a modern browser (Requirement 9.3)
  - Confirm the deliverable is exactly three files: `index.html`, `css/style.css`, `js/app.js` (Requirement 9.4)

- [ ] 14. Property-based test — transaction addition and validation (Properties 1 & 2)
  - Create `tests/property/validation.property.test.js`
  - Use fast-check; run each property for a minimum of 100 iterations
  - **Property 1** — `// Feature: expense-budget-visualizer, Property 1: Transaction addition grows the list`: for any existing transaction array and any valid transaction (non-empty name, positive amount, valid category), adding it must increase the array length by exactly 1. **Validates: Requirements 1.2**
  - **Property 2** — `// Feature: expense-budget-visualizer, Property 2: Whitespace and invalid amounts are rejected`: for any input where the name is empty/whitespace-only or the amount is non-positive/non-numeric, `validateTransaction` must return a non-empty errors array. **Validates: Requirements 1.3, 1.4**
  - Run `npm test` and update PBT status accordingly

- [ ] 15. Property-based test — balance and category totals (Properties 3 & 4)
  - Create `tests/property/balance.property.test.js`
  - Use fast-check; run each property for a minimum of 100 iterations
  - **Property 3** — `// Feature: expense-budget-visualizer, Property 3: Balance equals sum of all transaction amounts`: for any array of transactions, the computed balance must equal the arithmetic sum of all amounts. **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  - **Property 4** — `// Feature: expense-budget-visualizer, Property 4: Category totals partition the balance`: for any array of transactions, the sum of all values in `getCategoryTotals(transactions)` must equal the total balance. **Validates: Requirements 4.1, 4.2, 4.3**
  - Run `npm test` and update PBT status accordingly

- [ ] 16. Property-based test — persistence round-trip (Property 5)
  - Create `tests/property/persistence.property.test.js`
  - Use fast-check; run each property for a minimum of 100 iterations
  - **Property 5** — `// Feature: expense-budget-visualizer, Property 5: Transaction persistence round-trip`: for any array of transactions, `JSON.parse(JSON.stringify(transactions))` must produce an array deeply equal to the original (all fields preserved). **Validates: Requirements 5.1, 5.3**
  - Run `npm test` and update PBT status accordingly

- [ ] 17. Property-based test — sort order correctness (Property 6)
  - Create `tests/property/sort.property.test.js`
  - Use fast-check; run each property for a minimum of 100 iterations
  - **Property 6** — `// Feature: expense-budget-visualizer, Property 6: Sort order correctness`: for any array of transactions, `getSortedTransactions` with `'amount-asc'` must produce a list where every consecutive pair satisfies `a.amount <= b.amount`; with `'amount-desc'`, `a.amount >= b.amount`; with `'category-asc'`, `a.category <= b.category`. **Validates: Requirements 6.1, 6.2, 6.3**
  - Run `npm test` and update PBT status accordingly

- [ ] 18. Property-based test — spending limit highlight consistency (Property 7)
  - Create `tests/property/spending-limit.property.test.js`
  - Use fast-check; run each property for a minimum of 100 iterations
  - **Property 7** — `// Feature: expense-budget-visualizer, Property 7: Spending limit highlight consistency`: for any array of transactions and any positive spending limit, a category must be flagged as over-limit if and only if its total from `getCategoryTotals` strictly exceeds the limit. **Validates: Requirements 7.2, 7.3**
  - Run `npm test` and update PBT status accordingly

- [ ] 19. Property-based test — deletion removes exactly one transaction (Property 8)
  - Create `tests/property/deletion.property.test.js`
  - Use fast-check; run each property for a minimum of 100 iterations
  - **Property 8** — `// Feature: expense-budget-visualizer, Property 8: Deletion removes exactly one transaction`: for any transaction array containing a transaction with a given id, filtering out that id must produce an array that (a) does not contain the id and (b) has length exactly one less than the original. **Validates: Requirements 2.3, 3.3**
  - Run `npm test` and update PBT status accordingly

## Notes

- All source code must remain in exactly three files: `index.html`, `css/style.css`, and `js/app.js` (Requirement 9.4). Test files live under `tests/` and are not part of the deliverable.
- Pure functions (`validateTransaction`, `getCategoryTotals`, `getSortedTransactions`, persistence helpers) should be exported via `export` or attached to a module object so test files can import them without loading the full DOM-dependent app.
- Chart.js is loaded from CDN at runtime; tests that exercise `renderChart` must stub or mock the global `Chart` constructor to avoid DOM/canvas dependencies in the Node.js test environment.
- fast-check arbitraries for transactions should constrain amounts to finite positive floats and categories to the enum `['Food', 'Transport', 'Fun']` to stay within the valid input space.
- Property-based tests (tasks 14–19) depend on the pure functions being implemented and exported (task 2). They do not depend on the DOM rendering tasks (3–5, 9–11).
