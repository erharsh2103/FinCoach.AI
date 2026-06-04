import { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

import { apiRequest } from "./api/api";
import { applyTransactionToAccounts, revertTransactionFromAccounts } from "./utils/accounts";
import { loadRazorpayScript } from "./utils/razorpay";
import { defaultProfile } from "./constants";

import { formatCurrency } from "./components/widgets/widgetShared";
import { FloatingBg } from "./components/layout/FloatingBg";
import { MobileHeader } from "./components/layout/MobileHeader";
import { BottomNav } from "./components/layout/BottomNav";
import { SideNav } from "./components/layout/SideNav";

import PhoneAuth from "./components/auth/PhoneAuth";
import { SurveyOnboardingPage } from "./components/onboarding/SurveyOnboardingPage";

import { AccountsPage } from "./components/pages/AccountsPage";
import { FinancesPage } from "./components/pages/FinancesPage";
import { ProfilePage } from "./components/pages/ProfilePage";
import { TransactionsPage } from "./components/pages/TransactionsPage";
import { AnalyticsPage } from "./components/pages/AnalyticsPage";
import { NetWorthPage } from "./components/pages/NetWorthPage";
import { SmartInsightsPage } from "./components/pages/SmartInsightsPage";
import { CashPaymentsPage } from "./components/pages/CashPaymentsPage";
import { SimpleFeaturePages } from "./components/pages/SimpleFeaturePages";
import { MorePage } from "./components/pages/MorePage";
import { AICoach } from "./components/pages/AICoach";
import { Calculator } from "./components/pages/Calculator";

import { Dashboard as DashboardWidget } from "./components/widgets/Dashboard";
import { Bills as BillsWidget } from "./components/widgets/Bills";
import { GoalsScreen as GoalsScreenWidget } from "./components/widgets/GoalsScreen";
import { BudgetPlanner as BudgetPlannerWidget } from "./components/widgets/BudgetPlanner";
import { InvestmentAdvisor as InvestmentAdvisorWidget } from "./components/widgets/InvestmentAdvisor";
import { Copilot as CopilotWidget } from "./components/widgets/Copilot";
import { FinancialAI as FinancialAIWidget } from "./components/widgets/FinancialAI";

// ─── APP SHELL ─────────────────────────────────────────────────────────────
export default function App() {
  const [authState, setAuthState] = useState("login"); // login | onboarding | app
  const [page, setPage] = useState("dashboard");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [profile, setProfile] = useState(defaultProfile);
  const [plan, setPlan] = useState("free");
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [goalsData, setGoalsData] = useState([]);
  const [billsData, setBillsData] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [cashPayments, setCashPayments] = useState([]);
  const [accountModal, setAccountModal] = useState({ open: false, account: null });
  const [transferState, setTransferState] = useState({ fromId: "", toId: "", amount: "", error: "", success: "" });
  const [pdfFilter, setPdfFilter] = useState({ startDate: "", endDate: "", accountId: "all" });
  const [statusMessage, setStatusMessage] = useState("");
  const [paymentLoadingPlan, setPaymentLoadingPlan] = useState("");
  const exportRef = useRef(null);

  const resetSession = message => {
    localStorage.removeItem("fincoach_token");
    setAuthState("login");
    setStatusMessage(message || "");
  };

  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);

  const filteredTransactions = transactions.filter(transaction => {
    if (pdfFilter.accountId !== "all") {
      const belongsToAccount = transaction.accountId === pdfFilter.accountId || transaction.fromId === pdfFilter.accountId || transaction.toId === pdfFilter.accountId;
      if (!belongsToAccount) return false;
    }
    if (pdfFilter.startDate && transaction.date < pdfFilter.startDate) return false;
    if (pdfFilter.endDate && transaction.date > pdfFilter.endDate) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const handleSaveAccount = async account => {
    try {
      const saved = account.id
        ? await apiRequest(`/api/accounts/${encodeURIComponent(account.id)}`, { method: "PUT", body: JSON.stringify(account) })
        : await apiRequest("/api/accounts", { method: "POST", body: JSON.stringify(account) });
      setAccounts(items => account.id
        ? items.map(item => item.id === account.id ? saved.account : item)
        : [...items, saved.account]
      );
      setStatusMessage("");
      setAccountModal({ open: false, account: null });
    } catch (error) {
      setStatusMessage(`Backend unavailable, saved locally only. ${error.message}`);
      if (account.id) {
        setAccounts(items => items.map(item => item.id === account.id ? { ...item, ...account } : item));
      } else {
        setAccounts(items => [...items, { ...account, id: `acct-${Date.now()}` }]);
      }
      setAccountModal({ open: false, account: null });
    }
  };

  const handleDeleteAccount = async id => {
    const applyDelete = () => {
      setAccounts(items => items.filter(item => item.id !== id));
      setTransactions(items => items.map(tx => {
      if (tx.accountId === id) return { ...tx, accountId: "deleted" };
      if (tx.fromId === id) return { ...tx, fromId: "deleted" };
      if (tx.toId === id) return { ...tx, toId: "deleted" };
      return tx;
      }));
      setTransferState(prev => ({ ...prev, fromId: prev.fromId === id ? "" : prev.fromId, toId: prev.toId === id ? "" : prev.toId }));
    };
    try {
      const result = await apiRequest(`/api/accounts/${encodeURIComponent(id)}`, { method: "DELETE" });
      setAccounts(result.accounts);
      setTransactions(result.transactions);
      setStatusMessage("");
    } catch (error) {
      setStatusMessage(`Backend unavailable, deleted locally only. ${error.message}`);
      applyDelete();
    }
  };

  const handleSaveProfile = async nextProfile => {
    try {
      const result = await apiRequest("/api/profile", {
        method: "PUT",
        body: JSON.stringify(nextProfile)
      });
      setProfile(result.profile);
      setStatusMessage("");
    } catch (error) {
      if (error.status === 401) {
        resetSession("Your session expired. Please log in again.");
        return;
      }
      setProfile(nextProfile);
      setStatusMessage(`Backend unavailable, profile saved locally only. ${error.message}`);
    }
  };

  const handleCompleteOnboarding = async surveyProfile => {
    const payload = {
      ...profile,
      ...surveyProfile,
      phone: String(profile?.phone || "").replace(/\D/g, "").slice(0, 10),
      email: String(profile?.email || "").trim(),
      onboardingCompleted: true
    };

    try {
      const result = await apiRequest("/api/profile", {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      setProfile(result.profile);
      setStatusMessage("");
      setAuthState("app");
    } catch (error) {
      if (error.status === 401) {
        resetSession("Please log in to continue.");
        throw error;
      }
      throw error;
    }
  };

  const handleAddTransaction = async transaction => {
    if (!transaction.description?.trim()) throw new Error("Transaction description is required.");
    const amount = Number(transaction.amount);
    if (!amount || amount <= 0) throw new Error("Enter a valid amount.");
    try {
      const result = await apiRequest("/api/transactions", { method: "POST", body: JSON.stringify(transaction) });
      setAccounts(result.accounts);
      setTransactions(result.transactions);
      setStatusMessage("");
    } catch (error) {
      const local = { ...transaction, id: `txn-${Date.now()}`, amount, category: transaction.category || "Others" };
      setTransactions(items => [local, ...items]);
      setAccounts(items => applyTransactionToAccounts(items, local));
      setStatusMessage(`Backend unavailable, transaction saved locally only. ${error.message}`);
    }
  };

  const handleDeleteTransaction = async id => {
    const transactionToDelete = transactions.find(item => item.id === id);
    try {
      const result = await apiRequest(`/api/transactions/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (result.accounts) setAccounts(result.accounts);
      else if (transactionToDelete) setAccounts(items => revertTransactionFromAccounts(items, transactionToDelete));
      setTransactions(Array.isArray(result.transactions) ? result.transactions : transactions.filter(item => item.id !== id));
      setStatusMessage("");
    } catch (error) {
      if (transactionToDelete) setAccounts(items => revertTransactionFromAccounts(items, transactionToDelete));
      setTransactions(items => items.filter(item => item.id !== id));
      setStatusMessage(`Backend unavailable, transaction deleted locally only. ${error.message}`);
    }
  };

  const handleAddGoal = async goal => {
    try {
      const result = await apiRequest("/api/goals", { method: "POST", body: JSON.stringify(goal) });
      setGoalsData(result.goals);
      setStatusMessage("");
    } catch (error) {
      setGoalsData(items => [...items, { ...goal, id: `goal-${Date.now()}`, current: Number(goal.current || 0), target: Number(goal.target || 0) }]);
      setStatusMessage(`Backend unavailable, goal saved locally only. ${error.message}`);
    }
  };

  const handleFundGoal = async (id, amount) => {
    try {
      const result = await apiRequest(`/api/goals/${encodeURIComponent(id)}/fund`, { method: "PUT", body: JSON.stringify({ amount }) });
      setGoalsData(result.goals);
      setStatusMessage("");
    } catch (error) {
      const value = Number(amount || 0);
      setGoalsData(items => items.map(goal => goal.id === id ? { ...goal, current: Math.min(goal.target, Number(goal.current || 0) + value) } : goal));
      setStatusMessage(`Backend unavailable, goal funded locally only. ${error.message}`);
    }
  };

  const handleDeleteGoal = async id => {
    try {
      const result = await apiRequest(`/api/goals/${encodeURIComponent(id)}`, { method: "DELETE" });
      setGoalsData(result.goals);
      setStatusMessage("");
    } catch (error) {
      setGoalsData(items => items.filter(item => item.id !== id));
      setStatusMessage(`Backend unavailable, goal deleted locally only. ${error.message}`);
    }
  };

  const handleAddBill = async bill => {
    try {
      const result = await apiRequest("/api/bills", { method: "POST", body: JSON.stringify(bill) });
      setBillsData(result.bills);
      setStatusMessage("");
    } catch (error) {
      setBillsData(items => [...items, { ...bill, id: `bill-${Date.now()}`, amount: Number(bill.amount || 0) }]);
      setStatusMessage(`Backend unavailable, bill saved locally only. ${error.message}`);
    }
  };

  const handlePayBill = async id => {
    try {
      const result = await apiRequest(`/api/bills/${encodeURIComponent(id)}/pay`, { method: "PUT" });
      setBillsData(result.bills);
      setStatusMessage("");
    } catch (error) {
      setBillsData(items => items.map(bill => bill.id === id ? { ...bill, status: "paid" } : bill));
      setStatusMessage(`Backend unavailable, bill updated locally only. ${error.message}`);
    }
  };

  const handleDeleteBill = async id => {
    try {
      const result = await apiRequest(`/api/bills/${encodeURIComponent(id)}`, { method: "DELETE" });
      setBillsData(result.bills);
      setStatusMessage("");
    } catch (error) {
      setBillsData(items => items.filter(item => item.id !== id));
      setStatusMessage(`Backend unavailable, bill deleted locally only. ${error.message}`);
    }
  };

  const handleAddCashPayment = async payment => {
    try {
      const result = await apiRequest("/api/cash-payments", { method: "POST", body: JSON.stringify(payment) });
      setCashPayments(result.cashPayments);
      setAccounts(result.accounts);
      setTransactions(result.transactions);
      setStatusMessage("");
    } catch (error) {
      setCashPayments(items => [{ ...payment, id: `cash-${Date.now()}`, amount: Number(payment.amount || 0) }, ...items]);
      setStatusMessage(`Backend unavailable, cash payment saved locally only. ${error.message}`);
    }
  };

  const handleChangePlan = async nextPlan => {
    if (nextPlan === plan) return;

    if (nextPlan === "free") {
      try {
        const result = await apiRequest("/api/plan", { method: "PUT", body: JSON.stringify({ plan: nextPlan }) });
        setPlan(result.plan);
        setStatusMessage("Plan updated to Free.");
      } catch (error) {
        setPlan(nextPlan);
        setStatusMessage(`Backend unavailable, plan changed locally only. ${error.message}`);
      }
      return;
    }

    setPaymentLoadingPlan(nextPlan);
    try {
      const razorpayReady = await loadRazorpayScript();
      if (!razorpayReady) {
        throw new Error("Razorpay checkout failed to load.");
      }

      const orderResponse = await apiRequest("/api/payments/create-order", {
        method: "POST",
        body: JSON.stringify({ plan: nextPlan })
      });

      const paymentResult = await new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: orderResponse.key,
          amount: orderResponse.order.amount,
          currency: orderResponse.order.currency,
          name: "FinCoach.AI",
          description: `${orderResponse.plan.name} plan subscription`,
          order_id: orderResponse.order.id,
          prefill: {
            name: profile?.name || "",
            email: profile?.email || "",
            contact: profile?.phone || ""
          },
          notes: orderResponse.order.notes,
          theme: {
            color: "#0FB981" // Razorpay needs a literal hex, not a CSS variable (matches --primary)
          },
          handler: async response => {
            try {
              const verification = await apiRequest("/api/payments/verify", {
                method: "POST",
                body: JSON.stringify({
                  plan: nextPlan,
                  ...response
                })
              });
              resolve(verification);
            } catch (error) {
              reject(error);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment was cancelled before completion."))
          }
        });

        razorpay.open();
      });

      setPlan(paymentResult.plan);
      setStatusMessage(`${orderResponse.plan.name} plan activated successfully.`);
    } catch (error) {
      setStatusMessage(error.message || "Unable to complete plan upgrade.");
    } finally {
      setPaymentLoadingPlan("");
    }
  };

  const handleTransfer = async (override = null) => {
    const amount = Number(override ? override.amount : transferState.amount);
    const fromId = override ? override.fromId : transferState.fromId;
    const toId = override ? override.toId : transferState.toId;
    const fail = message => {
      if (!override) setTransferState(prev => ({ ...prev, error: message, success: "" }));
      return { ok: false, message };
    };
    if (!fromId || !toId || fromId === toId) return fail("Pick two different accounts for transfer.");
    if (!amount || amount <= 0) return fail("Enter a valid transfer amount.");
    const source = accounts.find(acc => acc.id === fromId);
    const destination = accounts.find(acc => acc.id === toId);
    if (!source || !destination) return fail("Select valid accounts.");
    if (source.balance < amount) return fail("Insufficient funds in the source account.");
    const localTransaction = {
      id: `txn-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      type: "transfer",
      fromId: source.id,
      toId: destination.id,
      amount,
      description: `Transfer to ${destination.name}`
    };
    try {
      const result = await apiRequest("/api/transfers", {
        method: "POST",
        body: JSON.stringify({ fromId: source.id, toId: destination.id, amount })
      });
      setAccounts(result.accounts);
      setTransactions(result.transactions);
      setStatusMessage("");
    } catch (error) {
      setStatusMessage(`Backend unavailable, transfer saved locally only. ${error.message}`);
      setAccounts(items => items.map(account => {
        if (account.id === source.id) return { ...account, balance: account.balance - amount };
        if (account.id === destination.id) return { ...account, balance: account.balance + amount };
        return account;
      }));
      setTransactions(items => [localTransaction, ...items]);
    }
    const message = `Transferred ${formatCurrency(amount)} from ${source.name} to ${destination.name}.`;
    if (!override) setTransferState(prev => ({ ...prev, error: "", success: message, amount: "" }));
    return { ok: true, message };
  };

  const handleExportPDF = async () => {
    if (!exportRef.current) return;
    try {
      const canvas = await html2canvas(exportRef.current, { backgroundColor: "var(--surface-alt)", scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`FinCoach-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (authState === "login") return undefined;

    let active = true;
    apiRequest("/api/finance")
      .then(data => {
        if (!active) return;
        setProfile(data.profile || defaultProfile);
        setPlan(data.plan || "free");
        setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
        setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
        setGoalsData(Array.isArray(data.goals) ? data.goals : []);
        setBillsData(Array.isArray(data.bills) ? data.bills : []);
        setSubscriptions(Array.isArray(data.subscriptions) ? data.subscriptions : []);
        setCashPayments(Array.isArray(data.cashPayments) ? data.cashPayments : []);
        setStatusMessage("");
      })
      .catch(error => {
        if (!active) return;
        if (error.status === 401) {
          resetSession("Please log in to continue.");
          return;
        }
        setStatusMessage(`Unable to load your data. ${error.message}`);
      });
    return () => {
      active = false;
    };
  }, [authState]);

  if (authState === "login") return <PhoneAuth onLogin={result => {
    if (result?.profile) setProfile(result.profile);
    const completed = Boolean(result?.onboardingCompleted);
    setAuthState(completed ? "app" : "onboarding");
  }} />;
  if (authState === "onboarding") return <SurveyOnboardingPage initialProfile={profile} onDone={handleCompleteOnboarding} />;

  const dashboardProps = {
    profile,
    onSaveProfile: handleSaveProfile,
    setPage,
    plan,
    onChangePlan: handleChangePlan,
    paymentLoadingPlan,
    accounts,
    totalBalance,
    transactions,
    setTransactions,
    filteredTransactions,
    onAddTransaction: handleAddTransaction,
    onDeleteTransaction: handleDeleteTransaction,
    goalsData,
    onAddGoal: handleAddGoal,
    onFundGoal: handleFundGoal,
    onDeleteGoal: handleDeleteGoal,
    billsData,
    onAddBill: handleAddBill,
    onPayBill: handlePayBill,
    onDeleteBill: handleDeleteBill,
    subscriptions,
    cashPayments,
    onAddCashPayment: handleAddCashPayment,
    accountModal,
    setAccountModal,
    onEditAccount: account => setAccountModal({ open: true, account }),
    onDeleteAccount: handleDeleteAccount,
    onSaveAccount: handleSaveAccount,
    transferState,
    setTransferState,
    onTransfer: handleTransfer,
    pdfFilter,
    setPdfFilter,
    exportRef,
    onExportPDF: handleExportPDF,
    statusMessage
  };

  const pageMap = {
    dashboard: DashboardWidget,
    finances: FinancesPage,
    accounts: AccountsPage,
    transactions: TransactionsPage,
    analytics: AnalyticsPage,
    ai: props => <AICoach profile={props.profile} accounts={props.accounts} transactions={props.transactions} billsData={props.billsData} goalsData={props.goalsData} />,
    goals: props => <GoalsScreenWidget goals={props.goalsData} onAddGoal={props.onAddGoal} onFundGoal={props.onFundGoal} onDeleteGoal={props.onDeleteGoal} />,
    bills: props => <BillsWidget bills={props.billsData} onAddBill={props.onAddBill} onPayBill={props.onPayBill} onDeleteBill={props.onDeleteBill} />,
    networth: NetWorthPage,
    budgetplanner: props => <BudgetPlannerWidget profile={props.profile} transactions={props.transactions} />,
    investadvisor: props => <InvestmentAdvisorWidget profile={props.profile} accounts={props.accounts} transactions={props.transactions} />,
    subscriptions: props => <SimpleFeaturePages type="subscriptions" {...props} />,
    cashpayments: CashPaymentsPage,
    smartinsights: props => <SmartInsightsPage transactions={props.transactions} bills={props.billsData} goals={props.goalsData} />,
    aicopilot: props => <CopilotWidget profile={props.profile} accounts={props.accounts} transactions={props.transactions} goalsData={props.goalsData} billsData={props.billsData} onAddTransaction={props.onAddTransaction} onAddGoal={props.onAddGoal} onAddBill={props.onAddBill} onPayBill={props.onPayBill} onTransfer={props.onTransfer} />,
    financialai: props => <FinancialAIWidget profile={props.profile} accounts={props.accounts} transactions={props.transactions} goalsData={props.goalsData} billsData={props.billsData} />,
    upgradeplan: props => <SimpleFeaturePages type="upgrade" {...props} />,
    calculator: Calculator,
    more: MorePage,
    profile: ProfilePage
  };
  const PageComponent = pageMap[page] || DashboardWidget;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "system-ui" }}>
      <FloatingBg />
      {isMobile ? (
        <>
          <MobileHeader profile={profile} />
          <div style={{ padding: "16px 16px", paddingBottom: "96px", position: "relative", zIndex: 1, maxWidth: "480px", margin: "0 auto" }}>
            <PageComponent {...dashboardProps} />
          </div>
          <BottomNav page={page} setPage={setPage} />
        </>
      ) : (
        <>
          <SideNav page={page} setPage={setPage} profile={profile} onLogout={() => { resetSession(""); setPage("dashboard"); }} />
          <div style={{ marginLeft: "260px", padding: "32px", position: "relative", zIndex: 1, width: "calc(100% - 260px)", maxWidth: "none", boxSizing: "border-box" }}>
            <PageComponent {...dashboardProps} />
          </div>
        </>
      )}
    </div>
  );
}
