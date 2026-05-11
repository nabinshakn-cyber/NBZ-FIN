
export type Currency = 'AED' | 'INR';
export type FinType = 'income' | 'expense' | 'lent' | 'borrowed' | 'transfer';
export type Domain = 'personal' | 'business';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  currency: Currency;
  category: string;
  description: string;
  type: FinType;
  merchant?: string;
  person?: string;
  payment_method?: string;
  domain: Domain;
  ledger_type?: string;
  ai_suggestion?: string;
  user_id?: string;
}

export interface Budget {
  category: string;
  limit: number;
  spent: number;
  currency: Currency;
}

export interface Account {
  id: string;
  user_id: string;
  bankName: string;
  balance: number;
  currency: Currency;
  type: 'bank' | 'cash' | 'card';
  location: 'UAE' | 'India' | 'Cash';
}

export type View = 'dashboard' | 'transactions' | 'ledger' | 'wallet' | 'ai-advisor' | 'savings' | 'settings';
