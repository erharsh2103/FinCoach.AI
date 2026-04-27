export const defaultProfile = {
  name: "",
  phone: "9876543210",
  age: null,
  email: "",
  city: "",
  incomeType: "",
  monthlyIncome: 0,
  riskProfile: "",
  occupation: "",
  permissions: {
    sms: false,
    bank: false,
    notifs: false
  }
};

export function createSeedWorkspace(phone = defaultProfile.phone) {
  return {
    phone,
    plan: "free",
    onboardingCompleted: false,
    profile: {
      ...defaultProfile,
      phone
    },
    accounts: [
      {
        id: "acct-1",
        name: "Savings Account",
        type: "bank",
        subtype: "savings",
        balance: 24500,
        bankName: "Axis Bank",
        ifsc: "UTIB0001234"
      },
      {
        id: "acct-2",
        name: "Cash Wallet",
        type: "cash",
        subtype: "",
        balance: 5200,
        bankName: "",
        ifsc: ""
      }
    ],
    transactions: [
      {
        id: "txn-1",
        date: "2026-02-14",
        type: "income",
        accountId: "acct-1",
        amount: 12000,
        category: "Income",
        description: "Salary credited"
      },
      {
        id: "txn-2",
        date: "2026-02-18",
        type: "expense",
        accountId: "acct-1",
        amount: 649,
        category: "Others",
        description: "Netflix subscription"
      },
      {
        id: "txn-3",
        date: "2026-02-19",
        type: "transfer",
        fromId: "acct-1",
        toId: "acct-2",
        amount: 2000,
        description: "Wallet top-up"
      }
    ],
    goals: [
      {
        id: "goal-1",
        name: "Emergency Fund",
        current: 45000,
        target: 150000,
        deadline: "2026-12-31",
        icon: "Shield"
      },
      {
        id: "goal-2",
        name: "New Laptop",
        current: 18000,
        target: 80000,
        deadline: "2026-09-30",
        icon: "Laptop"
      }
    ],
    bills: [
      {
        id: "bill-1",
        name: "Electricity Bill",
        due: "2026-04-30",
        amount: 1850,
        status: "upcoming"
      },
      {
        id: "bill-2",
        name: "Internet",
        due: "2026-05-03",
        amount: 999,
        status: "upcoming"
      },
      {
        id: "bill-3",
        name: "Credit Card",
        due: "2026-05-08",
        amount: 12450,
        status: "upcoming"
      }
    ],
    subscriptions: [
      {
        id: "sub-1",
        name: "Netflix",
        category: "Entertainment",
        amount: 649,
        cycle: "Monthly",
        status: "active"
      },
      {
        id: "sub-2",
        name: "Gym",
        category: "Health",
        amount: 800,
        cycle: "Monthly",
        status: "active"
      }
    ],
    cashPayments: [
      {
        id: "cash-1",
        date: "2026-04-20",
        name: "Tea and snacks",
        category: "Food",
        amount: 80
      }
    ]
  };
}
