# Requirements Document

## Introduction

The Expense & Budget Visualizer is a mobile-friendly single-page web application that enables users to track their daily spending. It provides a transaction input form, a scrollable transaction history list, a running total balance display, and a pie chart visualization of spending by category. All data is persisted in the browser's LocalStorage. The app is built with plain HTML, CSS, and Vanilla JavaScript — no frameworks or backend required.

## Glossary

- **App**: The Expense & Budget Visualizer single-page web application
- **Transaction**: A single spending record consisting of an item name, amount, and category
- **Category**: One of three predefined spending types: Food, Transport, or Fun
- **Balance**: The running total of all transaction amounts (sum of all amounts)
- **Chart**: The pie chart rendered via Chart.js showing spending distribution by category
- **Transaction_List**: The scrollable UI component displaying all recorded transactions
- **Input_Form**: The UI form component used to add new transactions
- **LocalStorage**: The browser's built-in key-value storage used for data persistence
- **Spending_Limit**: A user-configurable threshold amount used to highlight overspending in a category
- **Validator**: The client-side logic responsible for validating form inputs before submission

---

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to enter a transaction with a name, amount, and category, so that I can record my daily spending.

#### Acceptance Criteria

1. THE Input_Form SHALL display an item name text field, a numeric amount field, and a category selector with options: Food, Transport, and Fun.
2. WHEN a user submits the Input_Form with all fields filled and a valid positive amount, THE App SHALL create a new Transaction and add it to the Transaction_List.
3. WHEN a user submits the Input_Form with one or more empty fields, THE Validator SHALL prevent submission and display an inline error message indicating which fields are missing.
4. WHEN a user submits the Input_Form with an amount that is not a positive number, THE Validator SHALL prevent submission and display an error message indicating the amount must be a positive number.
5. WHEN a transaction is successfully added, THE Input_Form SHALL reset all fields to their default empty/unselected state.

---

### Requirement 2: Transaction List

**User Story:** As a user, I want to view all my recorded transactions in a scrollable list, so that I can review my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display all recorded transactions, each showing the item name, amount, and category.
2. WHEN the number of transactions exceeds the visible area, THE Transaction_List SHALL be scrollable to reveal all entries.
3. WHEN a user clicks the delete button on a transaction, THE App SHALL remove that transaction from the Transaction_List and from LocalStorage.
4. WHILE the Transaction_List contains no transactions, THE App SHALL display a placeholder message indicating no transactions have been recorded, including immediately after the last transaction is deleted.

---

### Requirement 3: Total Balance Display

**User Story:** As a user, I want to see my total spending balance at the top of the page, so that I always know how much I have spent in total.

#### Acceptance Criteria

1. THE App SHALL display the total balance as the sum of all transaction amounts at the top of the page.
2. WHEN a new transaction is added, THE App SHALL update the total balance display immediately without requiring a page reload.
3. WHEN a transaction is deleted, THE App SHALL update the total balance display immediately without requiring a page reload.
4. WHEN all transactions are deleted, THE App SHALL immediately display a total balance of 0.

---

### Requirement 4: Pie Chart Visualization

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand how my money is distributed across categories.

#### Acceptance Criteria

1. THE App SHALL render a pie chart using Chart.js that displays the proportion of total spending for each category (Food, Transport, Fun).
2. WHEN a new transaction is added, THE App SHALL update the pie chart immediately to reflect the new spending distribution.
3. WHEN a transaction is deleted, THE App SHALL update the pie chart immediately to reflect the updated spending distribution.
4. WHEN all transactions are deleted, THE App SHALL display a placeholder state for the pie chart, regardless of whether the chart component renders successfully.
5. THE Chart SHALL visually distinguish each category using a distinct color.

---

### Requirement 5: Data Persistence

**User Story:** As a user, I want my transactions to be saved between sessions, so that I do not lose my spending history when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN a transaction is added, THE App SHALL persist the transaction to LocalStorage immediately. IF LocalStorage persistence fails for any reason (e.g., quota exceeded, private browsing restrictions), THEN THE App SHALL prevent the transaction from being added and display an error message to the user.
2. WHEN a transaction is deleted, THE App SHALL remove the transaction from LocalStorage immediately.
3. WHEN the App loads, THE App SHALL read all previously saved transactions from LocalStorage and populate the Transaction_List, total balance, and Chart accordingly.

---

### Requirement 6: Sort Transactions

**User Story:** As a user, I want to sort my transaction list by amount or category, so that I can quickly find and analyze my spending patterns.

#### Acceptance Criteria

1. THE App SHALL provide a sort control that allows the user to sort transactions by amount (ascending or descending) or by category (alphabetical).
2. WHEN a sort option is selected, THE Transaction_List SHALL re-render all transactions in the chosen order immediately.
3. WHEN a new transaction is added while a sort order is active, THE Transaction_List SHALL insert the new transaction in the correct sorted position.

---

### Requirement 7: Spending Limit Highlight

**User Story:** As a user, I want to set a spending limit and see when I exceed it per category, so that I can stay within my budget.

#### Acceptance Criteria

1. THE App SHALL provide an input field where the user can set a numeric spending limit value.
2. WHEN the total spending in any category exceeds the configured spending limit, THE App SHALL visually highlight that category in the Transaction_List and/or Chart.
3. WHEN the spending limit is updated, THE App SHALL immediately re-evaluate all categories and synchronize highlights to reflect only those categories currently exceeding the new limit.
4. IF no spending limit is set, THEN THE App SHALL display no highlights.

---

### Requirement 8: Dark/Light Mode Toggle

**User Story:** As a user, I want to switch between dark and light display modes, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE App SHALL provide a toggle control to switch between dark mode and light mode.
2. WHEN the user activates dark mode, THE App SHALL apply a dark color scheme to all UI elements.
3. WHEN the user activates light mode, THE App SHALL apply a light color scheme to all UI elements.
4. WHEN the App loads, THE App SHALL apply the previously saved display mode from LocalStorage, defaulting to light mode if none is saved.
5. WHEN the display mode is changed, THE App SHALL persist the selected mode to LocalStorage immediately.

---

### Requirement 9: Responsive and Accessible UI

**User Story:** As a user, I want the app to be usable on both mobile and desktop devices, so that I can track spending on any device.

#### Acceptance Criteria

1. THE App SHALL use a responsive layout that adapts to screen widths from 320px to 1440px without horizontal scrolling.
2. THE App SHALL use readable typography with a minimum font size of 14px for body text.
3. THE App SHALL load and render all UI components within 3 seconds on a modern browser with a standard internet connection.
4. THE App SHALL be contained within a single HTML file, one CSS file in the `css/` directory, and one JavaScript file in the `js/` directory.
