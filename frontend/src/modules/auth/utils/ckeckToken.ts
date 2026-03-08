import { jwtDecode } from "jwt-decode";

const ROLE_CLAIM = "role";
const ROLE_CLAIM_DOTNET =
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

interface JwtPayload {
    exp: number;
    [key: string]: unknown;
}

export const isTokenValid = (token: string) => {
    try {
        const decoded: JwtPayload = jwtDecode(token);
        return decoded.exp * 1000 > Date.now();
    } catch {
        return false;
    }
};

export const getRolesFromToken = (token: string): string[] => {
    try {
        const decoded: JwtPayload = jwtDecode(token);
        const raw =
            decoded[ROLE_CLAIM] ?? decoded[ROLE_CLAIM_DOTNET];
        if (Array.isArray(raw)) return raw.filter((r) => typeof r === "string");
        if (typeof raw === "string") return [raw];
        return [];
    } catch {
        return [];
    }
};
