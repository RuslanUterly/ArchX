import { FeedbackCategory, type FeedbackCategoryValue, FeedbackStatus, type FeedbackStatusValue } from "./api.ts";

export const categoryLabel: Record<FeedbackCategoryValue, string> = {
    [FeedbackCategory.Praise]: "Нравится",
    [FeedbackCategory.Complaint]: "Не нравится",
    [FeedbackCategory.Suggestion]: "Предложение",
};

export const statusLabel: Record<FeedbackStatusValue, string> = {
    [FeedbackStatus.New]: "Новое",
    [FeedbackStatus.InReview]: "В работе",
    [FeedbackStatus.Resolved]: "Закрыто",
};

export const adminResponsePresets = [
    "Спасибо за обратную связь — мы передали замечание команде.",
    "Уже разбираемся с этим и постараемся улучшить в ближайших обновлениях.",
    "Если появятся ещё детали или идеи — напишите в этом же разделе, это очень помогает.",
];
