import { doGET, doPATCH } from "@/utils/HttpUtils";
import { Lead } from "@/types";

export interface GetLeadsPayload {
  clientId?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateLeadPayload {
  _id: string;
  status: 'new' | 'in_progress' | 'estimate_set' | 'unqualified';
  unqualifiedLeadReason?: string;
}

export interface GetLeadsResponse {
  success: boolean;
  data: Lead[];
}

export interface UpdateLeadResponse {
  success: boolean;
  data: Lead;
}

export const getLeads = async (payload?: GetLeadsPayload) => {
  let url = '/leads';
  const params = new URLSearchParams();
  
  if (payload?.clientId) {
    params.append('clientId', payload.clientId);
  }
  if (payload?.startDate) {
    params.append('startDate', payload.startDate);
  }
  if (payload?.endDate) {
    params.append('endDate', payload.endDate);
  }
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  const response = await doGET(url);
  return response;
};

export const updateLead = async (payload: UpdateLeadPayload) => {
  const response = await doPATCH("/leads", payload);
  return response;
};