import {Burger, Button, Container, Group, Menu, Title} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import classes from './Header.module.css';
import { ThemeToggle } from "../../../shared/components/theme/ThemeToogle.tsx";
import {mainColor} from "../../../shared/components/theme/colors.ts";
import {useAuthStore} from "../../auth/store.ts";
import {useNavigate} from "react-router-dom";
//import {useProfileStore} from "../../profile/store.ts";

export const Header = () => {
    const [opened, { toggle }] = useDisclosure(false);
    const navigate = useNavigate();
    
    //const {user} = useProfileStore();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const logout = useAuthStore((state) => state.logout);

    return (
        <>
            <header className={classes.header}>
                <Container size="md">
                    <div className={classes.inner}>
                        <Title c={mainColor} order={1} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>ArchX</Title>
                        <Group visibleFrom="sm" gap="xl">
                            <Group visibleFrom="sm">
                                <ThemeToggle/>
                            </Group>
                            <Group>
                                {/*{isAuthenticated && user ? (*/}
                                {isAuthenticated ? (
                                    <Menu>
                                        <Menu.Target>
                                            {/*<Button color={mainColor}>{user.email}</Button>*/}
                                            <Button color={mainColor}>awd</Button>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item onClick={() => navigate("/profile")}>Профиль</Menu.Item>
                                            {/*<Menu.Item color="red" onClick={() => { logout(); useProfileStore.getState().clear(); navigate('/'); }}>*/}
                                            <Menu.Item color="red" onClick={() => { logout(); navigate('/'); }}>
                                                Выйти
                                            </Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                ) : (
                                    <>
                                        <Button color={mainColor} variant="filled" onClick={() => navigate('/auth/login')}>Вход</Button>
                                        <Button color={mainColor} variant="outline" onClick={() => navigate('/auth/register')}>Регистрация</Button>
                                    </>
                                )}
                            </Group>
                        </Group>
                        <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />
                    </div>
                </Container>
            </header>
        </>
    );
}