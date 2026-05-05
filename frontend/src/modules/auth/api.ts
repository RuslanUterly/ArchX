import type {Credentials, LoginResponse, RegisterData, RegisterResponse} from './types';
import {baseUrl} from "../../shared/api/options.ts";
import { throwIfResponseNotOk } from "../../shared/api/httpError.ts";

const BASE_URL = baseUrl + '/api/v1/auth';

export const login = async (data: Credentials): Promise<LoginResponse> => {
    const res = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    await throwIfResponseNotOk(res, "Не удалось выполнить вход");

    const token = await res.text();
    return { accessToken: token };
};

export const register = async (data: RegisterData): Promise<RegisterResponse> => {
    const res = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    await throwIfResponseNotOk(res, "Не удалось зарегистрироваться");

    const message = await res.text();
    return { message: message };
};
