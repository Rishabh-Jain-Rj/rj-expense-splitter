"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import {
  formatDateForPDF,
  formatTimeForPDF,
  formatCurrency,
  PDF_TITLE,
  PDF_SUBTITLE,
  PDF_FOOTER_TEXT,
  PDF_FOOTER_SUBTEXT,
} from "../constants";

Font.register({
  family: "NotoSans",
  src: "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 35,
    fontFamily: "NotoSans",
  },
  // Header
  header: {
    textAlign: "center",
    marginBottom: 25,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    color: "#666666",
    marginBottom: 15,
  },
  receiptInfo: {
    fontSize: 10,
    color: "#666666",
  },
  // Divider
  divider: {
    height: 2,
    backgroundColor: "#000000",
    marginVertical: 15,
  },
  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  // Simple expense list
  expenseList: {
    marginBottom: 15,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 3,
    backgroundColor: "#f8f9fa",
  },
  expenseLeft: {
    flex: 1,
  },
  expenseRight: {
    width: "25%",
    textAlign: "right",
  },
  expenseTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 2,
  },
  expenseDetails: {
    fontSize: 8,
    color: "#666666",
  },
  expenseAmount: {
    fontSize: 11,
    fontWeight: "bold",
  },
  // Total line
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: "#000000",
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
  // Balance list
  balanceList: {
    marginBottom: 15,
  },
  balanceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 2,
    backgroundColor: "#f8f9fa",
  },
  balanceName: {
    fontSize: 11,
    fontWeight: "bold",
  },
  balanceAmount: {
    fontSize: 11,
    fontWeight: "bold",
  },
  // Settlement list
  settlementList: {
    marginBottom: 15,
  },
  settlementItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 3,
    backgroundColor: "#fff3cd",
  },
  settlementText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  settlementAmount: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#856404",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 25,
    left: 35,
    right: 35,
    textAlign: "center",
    fontSize: 8,
    color: "#666666",
  },
});

const ExpenseReceiptPDF = ({
  expenses,
  users,
  balances,
  settlements,
  generatedAt,
}) => {
  const getTotalExpenses = () =>
    expenses.reduce((total, expense) => total + expense.amount, 0);

  const getPaymentDetails = (expense) => {
    if (
      expense.paymentAmounts &&
      Object.keys(expense.paymentAmounts).length > 0
    ) {
      const validPayments = Object.entries(expense.paymentAmounts).filter(
        ([payer, amount]) => Number(amount) > 0
      );

      if (validPayments.length > 0) {
        return validPayments
          .map(
            ([payer, amount]) => `${payer}: ${formatCurrency(Number(amount))}`
          )
          .join(", ");
      }
    }
    return expense.paidBy.join(", ");
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{PDF_TITLE}</Text>
          <Text style={styles.subtitle}>{PDF_SUBTITLE}</Text>
          <Text style={styles.receiptInfo}>
            {formatDateForPDF(generatedAt)} • {formatTimeForPDF(generatedAt)}
          </Text>
          <Text style={styles.receiptInfo}>
            {users.length} participants • {expenses.length} expenses
          </Text>
        </View>
        <View style={styles.divider} />

        {/* Expenses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expenses</Text>
          <View style={styles.expenseList}>
            {expenses.length === 0 ? (
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  color: "#666666",
                  marginTop: 10,
                }}
              >
                No expenses recorded
              </Text>
            ) : (
              expenses.map((expense, index) => (
                <View key={index} style={styles.expenseItem}>
                  <View style={styles.expenseLeft}>
                    <Text style={styles.expenseTitle}>
                      {expense.description}
                    </Text>
                    <Text style={styles.expenseDetails}>
                      {formatDateForPDF(expense.date)} • {expense.category} •
                      Paid by: {getPaymentDetails(expense)}
                    </Text>
                  </View>
                  <View style={styles.expenseRight}>
                    <Text style={styles.expenseAmount}>
                      {formatCurrency(expense.amount)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
          <View style={styles.totalLine}>
            <Text>TOTAL</Text>
            <Text>{formatCurrency(getTotalExpenses())}</Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* Balances */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Individual Balances</Text>
          <View style={styles.balanceList}>
            {users.map((user) => {
              const balance = balances[user] || 0;
              const isPositive = balance > 0.01;
              const isNegative = balance < -0.01;

              return (
                <View key={user} style={styles.balanceItem}>
                  <Text style={styles.balanceName}>
                    {user}{" "}
                    {isPositive
                      ? "(gets back)"
                      : isNegative
                      ? "(owes)"
                      : "(settled)"}
                  </Text>
                  <Text
                    style={[
                      styles.balanceAmount,
                      {
                        color: isPositive
                          ? "#28a745"
                          : isNegative
                          ? "#dc3545"
                          : "#6c757d",
                      },
                    ]}
                  >
                    {isPositive ? "+" : ""}
                    {formatCurrency(Math.abs(balance))}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        <View style={styles.divider} />

        {/* Settlements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settlement Instructions</Text>
          <View style={styles.settlementList}>
            {settlements.length === 0 ? (
              <View
                style={[styles.settlementItem, { backgroundColor: "#d4edda" }]}
              >
                <Text style={[styles.settlementText, { color: "#155724" }]}>
                  ✓ All expenses are settled! No payments needed.
                </Text>
              </View>
            ) : (
              settlements.map((settlement, index) => (
                <View key={index} style={styles.settlementItem}>
                  <Text style={styles.settlementText}>
                    {index + 1}. {settlement.from} pays {settlement.to}
                  </Text>
                  <Text style={styles.settlementAmount}>
                    {formatCurrency(settlement.amount)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{PDF_FOOTER_TEXT}</Text>
          <Text>
            Receipt ID: {Date.now().toString().slice(-8)} • {PDF_FOOTER_SUBTEXT}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default ExpenseReceiptPDF;
