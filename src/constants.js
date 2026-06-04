// Shared app-level constants.

export const accountTypes = [
  { id: "bank", label: "Bank Account" },
  { id: "cash", label: "Cash Wallet" }
];

export const defaultProfile = {
  name: "",
  phone: "",
  age: "",
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
