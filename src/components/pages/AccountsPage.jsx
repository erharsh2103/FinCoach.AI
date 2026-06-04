import { GlassCard, inputStyle, formatCurrency } from "../widgets/widgetShared";
import { AccountForm } from "./AccountForm";

export function AccountsPage({
  accounts,
  transactions,
  totalBalance,
  filteredTransactions,
  onEditAccount,
  onDeleteAccount,
  onSaveAccount,
  accountModal,
  setAccountModal,
  transferState,
  setTransferState,
  onTransfer,
  pdfFilter,
  setPdfFilter,
  exportRef,
  onExportPDF,
  statusMessage
}) {
  const accountName = id => accounts.find(account => account.id === id)?.name || "Deleted account";
  return (
    <div style={{ color: "var(--text)", fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "800" }}>Your Accounts</h1>
          <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: "14px" }}>
            Combined balance: <strong style={{ color: "var(--text)" }}>{formatCurrency(totalBalance)}</strong>
          </p>
        </div>
        <button onClick={() => setAccountModal({ open: true, account: null })} style={{
          background: "linear-gradient(135deg, var(--primary), var(--accent))", border: "none",
          color: "#fff", padding: "12px 20px", borderRadius: "12px", cursor: "pointer",
          fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px"
        }}>➕ Add Account</button>
      </div>

      {statusMessage && (
        <GlassCard style={{ padding: "12px 14px", marginBottom: "16px", color: "#FBBF24", fontSize: "13px" }}>
          {statusMessage}
        </GlassCard>
      )}

      <GlassCard style={{ padding: "20px", marginBottom: "20px", background: "linear-gradient(135deg, rgba(15,185,129,0.18), rgba(52,211,158,0.16))" }}>
        <p style={{ margin: "0 0 6px", color: "var(--muted)", fontSize: "13px" }}>Total Balance</p>
        <div style={{ fontSize: "32px", fontWeight: "800", color: "var(--text)" }}>{formatCurrency(totalBalance)}</div>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "12px", color: "var(--muted)", fontSize: "13px" }}>
          <span>Bank: {formatCurrency(accounts.filter(account => account.type === "bank").reduce((sum, account) => sum + Number(account.balance || 0), 0))}</span>
          <span>Cash: {formatCurrency(accounts.filter(account => account.type === "cash").reduce((sum, account) => sum + Number(account.balance || 0), 0))}</span>
        </div>
      </GlassCard>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
        {accounts.map(account => (
          <GlassCard key={account.id} style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: "700" }}>{account.name}</h3>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px" }}>
                  {account.type === "bank" ? `${account.subtype} • ${account.bankName}` : "Cash Wallet"}
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => onEditAccount(account)} style={{
                  background: "rgba(15,23,42,0.08)", border: "none", borderRadius: "8px",
                  padding: "6px", cursor: "pointer", color: "var(--text)"
                }}>✏️</button>
                <button onClick={() => onDeleteAccount(account.id)} style={{
                  background: "rgba(239,68,68,0.2)", border: "none", borderRadius: "8px",
                  padding: "6px", cursor: "pointer", color: "#EF4444"
                }}>🗑️</button>
              </div>
            </div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--accent)" }}>
              {formatCurrency(account.balance)}
            </div>
            {account.type === "bank" && (
              <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: "12px" }}>
                IFSC: {account.ifsc}
              </p>
            )}
          </GlassCard>
        ))}
      </div>

      <GlassCard style={{ padding: "20px", marginTop: "20px" }}>
        <h2 style={{ margin: "0 0 16px", fontSize: "20px" }}>Transfer Money</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", alignItems: "end" }}>
          <label style={{ color: "var(--muted)", fontSize: "13px" }}>
            From
            <select value={transferState.fromId} onChange={e => setTransferState(prev => ({ ...prev, fromId: e.target.value, error: "", success: "" }))} style={{ ...inputStyle, marginTop: "8px" }}>
              <option value="">Select account</option>
              {accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
          </label>
          <label style={{ color: "var(--muted)", fontSize: "13px" }}>
            To
            <select value={transferState.toId} onChange={e => setTransferState(prev => ({ ...prev, toId: e.target.value, error: "", success: "" }))} style={{ ...inputStyle, marginTop: "8px" }}>
              <option value="">Select account</option>
              {accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
          </label>
          <label style={{ color: "var(--muted)", fontSize: "13px" }}>
            Amount
            <input inputMode="decimal" value={transferState.amount} onChange={e => setTransferState(prev => ({ ...prev, amount: e.target.value.replace(/[^\d.]/g, ""), error: "", success: "" }))} placeholder="0" style={{ ...inputStyle, marginTop: "8px" }} />
          </label>
          <button onClick={onTransfer} disabled={accounts.length < 2} style={{
            padding: "15px 18px", borderRadius: "14px", border: "none",
            background: accounts.length < 2 ? "rgba(15,23,42,0.08)" : "linear-gradient(135deg, var(--primary), var(--accent))",
            color: accounts.length < 2 ? "var(--muted)" : "#fff", cursor: accounts.length < 2 ? "default" : "pointer", fontWeight: "700"
          }}>Transfer</button>
        </div>
        {transferState.error && <p style={{ margin: "12px 0 0", color: "var(--danger)", fontSize: "13px" }}>{transferState.error}</p>}
        {transferState.success && <p style={{ margin: "12px 0 0", color: "var(--success)", fontSize: "13px" }}>{transferState.success}</p>}
      </GlassCard>

      <GlassCard style={{ padding: "20px", marginTop: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "20px" }}>PDF Financial Report</h2>
          <button onClick={onExportPDF} style={{
            background: "linear-gradient(135deg, var(--primary), var(--accent))", border: "none",
            color: "#fff", padding: "12px 18px", borderRadius: "12px", cursor: "pointer", fontWeight: "700"
          }}>Download PDF</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "18px" }}>
          <label style={{ color: "var(--muted)", fontSize: "13px" }}>
            Start Date
            <input type="date" value={pdfFilter.startDate} onChange={e => setPdfFilter(prev => ({ ...prev, startDate: e.target.value }))} style={{ ...inputStyle, marginTop: "8px" }} />
          </label>
          <label style={{ color: "var(--muted)", fontSize: "13px" }}>
            End Date
            <input type="date" value={pdfFilter.endDate} onChange={e => setPdfFilter(prev => ({ ...prev, endDate: e.target.value }))} style={{ ...inputStyle, marginTop: "8px" }} />
          </label>
          <label style={{ color: "var(--muted)", fontSize: "13px" }}>
            Account
            <select value={pdfFilter.accountId} onChange={e => setPdfFilter(prev => ({ ...prev, accountId: e.target.value }))} style={{ ...inputStyle, marginTop: "8px" }}>
              <option value="all">All accounts</option>
              {accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
          </label>
        </div>

        <div ref={exportRef} style={{ background: "var(--surface-alt)", padding: "20px", borderRadius: "12px", color: "var(--text)" }}>
          <h2 style={{ margin: "0 0 6px" }}>FinCoach Financial Report</h2>
          <p style={{ margin: "0 0 18px", color: "var(--muted)", fontSize: "13px" }}>
            Date range: {pdfFilter.startDate || "Start"} to {pdfFilter.endDate || "Today"} | Account: {pdfFilter.accountId === "all" ? "All accounts" : accountName(pdfFilter.accountId)}
          </p>
          <h3 style={{ margin: "0 0 10px" }}>Account Balances</h3>
          <div style={{ overflowX: "auto", marginBottom: "18px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "520px" }}>
              <thead>
                <tr>{["Account", "Type", "Bank Details", "Balance"].map(header => <th key={header} style={{ textAlign: "left", padding: "10px", borderBottom: "1px solid var(--border)", color: "var(--accent)" }}>{header}</th>)}</tr>
              </thead>
              <tbody>
                {accounts.map(account => (
                  <tr key={account.id}>
                    <td style={{ padding: "10px", borderBottom: "1px solid var(--surface-alt)" }}>{account.name}</td>
                    <td style={{ padding: "10px", borderBottom: "1px solid var(--surface-alt)" }}>{account.type === "bank" ? account.subtype : "cash"}</td>
                    <td style={{ padding: "10px", borderBottom: "1px solid var(--surface-alt)" }}>{account.type === "bank" ? `${account.bankName} ${account.ifsc || ""}` : "-"}</td>
                    <td style={{ padding: "10px", borderBottom: "1px solid var(--surface-alt)" }}>{formatCurrency(account.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 style={{ margin: "0 0 10px" }}>Transaction History</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "620px" }}>
              <thead>
                <tr>{["Date", "Type", "Account", "Description", "Amount"].map(header => <th key={header} style={{ textAlign: "left", padding: "10px", borderBottom: "1px solid var(--border)", color: "var(--accent)" }}>{header}</th>)}</tr>
              </thead>
              <tbody>
                {filteredTransactions.length ? filteredTransactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td style={{ padding: "10px", borderBottom: "1px solid var(--surface-alt)" }}>{transaction.date}</td>
                    <td style={{ padding: "10px", borderBottom: "1px solid var(--surface-alt)" }}>{transaction.type}</td>
                    <td style={{ padding: "10px", borderBottom: "1px solid var(--surface-alt)" }}>
                      {transaction.type === "transfer" ? `${accountName(transaction.fromId)} -> ${accountName(transaction.toId)}` : accountName(transaction.accountId)}
                    </td>
                    <td style={{ padding: "10px", borderBottom: "1px solid var(--surface-alt)" }}>{transaction.description}</td>
                    <td style={{ padding: "10px", borderBottom: "1px solid var(--surface-alt)" }}>{formatCurrency(transaction.amount)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" style={{ padding: "14px", color: "var(--muted)" }}>No transactions found for this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </GlassCard>

      {accountModal.open && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <AccountForm
            account={accountModal.account}
            onSave={onSaveAccount}
            onCancel={() => setAccountModal({ open: false, account: null })}
          />
        </div>
      )}
    </div>
  );
}
