import { doGET, doPOST } from "../utils/HttpUtils";

export interface IReportingData {
  userId?: string;
  startDate: string;
  endDate: string;
  [key: string]: any; // Flexible for additional fields
}

export const getReportingData = async (
  userId: string,
  startDate: string,
  endDate: string
) => {
  try {
    let url = `/getReportingData?userId=${userId}`;
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
    const response = await doPOST("/upsertReportingData", reportingData);
    if (response.status === 200) {
      return response.data;
    }
    return response;
  } catch (error) {
    console.error("Error upserting reporting data:", error);
    throw error;
  }
};
