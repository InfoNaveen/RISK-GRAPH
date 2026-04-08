export interface PricePoint {
  date: string;
  close: number;
  volume: number;
  high: number;
  low: number;
}

export interface AssetData {
  symbol: string;
  source: 'live' | 'synthetic';
  prices: PricePoint[];
}

export const SYMBOLS: readonly string[] = [
  'RELIANCE.BSE',
  'TCS.BSE',
  'HDFCBANK.BSE',
  'INFY.BSE',
  'ICICIBANK.BSE',
  'AXISBANK.BSE',
  'SBIN.BSE',
  'WIPRO.BSE',
  'LT.BSE',
  'MARUTI.BSE',
] as const;

interface AlphaVantageDaily {
  [date: string]: {
    '1. open': string;
    '2. high': string;
    '3. low': string;
    '4. close': string;
    '5. volume': string;
  };
}

interface AlphaVantageResponse {
  'Time Series (Daily)'?: AlphaVantageDaily;
  Note?: string;
  'Error Message'?: string;
}

async function fetchSymbol(symbol: string): Promise<AssetData> {
  const apiKey = process.env.ALPHA_VANTAGE_KEY || '';
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=full&apikey=${apiKey}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });

  if (!res.ok) {
    return { symbol, source: 'synthetic', prices: [] };
  }

  const json: AlphaVantageResponse = await res.json();
  const timeSeries = json['Time Series (Daily)'];

  if (!timeSeries) {
    return { symbol, source: 'synthetic', prices: [] };
  }

  const allDates = Object.keys(timeSeries).sort();
  const last252 = allDates.slice(-252);

  const prices: PricePoint[] = last252.map((date) => {
    const entry = timeSeries[date];
    return {
      date,
      close: parseFloat(entry['4. close']) || 0,
      volume: parseFloat(entry['5. volume']) || 0,
      high: parseFloat(entry['2. high']) || 0,
      low: parseFloat(entry['3. low']) || 0,
    };
  });

  return { symbol, source: 'live', prices };
}

export async function fetchAllAssets(): Promise<AssetData[]> {
  const results = await Promise.allSettled(
    SYMBOLS.map((symbol) => fetchSymbol(symbol))
  );

  return results.map((result, idx) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      symbol: SYMBOLS[idx],
      source: 'synthetic' as const,
      prices: [],
    };
  });
}
