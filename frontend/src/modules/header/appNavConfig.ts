export type AppNavItem = {
    id: string;
    label: string;
    path: string;
    /** Показывать только авторизованным (без ограничения по ролям). */
    requireAuth?: boolean;
    allowedRoles?: readonly string[];
};

export const APP_NAV_ITEMS: readonly AppNavItem[] = [
    { id: "home", label: "Главная", path: "/" },
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
    return items.filter((item) => {
        if (item.requireAuth && !isAuthenticated) return false;
        if (item.allowedRoles?.length) {
            if (!isAuthenticated) return false;
            const normalized = roles.map((r) => r.toLowerCase());
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
