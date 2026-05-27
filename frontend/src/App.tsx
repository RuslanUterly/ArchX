import './App.css';
import { Footer } from "./shared/components/footer";
import { Header } from "./modules/header";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./shared/components/route/ProtectedRoute.tsx";
import LoginPage from "./modules/auth/pages/LoginPage.tsx";
import RegisterPage from "./modules/auth/pages/RegisterPage.tsx";
import ForgotPasswordPage from "./modules/auth/pages/ForgotPasswordPage.tsx";
import ResetPasswordPage from "./modules/auth/pages/ResetPasswordPage.tsx";
import { NotFoundPage } from "./shared/pages/NotFoundPage.tsx";
import LayoutCenter from "./shared/components/layout/LayoutCenter.tsx";
import HomePage from "./modules/home/pages/HomePage.tsx";
import DecisionTreePage from "./modules/architectureDecision/pages/DecisionTreePage.tsx";
import SessionDetailPage from "./modules/architectureDecision/pages/SessionDetailPage.tsx";
import DecisionTreeEditorPage from "./modules/architectureDecisionEditor/pages/DecisionTreeEditorPage.tsx";
import FeedbackPage from "./modules/feedback/pages/FeedbackPage.tsx";
import StatisticsPage from "./modules/statistics/pages/StatisticsPage.tsx";
import ProfilePage from "./modules/profile/pages/ProfilePage.tsx";
import ResultsPage from "./modules/results/pages/ResultsPage.tsx";

function App() {
    return (
        <div className="container-fill">
            <Header />

            <div className="container-fill__main">
            <Routes>
                <Route
                    path="/"
                    element={
                        <HomePage />
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
                <Route
                    path="/statistics"
                    element={
                        <ProtectedRoute>
                            <StatisticsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/results"
                    element={
                        <ProtectedRoute deniedRoles={["Admin"]} redirectTo="/">
                            <ResultsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute deniedRoles={["Admin"]} redirectTo="/">
                            <ProfilePage />
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
                <Route path="/auth/forgot-password" element={
                    <LayoutCenter>
                        <ForgotPasswordPage />
                    </LayoutCenter>
                } />
                <Route path="/auth/reset-password" element={
                    <LayoutCenter>
                        <ResetPasswordPage />
                    </LayoutCenter>
                } />

                <Route path="*" element={
                    <LayoutCenter>
                        <NotFoundPage />
                    </LayoutCenter>
                } />
            </Routes>
            </div>

            <Footer />
        </div>
    )
}

export default App