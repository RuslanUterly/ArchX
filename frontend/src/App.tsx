import './App.css';
import { Header } from "./modules/header";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./shared/components/route/ProtectedRoute.tsx";
import LoginPage from "./modules/auth/pages/LoginPage.tsx";
import RegisterPage from "./modules/auth/pages/RegisterPage.tsx";
import { NotFoundPage } from "./shared/pages/NotFoundPage.tsx";
import LayoutCenter from "./shared/components/layout/LayoutCenter.tsx";
import HomePage from "./modules/home/pages/HomePage.tsx";
import DecisionTreePage from "./modules/architectureDecision/pages/DecisionTreePage.tsx";
import SessionDetailPage from "./modules/architectureDecision/pages/SessionDetailPage.tsx";
import DecisionTreeEditorPage from "./modules/architectureDecisionEditor/pages/DecisionTreeEditorPage.tsx";
import FeedbackPage from "./modules/feedback/pages/FeedbackPage.tsx";

function App() {

    //useEffect(() => {
    //    initProfile();
    //}, []);

    return (
        <div className="container-fill">
            <Header />

            <Routes>
                <Route
                    path="/"
                    element={
                        <LayoutCenter>
                            <HomePage />
                        </LayoutCenter>
                    }
                />

                <Route
                    path="/decision-tree"
                    element={
                        <ProtectedRoute>
                            <DecisionTreePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/sessions/:sessionId"
                    element={
                        <ProtectedRoute>
                            <SessionDetailPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/decision-tree/editor"
                    element={
                        <ProtectedRoute allowedRoles={["Admin"]}>
                            <DecisionTreeEditorPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/feedback"
                    element={
                        <ProtectedRoute>
                            <FeedbackPage />
                        </ProtectedRoute>
                    }
                />

                <Route path="/auth/login" element={
                    <LayoutCenter>
                        <LoginPage />
                    </LayoutCenter>
                } />
                <Route path="/auth/register" element={
                    <LayoutCenter>
                        <RegisterPage />
                    </LayoutCenter>
                } />

                {/*<Route*/}
                {/*    path="/profile"*/}
                {/*    element={*/}
                {/*        <ProtectedRoute>*/}
                {/*            <ProfilePage />*/}
                {/*        </ProtectedRoute>*/}
                {/*    }*/}
                {/*/>*/}

                {/*<Route*/}
                {/*    path="/auth/hh/callback"*/}
                {/*    element={*/}
                {/*        <ProtectedRoute>*/}
                {/*            <LayoutCenter>*/}
                {/*                <HhCallbackPage />*/}
                {/*            </LayoutCenter>*/}
                {/*        </ProtectedRoute>*/}
                {/*    }*/}
                {/*/>*/}

                {/*<Route*/}
                {/*    path="/groups/:groupId"*/}
                {/*    element={*/}
                {/*        <ProtectedRoute>*/}
                {/*            <GroupPage />*/}
                {/*        </ProtectedRoute>*/}
                {/*    }*/}
                {/*/>*/}

                {/*<Route*/}
                {/*    path="/groups/create"*/}
                {/*    element={*/}
                {/*        <ProtectedRoute>*/}
                {/*            <LayoutCenter>*/}
                {/*                <CreateGroupPage />*/}
                {/*            </LayoutCenter>*/}
                {/*        </ProtectedRoute>*/}
                {/*    }*/}
                {/*/>*/}

                {/*<Route*/}
                {/*    path="/groups/:groupId/edit"*/}
                {/*    element={*/}
                {/*        <ProtectedRoute>*/}
                {/*            <LayoutCenter>*/}
                {/*                <EditGroupPage />*/}
                {/*            </LayoutCenter>*/}
                {/*        </ProtectedRoute>*/}
                {/*    }*/}
                {/*/>*/}

                <Route path="*" element={
                    <LayoutCenter>
                        <NotFoundPage />
                    </LayoutCenter>
                } />
            </Routes>

            {/*<Footer />*/}
        </div>
    )
}

export default App