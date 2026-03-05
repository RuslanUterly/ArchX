import { useMutation } from '@tanstack/react-query';
import { login as apiLogin, register as apiRegister } from './api';
import { useAuthStore } from './store';
import type {Credentials, LoginResponse, RegisterResponse} from "./types.ts";
//import {useProfileStore} from "../profile/store.ts";

export const useLogin = () => {
    const setToken = useAuthStore((state) => state.setToken);
    //const fetchProfile = useProfileStore((state) => state.fetchProfile);

    return useMutation<LoginResponse, Error, Credentials>({
        mutationFn: (credentials) => apiLogin(credentials),
        onSuccess: async (data) => {
            setToken(data.accessToken);
            localStorage.setItem('accessToken', data.accessToken);

            //try {
            //    await fetchProfile();
            //} catch (err) {
            //    console.error('Ошибка загрузки профиля:', err);
            //}

        },
        onError: (err) => console.error(err),
    });
};

export const useRegister = () => {
    return useMutation<RegisterResponse, Error, Credentials>({
        mutationFn: (credentials) => apiRegister(credentials),
        onSuccess: (data) => {
            console.log('Registration successful:', data.message);
        },
        onError: (err) => console.error(err),
    });
};
