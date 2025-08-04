import { doPOST, doGET, doPUT } from "@/utils/HttpUtils";
import { Lead } from "@/types";

export interface GetLeadsPayload {
  userId: string;
}

export interface UpdateLeadPayload {
  clientId: string; // userId basically
  id: string; // leadId
  estimateSet: boolean;
  unqualifiedLeadReason?: string;
}

export interface GetLeadsResponse {
  leads: Lead[];
  total: number;
}

export const getLeads = async (payload: GetLeadsPayload) => {
  const response = await doGET(`/leads?userId=${payload.userId}`);
  return response;
};

export const updateLead = async (payload: UpdateLeadPayload) => {
  const response = await doPUT("/leads/update", payload);
  return response;
};