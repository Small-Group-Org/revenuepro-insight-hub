import { doPOST } from "../utils/HttpUtils";
import { doGET } from "../utils/HttpUtils";

export interface IWeeklyTarget {
  startDate: Date;
  endDate: Date;
  leads: number;
  queryType:string;
  revenue: number;
  avgJobSize: number;
  appointmentRate: number;
  showRate: number;
  closeRate: number;
  adSpendBudget: number;
  costPerLead: number;
  costPerEstimateSet: number;
  costPerJobBooked: number;
  userId?: string; // Add userId for upsert
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

export const getTargets = async (userId: string, queryType?: string, startDate?: Date) => {
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