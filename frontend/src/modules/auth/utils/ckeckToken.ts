import { jwtDecode } from "jwt-decode";

interface JwtPayload {
    exp: number;
}

export const isTokenValid = (token: string) => {
    try {
        const decoded: JwtPayload = jwtDecode(token);
        return decoded.exp * 1000 > Date.now();
    } catch {
        return false;
    }
};
