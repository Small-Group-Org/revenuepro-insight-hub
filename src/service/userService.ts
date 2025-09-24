import { doPOST, doGET, doPUT, doDELETE } from "@/utils/HttpUtils";
import { API_ENDPOINTS } from "@/utils/constant";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  leadSheetUrl?: string;
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

export interface UpdatePasswordPayload {
  userId: string;
  newPassword: string;
}

export const createUser = async (payload: CreateUserPayload) => {
  // Always set role to USER for this admin action
  const response = await doPOST(API_ENDPOINTS.ADMIN_USER_UPSERT, payload);
  return response;
};

export const getAllUsers = async (role?: string) => {
  let url = API_ENDPOINTS.ADMIN_USERS_LIST;
  if (role && role !== "all") {
    url += `?role=${role.toUpperCase()}`;
  }
  const response = await doGET(url);
  return response;
};

export const updateUser = async (payload: UpdateUserPayload) => {
  const response = await doPOST(API_ENDPOINTS.ADMIN_USER_UPSERT, payload);
  return response;
};

export const deleteUser = async (userId: string) => {
  const response = await doDELETE(`${API_ENDPOINTS.ADMIN_USER}/${userId}`);
  return response;
};

export const getUserById = async (userId: string) => {
  const response = await doGET(`/admin/get/users/${userId}`);
  return response;
};

export const updatePassword = async (payload: UpdatePasswordPayload) => {
  const response = await doPUT(API_ENDPOINTS.USER_UPDATE_PASSWORD, payload);
  return response;
};