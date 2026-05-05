const DEFAULT_UNEXPECTED_ERROR_MESSAGE =
    "Произошла непредвиденная ошибка. Попробуйте позже.";

type ValidationErrors = Record<string, string[]>;

type ProblemDetailsPayload = {
    title?: string;
    detail?: string;
    message?: string;
    errors?: ValidationErrors;
};

const formatValidationErrors = (errors: ValidationErrors): string | null => {
    const messages = Object.values(errors)
        .flat()
        .map((message) => message.trim())
        .filter(Boolean);

    if (messages.length === 0) {
        return null;
    }

    return messages.join("\n");
};

const parseProblemDetailsMessage = (payload: ProblemDetailsPayload): string | null => {
    const validationMessage = payload.errors ? formatValidationErrors(payload.errors) : null;
    if (validationMessage) {
        return validationMessage;
    }

    if (payload.detail && payload.detail.trim()) {
        return payload.detail.trim();
    }

    if (payload.message && payload.message.trim()) {
        return payload.message.trim();
    }

    if (payload.title && payload.title.trim()) {
        return payload.title.trim();
    }

    return null;
};

export const getApiErrorMessage = async (
    res: Response,
    fallbackMessage: string,
): Promise<string> => {
    if (res.status >= 500) {
        return DEFAULT_UNEXPECTED_ERROR_MESSAGE;
    }

    const contentType = res.headers.get("content-type") ?? "";
    const isJsonResponse = contentType.includes("application/json");

    if (isJsonResponse) {
        try {
            const payload = (await res.json()) as ProblemDetailsPayload;
            const message = parseProblemDetailsMessage(payload);
            return message ?? fallbackMessage;
        } catch {
            return fallbackMessage;
        }
    }

    const text = (await res.text()).trim();
    return text || fallbackMessage;
};

export const throwIfResponseNotOk = async (
    res: Response,
    fallbackMessage: string,
): Promise<void> => {
    if (res.ok) {
        return;
    }

    const message = await getApiErrorMessage(res, fallbackMessage);
    throw new Error(message);
};
