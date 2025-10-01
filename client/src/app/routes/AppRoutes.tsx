import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "../../features/main/components/AppContainer";
import ProtectedRoute from "../../shared/components/ProtectedRoute";
import Register from "../../features/auth/pages/Register";
import Login from "../../features/auth/pages/Login";
import RequestEmailVerification from "../../features/auth/components/verification/RequestEmailVerification";
import ForgotPassword from "../../features/auth/components/verification/ForgotPassword";
import ResetPassword from "../../features/auth/components/verification/ResetPassword";

import UserRegistration from "../../features/admin/components/UserRegistration";
import UserManagementTable from "../../features/admin/components/UserManagementTable";
import NotFound from "../../pages/forbidden/NotFound";
import EmailVerification from "../../features/auth/components/verification/EmailVerification";
import Forbidden from "../../pages/forbidden/Forbidden";
import Unauthorized from "../../pages/forbidden/Unauthorized";
import InternalError from "../../pages/forbidden/InternalError";
import { AudienceEnum } from "../../../../server/src/shared/enums";
import HomePage from "../../features/main/pages/HomePage";
import FacultyManagement from "../../pages/core/FacultyManagement";
import ProgramManagement from "../../pages/core/ProgramManagement";
import CatalogueManagement from "../../pages/core/CatalogueManagement";
import CourseManagement from "../../pages/core/CourseManagement";
import BatchManagement from "../../pages/core/batch/BatchManagement";
import EnrolledStudentsList from "../../pages/core/batch/EnrolledStudentsList";
import StudentBatchRegistration from "../../pages/core/batch/StudentBatchRegistration";
import StudentCourseEnrollment from "../../pages/core/student/StudentCourseEnrollment";
import StudentTranscriptPage from "../../pages/core/student/StudentTranscriptPage";
import OfferedCoursesList from "../../pages/core/teacher/OfferedCoursesList";
import PendingFinalizedResultsList from "../../pages/core/result/PendingFinalizedResultsList";
import AuditLogPage from "../../features/admin/components/AuditLogPage";
import AdminSettingsPanel from "../../features/admin/components/AdminSettingsPanel";
import { useSettings } from "../../features/admin/hooks/useSettings";
import Enable2FA from "../../features/auth/components/verification/Enable2FA";
import Disable2FA from "../../features/auth/components/verification/Disable2FA";
import { useAuth } from "../../features/auth/hooks/useAuth";
import AdminDashboard from "../../features/admin/pages/AdminDashboard";

interface AppRoutesProps {
    isLoggedIn: boolean;
    role: string;
};

const AppRoutes: React.FC<AppRoutesProps> = ({ isLoggedIn, role }) => {
    const { publicSettings } = useSettings(); // fetch public settings (user mode)
    const { user } = useAuth();

    return (
        <Routes>

            <Route
                path="/login"
                element={
                    <ProtectedRoute
                        isAllowed={!isLoggedIn}
                        element={<Login />}
                    />
                }
            />
            {(publicSettings?.allowUserRegistration ?? false) && (
                <Route
                    path="/register"
                    element={
                        <ProtectedRoute
                            isAllowed={!isLoggedIn}
                            element={<Register />}
                        />
                    }
                />
            )}

            {!user?.isEmailVerified && (
                <>
                    <Route path="/account/request-email-verification"
                        element={
                            <ProtectedRoute
                                isAllowed={isLoggedIn}
                                redirectTo="/unauthorized"
                                element={<RequestEmailVerification />}
                            />
                        }
                    />
                    <Route path="/account/verify-email" element={<EmailVerification />} />
                </>
            )}

            <Route path="/account/forgot-password" element={<ForgotPassword />} />
            <Route path="/account/reset-password/:token" element={<ResetPassword />} />
            <Route path="/account/reset-password" element={<ResetPassword />} />

            {!user?.isTwoFAEnabled && (
                <Route path="/account/enable-2fa" element={<Enable2FA />} />
            )}

            {user?.isTwoFAEnabled && (
                <Route path="/account/disable-2fa" element={<Disable2FA />} />
            )}


            <Route element={<AppShell />}>
                <Route path="/" element={<HomePage />} />

                <Route path="/admin/dashboard"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && role === AudienceEnum.Admin}
                            redirectTo="/forbidden"
                            element={<AdminDashboard />}
                        />
                    }
                />

                {/* Admin Routes */}
                <Route path="/admin/user-registration"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && role === AudienceEnum.Admin}
                            redirectTo="/forbidden"
                            element={<UserRegistration />}
                        />
                    }
                />
                <Route path="/admin/user-management"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && role === AudienceEnum.Admin}
                            redirectTo="/forbidden"
                            element={<UserManagementTable />}
                        />
                    }
                />
                <Route path="/admin/audit-logs"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && role === AudienceEnum.Admin}
                            redirectTo="/forbidden"
                            element={<AuditLogPage />}
                        />
                    }
                />
                <Route path="/admin/settings"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && role === AudienceEnum.Admin}
                            redirectTo="/forbidden"
                            element={<AdminSettingsPanel />}
                        />
                    }
                />


                {/* Program routes */}
                <Route path="/faculty/programs"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && (role === AudienceEnum.Admin || role === AudienceEnum.DepartmentHead)}
                            redirectTo="/forbidden"
                            element={<ProgramManagement />}
                        />
                    }
                />


                {/* Catalogue routes */}
                <Route path="/faculty/catalogues"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && (role === AudienceEnum.Admin || role === AudienceEnum.DepartmentHead)}
                            redirectTo="/forbidden"
                            element={<CatalogueManagement />}
                        />
                    }
                />


                {/* Course routes */}
                <Route
                    path="/faculty/semesters/courses/"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && (role === AudienceEnum.Admin || role === AudienceEnum.DepartmentHead)}
                            redirectTo="/forbidden"
                            element={<CourseManagement />}
                        />
                    }
                />


                {/* Faculty routes */}
                <Route
                    path="/faculty/members"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && (role === AudienceEnum.Admin || role === AudienceEnum.DepartmentHead)}
                            redirectTo="/forbidden"
                            element={<FacultyManagement />}
                        />
                    }
                />
                <Route path="/faculty/pending-results"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && role === AudienceEnum.DepartmentHead}
                            redirectTo="/forbidden"
                            element={<PendingFinalizedResultsList />}
                        />
                    }
                />


                {/* ProgramBatch routes */}
                <Route
                    path="/batches"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && (role === AudienceEnum.Admin || role === AudienceEnum.DepartmentHead)}
                            redirectTo="/forbidden"
                            element={<BatchManagement />}
                        />
                    }
                />
                <Route
                    path="/batches/enrollments/student-batch"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && (role === AudienceEnum.Admin || role === AudienceEnum.DepartmentHead)}
                            redirectTo="/forbidden"
                            element={<StudentBatchRegistration />}
                        />
                    }
                />
                <Route
                    path="/batches/enrollments/student-list"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && (role === AudienceEnum.Admin || role === AudienceEnum.DepartmentHead)}
                            redirectTo="/forbidden"
                            element={<EnrolledStudentsList />}
                        />
                    }
                />


                {/* Student routes */}
                <Route
                    path="/student/course-enrollment"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && role === AudienceEnum.Student}
                            redirectTo="/forbidden"
                            element={<StudentCourseEnrollment />}
                        />
                    }
                />
                <Route
                    path="/student/transcript"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && role === AudienceEnum.Student}
                            redirectTo="/forbidden"
                            element={<StudentTranscriptPage />}
                        />
                    }
                />

                {/* Teacher routes */}
                <Route
                    path="/teacher/assigned-courses"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && role === AudienceEnum.DepartmentTeacher}
                            redirectTo="/forbidden"
                            element={<OfferedCoursesList />}
                        />
                    }
                />


                {/* Error routes */}
                <Route path="/not-found" element={<NotFound />} />
                <Route path="/internal-error" element={<InternalError />} />
                <Route path="/forbidden" element={<Forbidden />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

            </Route>

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default AppRoutes;