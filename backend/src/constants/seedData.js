export const defaultProfile = {
  name: "",
  phone: "",
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
    accounts: [],
    transactions: [],
    goals: [],
    bills: [],
    subscriptions: [],
    cashPayments: []
  };
}
