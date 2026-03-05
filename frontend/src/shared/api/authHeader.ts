import {useAuthStore} from "../../modules/auth/store.ts";

export const authHeader = () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) throw new Error("No access token found");
    return { Authorization: `Bearer ${token}` };
};