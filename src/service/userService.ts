import { doPOST, doGET } from "@/utils/HttpUtils";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  name?: string;
  role?: string;
}

export const createUser = async (payload: CreateUserPayload) => {
  // Always set role to USER for this admin action
  const response = await doPOST("/admin/users/upsert", { ...payload, role: "USER" });
  return response;
};

export const getAllUsers = async () => {
  const response = await doGET("/admin/users/list/all?role=USER");
  return response;
};