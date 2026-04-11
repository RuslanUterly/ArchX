import {
    APP_NAV_ITEMS,
    type AppNavItem,
    resolveActiveNavId,
} from "../../modules/header/appNavConfig.ts";

export interface SessionNavContext {
    id: string;
    label: string;
    path: string;
}

export interface SessionRouteState {
    navContext: SessionNavContext;
}

function findNavItemById(id: string, items: readonly AppNavItem[]) {
    return items.find((item) => item.id === id);
}

export function buildSessionRouteState(pathname: string): SessionRouteState {
    const navId = resolveActiveNavId(pathname, [...APP_NAV_ITEMS]);
    const navItem = findNavItemById(navId, APP_NAV_ITEMS) ?? APP_NAV_ITEMS[0];
    return {
        navContext: {
            id: navItem.id,
            label: navItem.label,
            path: navItem.path,
        },
    };
}
