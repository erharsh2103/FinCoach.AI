import { useState } from "react";
import { AccountsPage } from "./AccountsPage";
import { TransactionsPage } from "./TransactionsPage";
import { AnalyticsPage } from "./AnalyticsPage";
import { CashPaymentsPage } from "./CashPaymentsPage";
import { SimpleFeaturePages } from "./SimpleFeaturePages";
import { Bills as BillsWidget } from "../widgets/Bills";

const TABS = [
  ["accounts", "Accounts"],
  ["transactions", "Transactions"],
  ["analytics", "Analytics"],
  ["bills", "Bills"],
  ["subscriptions", "Subscriptions"],
  ["cashpayments", "Cash"]
];

// Combined money hub — renders the existing feature pages under one tab bar.
export function FinancesPage(props) {
  const [tab, setTab] = useState(props.financesTab || "accounts");

  return (
    <div style={{ color: "var(--text)", fontFamily: "system-ui" }}>
      <h1 style={{ margin: "0 0 4px", fontSize: "28px", fontWeight: 800 }}>Finances</h1>
      <p style={{ margin: "0 0 18px", color: "var(--muted)", fontSize: "14px" }}>
        Accounts, transactions, analytics, bills, subscriptions and cash — all in one place.
      </p>

      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px", marginBottom: "22px" }}>
        {TABS.map(([id, label]) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: "10px 16px", borderRadius: "999px", border: "1px solid var(--glass-border)",
              cursor: "pointer", whiteSpace: "nowrap", fontSize: "14px", fontWeight: active ? 700 : 500,
              fontFamily: "system-ui",
              background: active ? "var(--primary)" : "var(--glass-bg)",
              color: active ? "#fff" : "var(--text)",
              backdropFilter: "blur(var(--glass-blur))", WebkitBackdropFilter: "blur(var(--glass-blur))"
            }}>{label}</button>
          );
        })}
      </div>

      {tab === "accounts" && <AccountsPage {...props} />}
      {tab === "transactions" && <TransactionsPage {...props} />}
      {tab === "analytics" && <AnalyticsPage {...props} />}
      {tab === "bills" && <BillsWidget bills={props.billsData} onAddBill={props.onAddBill} onPayBill={props.onPayBill} onDeleteBill={props.onDeleteBill} />}
      {tab === "subscriptions" && <SimpleFeaturePages type="subscriptions" {...props} />}
      {tab === "cashpayments" && <CashPaymentsPage {...props} />}
    </div>
  );
}
