import { useMutation } from '@tanstack/react-query';
import {
    forgotPassword as apiForgotPassword,
    login as apiLogin,
    register as apiRegister,
    resetPassword as apiResetPassword,
} from './api';
import { useAuthStore } from './store';
import type {
    Credentials,
    ForgotPasswordData,
    LoginResponse,
    RegisterData,
    RegisterResponse,
    ResetPasswordData,
} from "./types.ts";

export const useLogin = () => {
    const setToken = useAuthStore((state) => state.setToken);

    return useMutation<LoginResponse, Error, Credentials>({
        mutationFn: (credentials) => apiLogin(credentials),
        onSuccess: (data) => {
            setToken(data.accessToken);
            localStorage.setItem('accessToken', data.accessToken);
        },
        onError: (err) => console.error(err),
    });
};

export const useRegister = () => {
    return useMutation<RegisterResponse, Error, RegisterData>({
        mutationFn: (credentials) => apiRegister(credentials),
        onSuccess: (data) => {
            console.log('Registration successful:', data.message);
        },
        onError: (err) => console.error(err),
    });
};

export const useForgotPassword = () => {
    return useMutation<void, Error, ForgotPasswordData>({
        mutationFn: (data) => apiForgotPassword(data),
        onError: (err) => console.error(err),
    });
};

export const useResetPassword = () => {
    return useMutation<void, Error, ResetPasswordData>({
        mutationFn: (data) => apiResetPassword(data),
        onError: (err) => console.error(err),
    });
};
