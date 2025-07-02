"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Users,
  Calculator,
  Receipt,
  UserPlus,
  UserMinus,
  FileText,
  X,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ExpenseReceiptPDF from "./ExpenseReceiptPDF";
import data from "./data.json";

export default function ExpenseTracker() {
  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [newUser, setNewUser] = useState("");
  const [multiPayerMode, setMultiPayerMode] = useState(false);

  const [newExpense, setNewExpense] = useState({
    paidBy: [],
    paymentAmounts: {}, // Store individual payment amounts
    amount: "",
    description: "",
    participants: [],
    date: new Date().toISOString().split("T")[0],
    category: "Food",
  });

  const CATEGORIES = [
    "Food",
    "Transport",
    "Accommodation",
    "Entertainment",
    "Shopping",
    "Bills",
    "Other",
  ];

  // User Management Functions
  const handleAddUser = () => {
    if (newUser.trim() && !users.includes(newUser.trim())) {
      setUsers([...users, newUser.trim()]);
      setNewUser("");
    }
  };

  const handleRemoveUser = (userToRemove) => {
    setUsers(users.filter((user) => user !== userToRemove));
    // Clean up expenses that reference this user
    setExpenses(
      expenses
        .map((expense) => ({
          ...expense,
          paidBy: expense.paidBy.filter((user) => user !== userToRemove),
          participants: expense.participants.filter(
            (user) => user !== userToRemove
          ),
          paymentAmounts: Object.fromEntries(
            Object.entries(expense.paymentAmounts || {}).filter(
              ([user]) => user !== userToRemove
            )
          ),
        }))
        .filter(
          (expense) =>
            expense.paidBy.length > 0 && expense.participants.length > 0
        )
    );
  };

  // Calculate balances and settlements
  const calculateBalances = () => {
    const balances = {};
    users.forEach((user) => (balances[user] = 0));

    expenses.forEach((expense) => {
      const sharePerPerson = expense.amount / expense.participants.length;

      // Handle individual payment amounts or equal split
      if (
        expense.paymentAmounts &&
        Object.keys(expense.paymentAmounts).length > 0
      ) {
        // Individual amounts specified
        Object.entries(expense.paymentAmounts).forEach(([payer, amount]) => {
          balances[payer] += Number(amount);
        });
      } else {
        // Equal split among payers
        const paymentPerPayer = expense.amount / expense.paidBy.length;
        expense.paidBy.forEach((payer) => {
          balances[payer] += paymentPerPayer;
        });
      }

      // Each participant gets debited their share
      expense.participants.forEach((participant) => {
        balances[participant] -= sharePerPerson;
      });
    });

    return balances;
  };

  const calculateSettlements = () => {
    const balances = calculateBalances();
    const settlements = [];

    // Create arrays of debtors and creditors
    const debtors = [];
    const creditors = [];

    Object.entries(balances).forEach(([person, balance]) => {
      if (balance > 0.01) {
        creditors.push({ person, amount: balance });
      } else if (balance < -0.01) {
        debtors.push({ person, amount: Math.abs(balance) });
      }
    });

    // Sort by amount for optimal settlement
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    // Calculate settlements
    let i = 0,
      j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debt = debtors[i].amount;
      const credit = creditors[j].amount;
      const settlement = Math.min(debt, credit);

      if (settlement > 0.01) {
        settlements.push({
          from: debtors[i].person,
          to: creditors[j].person,
          amount: settlement,
        });
      }

      debtors[i].amount -= settlement;
      creditors[j].amount -= settlement;

      if (debtors[i].amount < 0.01) i++;
      if (creditors[j].amount < 0.01) j++;
    }

    return settlements;
  };

  const handleAddExpense = () => {
    if (
      !newExpense.amount ||
      !newExpense.description ||
      newExpense.paidBy.length === 0 ||
      newExpense.participants.length === 0
    ) {
      alert("Please fill all required fields");
      return;
    }

    // Validate payment amounts if in multi-payer mode
    if (multiPayerMode) {
      const totalPaid = Object.values(newExpense.paymentAmounts).reduce(
        (sum, amount) => sum + Number(amount || 0),
        0
      );
      if (Math.abs(totalPaid - Number(newExpense.amount)) > 0.01) {
        alert(
          `Total payment amounts (₹${totalPaid}) must equal the expense amount (₹${newExpense.amount})`
        );
        return;
      }
    }

    const expense = {
      id: Date.now(),
      ...newExpense,
      amount: Number.parseFloat(newExpense.amount),
      paymentAmounts: multiPayerMode ? newExpense.paymentAmounts : {},
    };

    if (editingExpense) {
      setExpenses(
        expenses.map((exp) => (exp.id === editingExpense.id ? expense : exp))
      );
      setEditingExpense(null);
    } else {
      setExpenses([...expenses, expense]);
    }

    resetForm();
  };

  const resetForm = () => {
    setNewExpense({
      paidBy: [],
      paymentAmounts: {},
      amount: "",
      description: "",
      participants: [],
      date: new Date().toISOString().split("T")[0],
      category: "Food",
    });
    setShowAddForm(false);
    setMultiPayerMode(false);
  };

  const handleEditExpense = (expense) => {
    setNewExpense(expense);
    setEditingExpense(expense);
    setShowAddForm(true);
    setMultiPayerMode(
      expense.paymentAmounts && Object.keys(expense.paymentAmounts).length > 0
    );
  };

  const handleDeleteExpense = (id) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      setExpenses(expenses.filter((exp) => exp.id !== id));
    }
  };

  const handlePaidByToggle = (user) => {
    const paidBy = newExpense.paidBy.includes(user)
      ? newExpense.paidBy.filter((p) => p !== user)
      : [...newExpense.paidBy, user];

    // Update payment amounts when toggling payers
    const paymentAmounts = { ...newExpense.paymentAmounts };
    if (!paidBy.includes(user)) {
      delete paymentAmounts[user];
    } else if (multiPayerMode && !paymentAmounts[user]) {
      paymentAmounts[user] = "";
    }

    setNewExpense({ ...newExpense, paidBy, paymentAmounts });
  };

  const handlePaymentAmountChange = (user, amount) => {
    setNewExpense({
      ...newExpense,
      paymentAmounts: {
        ...newExpense.paymentAmounts,
        [user]: amount,
      },
    });
  };

  const handleParticipantToggle = (user) => {
    const participants = newExpense.participants.includes(user)
      ? newExpense.participants.filter((p) => p !== user)
      : [...newExpense.participants, user];

    setNewExpense({ ...newExpense, participants });
  };

  const handleEveryoneToggle = () => {
    const allSelected = users.every((user) =>
      newExpense.participants.includes(user)
    );
    const participants = allSelected ? [] : [...users];
    setNewExpense({ ...newExpense, participants });
  };

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const getExpensesByCategory = () => {
    const categoryTotals = {};
    CATEGORIES.forEach((cat) => (categoryTotals[cat] = 0));

    expenses.forEach((expense) => {
      categoryTotals[expense.category] += expense.amount;
    });

    return categoryTotals;
  };

  const displayHeaderUI = () => (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Receipt className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">RJ Expense Splitter</h1>
            <p className="text-blue-100">Split expenses with friends easily</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm opacity-90">Total Expenses</div>
          <div className="text-2xl font-bold">
            ₹{getTotalExpenses().toLocaleString()}
          </div>
          <div className="text-sm opacity-90">{users.length} participants</div>
        </div>
      </div>
    </div>
  );

  const renderDownloadButton = () => {
    if (expenses.length > 0 && users.length > 0) {
      return (
        <PDFDownloadLink
          document={
            <ExpenseReceiptPDF
              expenses={expenses}
              users={users}
              balances={calculateBalances()}
              settlements={calculateSettlements()}
              generatedAt={new Date()}
            />
          }
          fileName={`expense-report-${
            new Date().toISOString().split("T")[0]
          }.pdf`}
        >
          {({ loading }) => (
            <button className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
              <FileText className="h-4 w-4" />
              <span>{loading ? "Generating..." : "Download PDF"}</span>
            </button>
          )}
        </PDFDownloadLink>
      );
    }
    // return (
    //   <PDFDownloadLink
    //     document={<ExpenseReceiptPDF {...data} />}
    //     fileName={`expense-report-${
    //       new Date().toISOString().split("T")[0]
    //     }.pdf`}
    //   >
    //     {({ loading }) => (
    //       <button className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
    //         <FileText className="h-4 w-4" />
    //         <span>{loading ? "Generating..." : "Download PDF"}</span>
    //       </button>
    //     )}
    //   </PDFDownloadLink>
    // );
  };

  const displayActionButtonsUI = () => (
    <div className="flex flex-wrap gap-3 mb-6">
      <button
        onClick={() => setShowUserManagement(true)}
        className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <Users className="h-4 w-4" />
        <span>Manage Users ({users.length})</span>
      </button>
      <button
        onClick={() => setShowAddForm(true)}
        disabled={users.length < 2}
        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <Plus className="h-4 w-4" />
        <span>Add Expense</span>
      </button>
      {renderDownloadButton()}
    </div>
  );

  const displayUserManagementUI = () =>
    showUserManagement && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Manage Users</h2>
            <button
              onClick={() => setShowUserManagement(false)}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Add New User
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newUser}
                onChange={(e) => setNewUser(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddUser()}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter user name"
              />
              <button
                onClick={handleAddUser}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <UserPlus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Current Users
            </label>
            {users.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No users added yet. Add at least 2 users to start tracking
                expenses.
              </p>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium">{user}</span>
                    <button
                      onClick={() => handleRemoveUser(user)}
                      className="text-red-600 hover:bg-red-100 p-1 rounded"
                      title="Remove user"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowUserManagement(false)}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );

  const displayAddExpenseFormUI = () =>
    showAddForm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              {editingExpense ? "Edit Expense" : "Add New Expense"}
            </h2>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingExpense(null);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Description *
              </label>
              <input
                type="text"
                value={newExpense.description}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, description: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Dinner at restaurant"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={newExpense.category}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, category: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Total Amount (₹) *
              </label>
              <input
                type="number"
                value={newExpense.amount}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, amount: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={newExpense.date}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, date: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Paid by *</label>
                <button
                  type="button"
                  onClick={() => setMultiPayerMode(!multiPayerMode)}
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  {multiPayerMode ? (
                    <ToggleRight className="h-4 w-4" />
                  ) : (
                    <ToggleLeft className="h-4 w-4" />
                  )}
                  <span>Individual amounts</span>
                </button>
              </div>

              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newExpense.paidBy.includes(user)}
                      onChange={() => handlePaidByToggle(user)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm flex-1">{user}</span>
                    {multiPayerMode && newExpense.paidBy.includes(user) && (
                      <input
                        type="number"
                        value={newExpense.paymentAmounts[user] || ""}
                        onChange={(e) =>
                          handlePaymentAmountChange(user, e.target.value)
                        }
                        className="w-20 p-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="₹0"
                        min="0"
                        step="0.01"
                      />
                    )}
                  </div>
                ))}
              </div>

              {multiPayerMode && newExpense.paidBy.length > 0 && (
                <div className="text-xs text-gray-600 mt-1">
                  Total paid: ₹
                  {Object.values(newExpense.paymentAmounts).reduce(
                    (sum, amount) => sum + Number(amount || 0),
                    0
                  )}
                </div>
              )}

              {newExpense.paidBy.length === 0 && (
                <p className="text-red-500 text-xs mt-1">
                  Select at least one person who paid
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">
                  Participants *
                </label>
                <button
                  type="button"
                  onClick={handleEveryoneToggle}
                  className="text-sm text-green-600 hover:text-green-800"
                >
                  {users.every((user) => newExpense.participants.includes(user))
                    ? "Deselect All"
                    : "Everyone"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {users.map((user) => (
                  <label
                    key={user}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={newExpense.participants.includes(user)}
                      onChange={() => handleParticipantToggle(user)}
                      className="rounded text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm">{user}</span>
                  </label>
                ))}
              </div>

              {newExpense.participants.length === 0 && (
                <p className="text-red-500 text-xs mt-1">
                  Select at least one participant
                </p>
              )}
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleAddExpense}
              disabled={
                !newExpense.amount ||
                !newExpense.description ||
                newExpense.paidBy.length === 0 ||
                newExpense.participants.length === 0
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
            >
              {editingExpense ? "Update" : "Add"} Expense
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingExpense(null);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );

  const displayExpenseListUI = () => (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Receipt className="h-5 w-5 text-gray-600" />
        <h2 className="text-xl font-bold">Expense List</h2>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No expenses added yet</p>
          <p className="text-sm">Add your first expense to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2">Date</th>
                <th className="text-left py-3 px-2">Description</th>
                <th className="text-left py-3 px-2">Category</th>
                <th className="text-left py-3 px-2">Paid by</th>
                <th className="text-right py-3 px-2">Amount</th>
                <th className="text-left py-3 px-2">Participants</th>
                <th className="text-right py-3 px-2">Per Person</th>
                <th className="text-center py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-2 text-sm text-gray-600">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-2 font-medium">
                    {expense.description}
                  </td>
                  <td className="py-3 px-2">
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                      {expense.category}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex flex-wrap gap-1">
                      {expense.paidBy.map((payer) => (
                        <span
                          key={payer}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                        >
                          {payer}
                          {expense.paymentAmounts &&
                            expense.paymentAmounts[payer] && (
                              <span className="ml-1 font-semibold">
                                ₹{expense.paymentAmounts[payer]}
                              </span>
                            )}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right font-semibold">
                    ₹{expense.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex flex-wrap gap-1">
                      {expense.participants.map((participant) => (
                        <span
                          key={participant}
                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                        >
                          {participant}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right text-sm text-gray-600">
                    ₹{(expense.amount / expense.participants.length).toFixed(2)}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex space-x-1 justify-center">
                      <button
                        onClick={() => handleEditExpense(expense)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Edit expense"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Delete expense"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const displayCategoryBreakdownUI = () => {
    const categoryTotals = getExpensesByCategory();
    const hasExpenses = Object.values(categoryTotals).some(
      (total) => total > 0
    );

    if (!hasExpenses) return null;

    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calculator className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-bold">Category Breakdown</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(categoryTotals).map(([category, total]) => {
            if (total === 0) return null;
            const percentage = ((total / getTotalExpenses()) * 100).toFixed(1);

            return (
              <div key={category} className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">{category}</div>
                <div className="text-lg font-bold">
                  ₹{total.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">{percentage}%</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const displayBalanceSummaryUI = () => {
    if (users.length === 0) return null;

    const balances = calculateBalances();

    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-bold">Balance Summary</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {users.map((user) => {
            const balance = balances[user];
            const isPositive = balance > 0.01;
            const isNegative = balance < -0.01;

            return (
              <div
                key={user}
                className={`p-4 rounded-lg border-2 ${
                  isPositive
                    ? "border-green-200 bg-green-50"
                    : isNegative
                    ? "border-red-200 bg-red-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold text-lg">{user}</div>
                  <div
                    className={`text-2xl font-bold ${
                      isPositive
                        ? "text-green-600"
                        : isNegative
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {isPositive ? "+" : ""}₹{Math.abs(balance).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {isPositive ? "Gets back" : isNegative ? "Owes" : "Settled"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const displaySettlementsUI = () => {
    if (users.length === 0) return null;

    const settlements = calculateSettlements();

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calculator className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-bold">Final Settlements</h2>
        </div>

        {settlements.length === 0 ? (
          <div className="text-center py-8 text-green-600">
            <Calculator className="h-12 w-12 mx-auto mb-3" />
            <p className="text-lg font-semibold">All settled! 🎉</p>
            <p className="text-sm text-gray-600">No one owes anyone money</p>
          </div>
        ) : (
          <div className="space-y-3">
            {settlements.map((settlement, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <span className="font-semibold text-yellow-800">
                      {settlement.from}
                    </span>
                    <span className="text-gray-600"> pays </span>
                    <span className="font-semibold text-yellow-800">
                      {settlement.to}
                    </span>
                  </div>
                </div>
                <div className="text-xl font-bold text-yellow-700">
                  ₹{settlement.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const displayFooterUI = () => (
    <div className="mt-8 text-center text-gray-500 text-sm">
      <p>
        Generated by RJ Expense Splitter • {new Date().toLocaleDateString()}
      </p>
      <p className="mt-1">Split expenses fairly and transparently</p>
    </div>
  );

  // return <>{renderDownloadButton()}</>;
  // Show user management if no users exist
  if (users.length === 0 && !showUserManagement) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-md mx-auto mt-20">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold mb-2">
              Welcome to RJ Expense Splitter
            </h2>
            <p className="text-gray-600 mb-6">
              Add at least 2 users to start tracking and splitting expenses
            </p>
            <button
              onClick={() => setShowUserManagement(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Add Users
            </button>
          </div>
        </div>
        {displayUserManagementUI()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {displayHeaderUI()}
        {displayActionButtonsUI()}
        {displayUserManagementUI()}
        {displayAddExpenseFormUI()}
        {displayExpenseListUI()}
        {displayCategoryBreakdownUI()}
        {displayBalanceSummaryUI()}
        {displaySettlementsUI()}
        {displayFooterUI()}
      </div>
    </div>
  );
}
