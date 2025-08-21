import { doGET } from "@/utils/HttpUtils";
import { ConversionRate } from '@/utils/leadProcessing';

export interface GetConversionRatesPayload {
  clientId?: string;
}

export interface ConversionRateResponse {
  success: boolean;
  data: ConversionRate[];
}

export const getConversionRates = async (payload?: GetConversionRatesPayload) => {
  let url = '/leads/conversion-rates';
  const params = new URLSearchParams();
  
  if (payload?.clientId) {
    params.append('clientId', payload.clientId);
  }
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  const response = await doGET(url);
  return response;
};
