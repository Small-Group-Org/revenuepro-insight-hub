import { doGET, doPOST } from "@/utils/HttpUtils";

export const verifyToken = async (accessToken: string, refreshToken:string) => {
    try {
        const response = await doPOST(`/auth/verify-token`, {
            accessToken,
            refreshToken
        });
        if (response.status === 200) {
            return response.data;
        } else {
            return response;
        }
    } catch (error) {
        console.error("Error verifying token:", error);
        return null;
    }
}