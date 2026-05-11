import { Transaction } from "./types";

export const MOCK_TRANSACTIONS: Transaction[] = [
  { 
    id: '1', 
    date: '2026-05-01', 
    amount: 15000, 
    currency: 'AED', 
    category: 'income', 
    description: 'Dubai Consulting Payout', 
    type: 'income',
    domain: 'business',
    merchant: 'Tech Sol Dubai',
    user_id: 'mock-user'
  },
  { 
    id: '2', 
    date: '2026-05-02', 
    amount: 4500, 
    currency: 'AED', 
    category: 'housing', 
    description: 'Marina Apartment Rent', 
    type: 'expense',
    domain: 'personal',
    user_id: 'mock-user'
  },
  { 
    id: '3', 
    date: '2026-05-04', 
    amount: 50000, 
    currency: 'INR', 
    category: 'investment', 
    description: 'India SIP Mutual Fund', 
    type: 'expense',
    domain: 'personal',
    user_id: 'mock-user'
  },
  { 
    id: '4', 
    date: '2026-05-05', 
    amount: 500, 
    currency: 'AED', 
    category: 'transport', 
    description: 'Fuel for Range Rover', 
    type: 'expense',
    domain: 'personal',
    merchant: 'ENOC',
    user_id: 'mock-user'
  },
  { 
    id: '5', 
    date: '2026-05-08', 
    amount: 2500, 
    currency: 'AED', 
    category: 'lending', 
    description: 'Lent to Rahul for business', 
    type: 'lent',
    domain: 'business',
    person: 'Rahul',
    user_id: 'mock-user'
  },
  { 
    id: '6', 
    date: '2026-05-10', 
    amount: 85, 
    currency: 'AED', 
    category: 'food', 
    description: 'Dinner at Nobu', 
    type: 'expense',
    domain: 'personal',
    merchant: 'Nobu Dubai',
    user_id: 'mock-user'
  },
];
