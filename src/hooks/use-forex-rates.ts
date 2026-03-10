import { useQuery } from '@tanstack/react-query';

/**
 * ExchangeRate Open API (open.er-api.com)
 * - 인증 불필요, CORS 허용, 무료
 * - https://open.er-api.com/v6/latest/USD
 * - 응답: { base_code: "USD", rates: { KRW: 1321, EUR: 0.923, JPY: 149.2, ... } }
 * - rates[ccy] = "1 USD 당 해당 통화"
 */
export interface ForexRates {
  /** 1 USD = X 통화  e.g. KRW: 1321, EUR: 0.923, JPY: 149.2 */
  rates: Record<string, number>;
  updatedAt: number;
}

async function fetchForexRates(): Promise<ForexRates> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!res.ok) throw new Error(`ExchangeRate API ${res.status}`);

  const data = await res.json();
  if (data.result !== 'success' || !data.rates) {
    throw new Error('Invalid response');
  }

  return {
    rates: data.rates as Record<string, number>,
    updatedAt: Date.now(),
  };
}

export function useForexRates() {
  return useQuery({
    queryKey: ['forex-rates'],
    queryFn: fetchForexRates,
    staleTime: 10 * 60_000,      // 10분 (환율은 분 단위 변화 미미)
    refetchInterval: 30 * 60_000, // 30분마다 갱신
    retry: 2,
  });
}
