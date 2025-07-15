import { doPOST } from "../utils/HttpUtils";
import { doGET } from "../utils/HttpUtils";

export interface IWeeklyTarget {
  userId?: string;
  startDate: string;
  endDate: string;
  year?: number;
  weekNumber?: number;
  appointmentRate?: number;
  showRate?: number;
  closeRate?: number;
  com?: number;
  revenue?: number;
  avgJobSize?: number;
  queryType: string;
}


export const upsertTarget = async (targetData: IWeeklyTarget) => {
  try {
    const response = await doPOST('/targets/upsert', targetData);
    if (response.status === 200) {
      return response.data;
    }
    return response;
  } catch (error) {
    console.error("Error upserting target:", error);
    throw error;
  }
};

export const getTargets = async (userId: string, queryType?: string, startDate?: string) => {
  try {
    let url = `/targets/get?userId=${userId}`;
    if (queryType) url += `&queryType=${queryType}`;
    if (startDate) url += `&startDate=${startDate}`;
    const response = await doGET(url);
    return response;
  } catch (error) {
    console.error("Error fetching targets:", error);
    throw error;
  }
};