// Pure helpers for applying/reverting a transaction's effect on account balances.

export const applyTransactionToAccounts = (accounts, transaction) => {
  const amount = Number(transaction?.amount || 0);
  if (!amount) return accounts;
  if (transaction.type === "transfer") {
    return accounts.map(account => {
      if (account.id === transaction.fromId) return { ...account, balance: Number(account.balance || 0) - amount };
      if (account.id === transaction.toId) return { ...account, balance: Number(account.balance || 0) + amount };
      return account;
    });
  }
  return accounts.map(account =>
    account.id === transaction.accountId
      ? {
          ...account,
          balance: Number(account.balance || 0) + (transaction.type === "income" ? amount : -amount)
        }
      : account
  );
};

export const revertTransactionFromAccounts = (accounts, transaction) => {
  const amount = Number(transaction?.amount || 0);
  if (!amount) return accounts;
  if (transaction.type === "transfer") {
    return accounts.map(account => {
      if (account.id === transaction.fromId) return { ...account, balance: Number(account.balance || 0) + amount };
      if (account.id === transaction.toId) return { ...account, balance: Number(account.balance || 0) - amount };
      return account;
    });
  }
  return accounts.map(account =>
    account.id === transaction.accountId
      ? {
          ...account,
          balance: Number(account.balance || 0) - (transaction.type === "income" ? amount : -amount)
        }
      : account
  );
};
