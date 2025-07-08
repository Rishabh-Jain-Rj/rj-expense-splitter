# RJ Expense Splitter 💰

A modern, user-friendly web application for splitting expenses among friends, roommates, or travel groups. Built with Next.js and Tailwind CSS, featuring professional PDF receipt generation.

## 🎯 Purpose

When you're out with friends, traveling in groups, or sharing living expenses, keeping track of who paid what and who owes whom can become complicated. RJ Expense Splitter solves this problem by:

- **Tracking all expenses** in one place
- **Automatically calculating** who owes money to whom
- **Minimizing transactions** needed to settle all debts
- **Generating professional receipts** for record-keeping
- **Handling complex scenarios** like multiple payers for single expenses

## ✨ Features

### 🧑‍🤝‍🧑 User Management

- **Dynamic user addition/removal** - Add or remove participants anytime
- **No hardcoded limitations** - Support any number of users
- **Clean user interface** - Easy-to-use management system

### 💸 Expense Tracking

- **Multiple payment modes**:
  - Single payer (traditional split)
  - Multiple payers with equal amounts
  - Multiple payers with individual amounts
- **Category organization** - Food, Transport, Accommodation, etc.
- **Date tracking** - Keep chronological records
- **Participant selection** - Choose who should split each expense
- **"Everyone" quick select** - One-click to include all users

### 🧮 Smart Calculations

- **Real-time balance calculation** - See who owes what instantly
- **Optimal settlement algorithm** - Minimize number of transactions
- **Individual balance tracking** - Clear view of each person's status
- **Category-wise breakdown** - Understand spending patterns

### 📄 Professional PDF Reports

- **Receipt-style formatting** - Looks like actual business receipts
- **Complete expense details** - All transactions with dates and categories
- **Settlement instructions** - Clear payment directions
- **Downloadable format** - Easy sharing and record-keeping

### 🎨 User Experience

- **Responsive design** - Works on all devices
- **Intuitive interface** - Easy for anyone to use
- **Real-time validation** - Prevents errors before they happen
- **Visual feedback** - Color-coded balances and status indicators

### Dependencies

    {
    "dependencies": {
    "@react-pdf/renderer": "^4.3.0",
    "lucide-react": "^0.525.0",
    "moment": "^2.30.1",
    "next": "15.2.2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
     }
    }

## 🎮 How to Use

### Step 1: Add Users

1. Click "Manage Users" button
2. Enter names of all participants
3. Add at least 2 users to start tracking expenses

### Step 2: Add Expenses

1. Click "Add Expense" button
2. Fill in expense details:
   - **Description**: What was the expense for?
   - **Category**: Type of expense (Food, Transport, etc.)
   - **Amount**: Total amount spent
   - **Date**: When the expense occurred
   - **Paid by**: Who actually paid (can be multiple people)
   - **Participants**: Who should split this expense

### Step 3: Handle Multiple Payers

- Toggle "Individual amounts" if different people paid different amounts
- Enter specific amounts for each payer
- The app validates that total payments equal the expense amount

### Step 4: View Balances

- See real-time balance calculations
- Green = Gets money back
- Red = Owes money
- Gray = All settled

### Step 5: Get Settlement Instructions

- View optimized settlement plan
- Minimize number of transactions needed
- Follow the step-by-step payment instructions

### Step 6: Generate PDF Receipt

- Click "Download PDF" to generate professional receipt
- Share with group members
- Keep for your records

**Made with ❤️ by RJ**

_Split expenses, not friendships!_ 🤝💰
