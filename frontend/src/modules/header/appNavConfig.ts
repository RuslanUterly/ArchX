export type AppNavItem = {
    id: string;
    label: string;
    path: string;
    /** Показывать только авторизованным (без ограничения по ролям). */
    requireAuth?: boolean;
    allowedRoles?: readonly string[];
    /** Скрыть, если у пользователя есть одна из этих ролей (регистр не важен). */
    deniedRoles?: readonly string[];
};

export const APP_NAV_ITEMS: readonly AppNavItem[] = [
    { id: "home", label: "Главная", path: "/" },
    {
        id: "results",
        label: "Результаты",
        path: "/results",
        requireAuth: true,
        deniedRoles: ["Admin"],
    },
    {
        id: "statistics",
        label: "Статистика",
        path: "/statistics",
        requireAuth: true,
    },
    {
        id: "feedback",
        label: "Обратная связь",
        path: "/feedback",
        requireAuth: true,
    },
    {
        id: "editor",
        label: "Редактор деревьев",
        path: "/decision-tree/editor",
        allowedRoles: ["Admin"],
    },
];

export function filterNavItemsByAccess(
    items: readonly AppNavItem[],
    isAuthenticated: boolean,
    roles: string[],
): AppNavItem[] {
    const normalized = roles.map((r) => r.toLowerCase());

    return items.filter((item) => {
        if (item.requireAuth && !isAuthenticated) return false;
        if (item.deniedRoles?.length && isAuthenticated) {
            const blocked = item.deniedRoles.some((r) =>
                normalized.includes(r.toLowerCase()),
            );
            if (blocked) return false;
        }
        if (item.allowedRoles?.length) {
            if (!isAuthenticated) return false;
            return item.allowedRoles.some((r) => normalized.includes(r.toLowerCase()));
        }
        return true;
    });
}

export function resolveActiveNavId(pathname: string, visibleItems: AppNavItem[]): string {
    const nonRoot = visibleItems
        .filter((i) => i.path !== "/")
        .sort((a, b) => b.path.length - a.path.length);

    for (const item of nonRoot) {
        if (pathname === item.path || pathname.startsWith(`${item.path}/`)) {
            return item.id;
        }
    }

    const home = visibleItems.find((i) => i.path === "/");
    return home?.id ?? visibleItems[0]?.id ?? "home";
}
