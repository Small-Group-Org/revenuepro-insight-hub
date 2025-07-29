import { doGET, doPOST } from "../utils/HttpUtils";
import { IWeeklyTarget } from "./targetService";

export interface IReportingData {
  userId?: string;
  startDate: string;
  endDate: string;
  [key: string]: any; // Flexible for additional fields
}

export interface IReportingResponse {
  actual: IReportingData[];
  target: IWeeklyTarget | IWeeklyTarget[]; // Target data structure - same as getTarget response
}

export const getReportingData = async (
  userId: string,
  startDate: string,
  endDate: string,
  queryType: string
) => {
  try {
    let url = `/actual/get?userId=${userId}`;
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
    const response = await doPOST("/actual/upsert", reportingData);
    if (response.status === 200) {
      return response.data;
    }
    return response;
  } catch (error) {
    console.error("Error upserting reporting data:", error);
    throw error;
  }
};
