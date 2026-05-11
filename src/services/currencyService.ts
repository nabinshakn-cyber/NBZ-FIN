export interface ExchangeRates {
  [key: string]: number;
}

export interface ExchangeRateResponse {
  base: string;
  date: string;
  time_last_updated: number;
  rates: ExchangeRates;
}

const CACHE_KEY = 'nbz_fx_rates';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function fetchLiveRates(base: string = 'AED'): Promise<ExchangeRates | null> {
  try {
    // Check cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { rates, timestamp, base: cachedBase } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION && cachedBase === base) {
        return rates;
      }
    }

    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
    if (!response.ok) throw new Error('FX Protocol Interrupt');
    
    const data: ExchangeRateResponse = await response.json();
    
    // Save to cache
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      rates: data.rates,
      timestamp: Date.now(),
      base
    }));

    return data.rates;
  } catch (error) {
    console.error('FX Fetch Failed:', error);
    return null;
  }
}

export const DEFAULT_AED_TO_INR = 22.85;

export function convertCurrency(amount: number, from: string, to: string, rates: ExchangeRates | null): number {
  if (from === to) return amount;
  
  if (!rates) {
    // Fallback to defaults
    if (from === 'AED' && to === 'INR') return amount * DEFAULT_AED_TO_INR;
    if (from === 'INR' && to === 'AED') return amount / DEFAULT_AED_TO_INR;
    return amount;
  }

  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;
  
  return (amount / fromRate) * toRate;
}
