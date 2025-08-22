import { doPOST, doGET, doPUT, doDELETE } from "@/utils/HttpUtils";

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
  role: string;
}

export interface UpdateUserPayload {
  userId: string;
  email?: string;
  name?: string;
}

export const createUser = async (payload: CreateUserPayload) => {
  // Always set role to USER for this admin action
  const response = await doPOST("/admin/users/upsert", payload);
  return response;
};

export const getAllUsers = async (role?: string) => {
  let url = "/admin/users/list/all";
  if (role && role !== "all") {
    url += `?role=${role.toUpperCase()}`;
  }
  const response = await doGET(url);
  return response;
};

export const updateUser = async (payload: UpdateUserPayload) => {
  const response = await doPOST("/admin/users/upsert", payload);
  return response;
};

export const deleteUser = async (userId: string) => {
  const response = await doDELETE(`/admin/users/${userId}`);
  return response;
};

export const getUserById = async (userId: string) => {
  const response = await doGET(`/admin/get/users/${userId}`);
  return response;
};