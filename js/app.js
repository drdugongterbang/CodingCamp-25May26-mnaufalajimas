// Expense & Budget Visualizer — application logic

// ---------------------------------------------------------------------------
// State Object
// ---------------------------------------------------------------------------

export const state = {
  transactions: [],    // Array<Transaction>
  sortOrder: 'none',   // 'none' | 'amount-asc' | 'amount-desc' | 'category-asc'
  spendingLimit: null, // number | null
  theme: 'light',      // 'light' | 'dark'
};

// ---------------------------------------------------------------------------
// ID Generation
// ---------------------------------------------------------------------------

/**
 * Generate a unique string ID.
 * Uses crypto.randomUUID() when available, falls back to Date.now().toString().
 * @returns {string}
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString();
}

// ---------------------------------------------------------------------------
// Persistence Functions
// ---------------------------------------------------------------------------

/**
 * Persist the transactions array to LocalStorage.
 * Throws if the write fails (e.g. quota exceeded, private browsing).
 * @param {Array} transactions
 */
export function saveTransactions(transactions) {
  localStorage.setItem('ebv_transactions', JSON.stringify(transactions));
}

/**
 * Load transactions from LocalStorage.
 * Returns an empty array on failure or when nothing is stored.
 * @returns {Array}
 */
export function loadTransactions() {
  try {
    const raw = localStorage.getItem('ebv_transactions');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Persist the theme string to LocalStorage.
 * Throws if the write fails.
 * @param {string} theme - 'light' | 'dark'
 */
export function saveTheme(theme) {
  localStorage.setItem('ebv_theme', theme);
}

/**
 * Load the saved theme from LocalStorage.
 * Returns 'light' on failure or when nothing is stored.
 * @returns {string}
 */
export function loadTheme() {
  try {
    return localStorage.getItem('ebv_theme') || 'light';
  } catch {
    return 'light';
  }
}

/**
 * Persist the spending limit to LocalStorage.
 * Removes the key when limit is null.
 * Throws if the write fails.
 * @param {number|null} limit
 */
export function saveSpendingLimit(limit) {
  if (limit === null) {
    localStorage.removeItem('ebv_spending_limit');
  } else {
    localStorage.setItem('ebv_spending_limit', String(limit));
  }
}

/**
 * Load the spending limit from LocalStorage.
 * Returns null on failure or when nothing is stored.
 * @returns {number|null}
 */
export function loadSpendingLimit() {
  try {
    const raw = localStorage.getItem('ebv_spending_limit');
    return raw !== null ? parseFloat(raw) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a transaction's name and amount.
 * @param {string} name
 * @param {string|number} amount
 * @returns {string[]} Array of error messages; empty means valid.
 */
export function validateTransaction(name, amount) {
  const errors = [];
  if (!name || String(name).trim() === '') {
    errors.push('Item name is required.');
  }
  const amountStr = amount !== undefined && amount !== null ? String(amount) : '';
  if (!amountStr || amountStr.trim() === '') {
    errors.push('Amount is required.');
  } else if (isNaN(parseFloat(amountStr)) || parseFloat(amountStr) <= 0) {
    errors.push('Amount must be a positive number.');
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Pure Computation Functions
// ---------------------------------------------------------------------------

/**
 * Compute per-category spending totals.
 * @param {Array} transactions
 * @returns {Object} Category-keyed object of summed amounts.
 */
export function getCategoryTotals(transactions) {
  return transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
}

/**
 * Return a sorted copy of the transactions array.
 * @param {Array} transactions
 * @param {string} sortOrder - 'none' | 'amount-asc' | 'amount-desc' | 'category-asc'
 * @returns {Array}
 */
export function getSortedTransactions(transactions, sortOrder) {
  const copy = [...transactions];
  if (sortOrder === 'amount-asc') return copy.sort((a, b) => a.amount - b.amount);
  if (sortOrder === 'amount-desc') return copy.sort((a, b) => b.amount - a.amount);
  if (sortOrder === 'category-asc') return copy.sort((a, b) => a.category.localeCompare(b.category));
  return copy; // 'none' — preserve insertion order
}

// ---------------------------------------------------------------------------
// Page-load Hydration
// ---------------------------------------------------------------------------

/**
 * Hydrate state from LocalStorage on page load.
 * Defaults to safe empty values when nothing is stored or reads fail.
 */
function hydrateState() {
  state.transactions = loadTransactions();
  state.sortOrder = 'none';
  state.spendingLimit = loadSpendingLimit();
  state.theme = loadTheme();
}

// ---------------------------------------------------------------------------
// UI Mutation Helpers (stubs — filled in by later tasks)
// ---------------------------------------------------------------------------

/**
 * Add a transaction to state and persist it.
 * Validates inputs first; displays errors in #form-error on failure.
 * Throws (re-throws) if LocalStorage write fails so the caller can handle it.
 * @param {string} name
 * @param {string|number} amount
 * @param {string} category
 */
export function addTransaction(name, amount, category) {
  const errors = validateTransaction(name, amount);
  if (errors.length > 0) {
    const errorEl = document.getElementById('form-error');
    if (errorEl) {
      errorEl.textContent = errors.join(' ');
      errorEl.hidden = false;
    }
    return;
  }

  const transaction = {
    id: generateId(),
    name: String(name).trim(),
    amount: parseFloat(amount),
    category,
  };

  const updated = [...state.transactions, transaction];

  // Attempt persistence before mutating state (Requirement 5.1)
  try {
    saveTransactions(updated);
  } catch {
    const errorEl = document.getElementById('form-error');
    if (errorEl) {
      errorEl.textContent = 'Unable to save: storage is full or unavailable. Transaction was not added.';
      errorEl.hidden = false;
    }
    return;
  }

  state.transactions = updated;

  const errorEl = document.getElementById('form-error');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.hidden = true;
  }

  // Reset all form fields to their default empty/unselected state (Requirement 1.5)
  const nameInput = document.getElementById('input-name');
  const amountInput = document.getElementById('input-amount');
  const categorySelect = document.getElementById('input-category');
  if (nameInput) nameInput.value = '';
  if (amountInput) amountInput.value = '';
  if (categorySelect) categorySelect.selectedIndex = 0;

  render();
}

/**
 * Delete a transaction by id, persist, and re-render.
 * @param {string} id
 */
export function deleteTransaction(id) {
  state.transactions = state.transactions.filter((t) => t.id !== id);
  saveTransactions(state.transactions);
  render();
}

/**
 * Update the sort order and re-render.
 * @param {string} value
 */
export function setSortOrder(value) {
  state.sortOrder = value;
  render();
}

/**
 * Set the spending limit, persist, and re-render.
 * @param {string|number} value
 */
export function setSpendingLimit(value) {
  const parsed = parseFloat(value);
  if (!value || isNaN(parsed) || parsed <= 0) {
    state.spendingLimit = null;
    saveSpendingLimit(null);
  } else {
    state.spendingLimit = parsed;
    saveSpendingLimit(parsed);
  }
  render();
}

/**
 * Toggle between light and dark theme, persist, and apply to DOM.
 */
export function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  saveTheme(state.theme);
  document.documentElement.setAttribute('data-theme', state.theme);
  const btn = document.getElementById('btn-theme-toggle');
  if (btn) btn.textContent = state.theme === 'dark' ? 'Light Mode' : 'Dark Mode';
}

// ---------------------------------------------------------------------------
// Render functions
// ---------------------------------------------------------------------------

/**
 * Compute the sum of all transaction amounts and update #total-balance.
 * Displays 0 when there are no transactions (Requirements 3.1–3.4).
 */
function renderBalance() {
  const total = state.transactions.reduce((sum, t) => sum + t.amount, 0);
  const el = document.getElementById('total-balance');
  if (el) el.textContent = total.toFixed(2);
}

/**
 * Render the transaction list into #transaction-list.
 * Shows #empty-message when there are no transactions (Requirement 2.4).
 */
function renderTransactionList() {
  const listEl = document.getElementById('transaction-list');
  const emptyEl = document.getElementById('empty-message');
  if (!listEl) return;

  const sorted = getSortedTransactions(state.transactions, state.sortOrder);
  const categoryTotals = getCategoryTotals(state.transactions);

  if (sorted.length === 0) {
    listEl.hidden = true;
    if (emptyEl) emptyEl.hidden = false;
    return;
  }

  listEl.hidden = false;
  if (emptyEl) emptyEl.hidden = true;

  // Rebuild list contents
  listEl.innerHTML = '';
  sorted.forEach((t) => {
    const li = document.createElement('li');

    // Apply over-limit class when a spending limit is set and the category exceeds it
    if (state.spendingLimit !== null && categoryTotals[t.category] > state.spendingLimit) {
      li.classList.add('over-limit');
    }

    const nameSpan = document.createElement('span');
    nameSpan.className = 'transaction-name';
    nameSpan.textContent = t.name;

    const amountSpan = document.createElement('span');
    amountSpan.className = 'transaction-amount';
    amountSpan.textContent = `$${t.amount.toFixed(2)}`;

    const categoryBadge = document.createElement('span');
    categoryBadge.className = 'category-badge';
    categoryBadge.setAttribute('data-category', t.category);
    categoryBadge.textContent = t.category;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-delete';
    deleteBtn.setAttribute('data-id', t.id);
    deleteBtn.setAttribute('aria-label', `Delete ${t.name}`);
    deleteBtn.textContent = 'Delete';

    li.appendChild(nameSpan);
    li.appendChild(amountSpan);
    li.appendChild(categoryBadge);
    li.appendChild(deleteBtn);
    listEl.appendChild(li);
  });
}

/** Module-level Chart.js instance — destroyed before each re-creation. */
let chartInstance = null;

/**
 * Render (or update) the pie chart using Chart.js.
 * - Hides #chart-canvas and shows #chart-empty when there are no transactions (Requirement 4.4).
 * - Destroys any existing Chart.js instance before creating a new one.
 * - Assigns distinct colors to Food, Transport, and Fun (Requirement 4.5).
 * - Wraps Chart.js instantiation in try/catch for graceful degradation.
 */
function renderChart() {
  const canvasEl = document.getElementById('chart-canvas');
  const emptyEl = document.getElementById('chart-empty');

  if (!canvasEl) return;

  if (state.transactions.length === 0) {
    canvasEl.hidden = true;
    if (emptyEl) emptyEl.hidden = false;

    // Destroy any existing instance so it doesn't linger
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    return;
  }

  canvasEl.hidden = false;
  if (emptyEl) emptyEl.hidden = true;

  const totals = getCategoryTotals(state.transactions);

  const CATEGORY_COLORS = {
    Food: '#FF6384',
    Transport: '#36A2EB',
    Fun: '#FFCE56',
  };

  const labels = Object.keys(totals);
  const data = labels.map((label) => totals[label]);
  const colors = labels.map((label) => CATEGORY_COLORS[label] || '#CCCCCC');

  // Compute border highlights for over-limit categories (Requirement 7.2)
  const borderColors = labels.map((label) =>
    state.spendingLimit !== null && totals[label] > state.spendingLimit
      ? '#FF0000'
      : 'transparent'
  );
  const borderWidths = labels.map((label) =>
    state.spendingLimit !== null && totals[label] > state.spendingLimit ? 3 : 0
  );

  // Destroy previous instance to avoid Chart.js "Canvas is already in use" error
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  try {
    // Chart is loaded from CDN; guard against it being unavailable
    if (typeof Chart === 'undefined') {
      throw new Error('Chart.js is not loaded');
    }

    chartInstance = new Chart(canvasEl, {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderColor: borderColors,
            borderWidth: borderWidths,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    });
  } catch {
    // Chart.js unavailable or canvas error — hide the chart section gracefully
    canvasEl.hidden = true;
    if (emptyEl) emptyEl.hidden = true;
  }
}

function render() {
  renderBalance();
  renderTransactionList();
  renderChart();
}

// ---------------------------------------------------------------------------
// Bootstrap — runs only in a browser context
// ---------------------------------------------------------------------------

if (typeof window !== 'undefined') {
  hydrateState();

  // Apply persisted theme immediately
  document.documentElement.setAttribute('data-theme', state.theme);

  // Populate spending limit input if present
  window.addEventListener('DOMContentLoaded', () => {
    const limitInput = document.getElementById('spending-limit-input');
    if (limitInput && state.spendingLimit !== null) {
      limitInput.value = state.spendingLimit;
    }

    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.textContent = state.theme === 'dark' ? 'Light Mode' : 'Dark Mode';
      themeBtn.addEventListener('click', () => toggleTheme());
    }

    // Attach delegated click listener on #transaction-list for delete buttons
    const transactionList = document.getElementById('transaction-list');
    if (transactionList) {
      transactionList.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-id]');
        if (btn) {
          deleteTransaction(btn.getAttribute('data-id'));
        }
      });
    }

    // Attach sort select change listener (Requirement 6.1)
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (event) => {
        setSortOrder(event.target.value);
      });
    }

    // Attach spending limit button listener (Requirement 7.1)
    const limitBtn = document.getElementById('btn-set-limit');
    if (limitBtn) {
      limitBtn.addEventListener('click', () => {
        const limitInput = document.getElementById('spending-limit-input');
        setSpendingLimit(limitInput ? limitInput.value : '');
      });
    }

    // Attach form submit listener (Requirement 1.2)
    const form = document.getElementById('transaction-form');
    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = document.getElementById('input-name')?.value ?? '';
        const amount = document.getElementById('input-amount')?.value ?? '';
        const category = document.getElementById('input-category')?.value ?? '';
        addTransaction(name, amount, category);
      });
    }

    render();
  });
}
