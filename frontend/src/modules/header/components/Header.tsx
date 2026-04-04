import { Burger, Button, Container, Group, Menu, Tabs, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useMemo } from "react";
import classes from "./Header.module.css";
import { ThemeToggle } from "../../../shared/components/theme/ThemeToogle.tsx";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import { useAuthStore } from "../../auth/store.ts";
import {
    APP_NAV_ITEMS,
    filterNavItemsByAccess,
    resolveActiveNavId,
} from "../appNavConfig";
import { useLocation, useNavigate } from "react-router-dom";

export const Header = () => {
    const [opened, { toggle }] = useDisclosure(false);
    const navigate = useNavigate();
    const location = useLocation();

    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const roles = useAuthStore((state) => state.roles);
    const logout = useAuthStore((state) => state.logout);
    const isAdmin = roles.some((r) => r.toLowerCase() === "admin");

    const visibleNavItems = useMemo(
        () => filterNavItemsByAccess(APP_NAV_ITEMS, isAuthenticated, roles),
        [isAuthenticated, roles],
    );

    const isAuthRoute = location.pathname.startsWith("/auth/");

    const activeNavId = resolveActiveNavId(location.pathname, visibleNavItems);
    const tabValue = visibleNavItems.some((i) => i.id === activeNavId)
        ? activeNavId
        : visibleNavItems[0]?.id ?? "home";

    const handleTabChange = (value: string | null) => {
        if (!value) return;
        const item = visibleNavItems.find((i) => i.id === value);
        if (item) navigate(item.path);
    };

    return (
        <>
            <header className={classes.header}>
                <Container size="md">
                    <div className={classes.inner}>
                        <Title
                            c={mainColor}
                            order={1}
                            onClick={() => navigate("/")}
                            style={{ cursor: "pointer" }}
                        >
                            ArchX
                        </Title>
                        <Group visibleFrom="sm" gap="xl">
                            <Group visibleFrom="sm">
                                <ThemeToggle />
                            </Group>
                            <Group>
                                {isAuthenticated ? (
                                    <Menu>
                                        <Menu.Target>
                                            <Button color={mainColor}>Аккаунт</Button>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            {!isAdmin && (
                                                <Menu.Item onClick={() => navigate("/profile")}>
                                                    Профиль
                                                </Menu.Item>
                                            )}
                                            <Menu.Item
                                                color="red"
                                                onClick={() => {
                                                    logout();
                                                    navigate("/");
                                                }}
                                            >
                                                Выйти
                                            </Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                ) : (
                                    <>
                                        <Button
                                            color={mainColor}
                                            variant="filled"
                                            onClick={() => navigate("/auth/login")}
                                        >
                                            Вход
                                        </Button>
                                        <Button
                                            color={mainColor}
                                            variant="outline"
                                            onClick={() => navigate("/auth/register")}
                                        >
                                            Регистрация
                                        </Button>
                                    </>
                                )}
                            </Group>
                        </Group>
                        <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />
                    </div>
                </Container>
                {!isAuthRoute && (
                    <Container size="md">
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            variant="outline"
                            visibleFrom="sm"
                            color={mainColor}
                            classNames={{
                                root: classes.tabs,
                                list: classes.tabsList,
                                tab: classes.tab,
                            }}
                        >
                            <Tabs.List>
                                {visibleNavItems.map((item) => (
                                    <Tabs.Tab key={item.id} value={item.id}>
                                        {item.label}
                                    </Tabs.Tab>
                                ))}
                            </Tabs.List>
                        </Tabs>
                    </Container>
                )}
            </header>
        </>
    );
};
