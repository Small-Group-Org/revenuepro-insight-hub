import { doGET, doPOST } from "../utils/HttpUtils";
import { API_ENDPOINTS } from "@/utils/constant";
import { IWeeklyTarget } from "./targetService";

export interface IReportingData {
  userId?: string;
  startDate: string;
  endDate: string;
  [key: string]: any; // Flexible for additional fields
}

export interface IUserRevenue {
  totalRevenue: number;
  totalBudgetSpent: number;
  userId: string;
  userName: string;
  userEmail: string;
}

export interface IReportingResponse {
  actual: IReportingData[];
  target: IWeeklyTarget | IWeeklyTarget[]; // Target data structure - same as getTarget response
  usersBudgetAndRevenue?: IUserRevenue[]; // Revenue and budget per account (for admin view)
}

export const getReportingData = async (
  userId: string,
  startDate: string,
  endDate: string,
  queryType: string
) => {
  try {
    let url = `${API_ENDPOINTS.ACTUAL_GET}?userId=${userId}`;
    if (queryType) url += `&queryType=${queryType}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    const response = await doGET(url);
    return response;
  } catch (error) {
    console.error("Error fetching reporting data:", error);
    throw error;
  }
};

export const upsertReportingData = async (reportingData: IReportingData) => {
  try {
    const response = await doPOST(API_ENDPOINTS.ACTUAL_UPSERT, reportingData);
    if (response.status === 200) {
      return response.data;
    }
    return response;
  } catch (error) {
    console.error("Error upserting reporting data:", error);
    throw error;
  }
};

export const getAggregateReport = async (
  startDate: string,
  endDate: string,
  queryType: string
) => {
  try {
    let url = `${API_ENDPOINTS.AGGREGATE_REPORT}?queryType=${queryType}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    const response = await doGET(url);
    return response;
  } catch (error) {
    console.error("Error fetching aggregate report:", error);
    throw error;
  }
};