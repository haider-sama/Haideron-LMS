import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "../pages/main/AppContainer";
import ProtectedRoute from "../components/account/ProtectedRoute";
import Register from "../pages/auth/credentials/Register";
import Login from "../pages/auth/credentials/Login";
import RequestEmailVerification from "../pages/auth/verification/RequestEmailVerification";
import ForgotPassword from "../pages/auth/verification/ForgotPassword";
import ResetPassword from "../pages/auth/verification/ResetPassword";

import UserRegistration from "../pages/admin/UserRegistration";
import UserManagementTable from "../pages/admin/UserManagementTable";
import NotFound from "../pages/forbidden/NotFound";
import EmailVerification from "../pages/auth/verification/EmailVerification";
import Forbidden from "../pages/forbidden/Forbidden";
import Unauthorized from "../pages/forbidden/Unauthorized";
import InternalError from "../pages/forbidden/InternalError";
import { AudienceEnum } from "../../../server/src/shared/enums";
import HomePage from "../pages/main/HomePage";
import RequestEmailChange from "../pages/auth/verification/RequestEmailChange";
import EmailChangeVerification from "../pages/auth/verification/EmailChangeVerification";
import FacultyManagement from "../pages/core/FacultyManagement";
import ProgramManagement from "../pages/core/ProgramManagement";
import CatalogueManagement from "../pages/core/CatalogueManagement";
import CourseManagement from "../pages/core/CourseManagement";
import BatchManagement from "../pages/core/batch/BatchManagement";
import EnrolledStudentsList from "../pages/core/batch/EnrolledStudentsList";
import StudentBatchRegistration from "../pages/core/batch/StudentBatchRegistration";
import StudentCourseEnrollment from "../pages/core/student/StudentCourseEnrollment";
import StudentTranscriptPage from "../pages/core/student/StudentTranscriptPage";
import OfferedCoursesList from "../pages/core/teacher/OfferedCoursesList";
import PendingFinalizedResultsList from "../pages/core/result/PendingFinalizedResultsList";
import AuditLogPage from "../pages/admin/AuditLogPage";
import SocialShell from "../pages/main/SocialShell";
import ForumPage from "../pages/social/forum/ForumPage";
import ModeratorsPage from "../components/social/pages/forum/ModeratorsPage";
import ForumDetailPage from "../pages/social/forum/ForumDetailPage";
import PostPage from "../pages/social/post/PostPage";
import ForumUserProfile from "../pages/social/account/ForumUserProfile";
import UserForumProfile from "../pages/social/account/UserForumProfile";
import AdminSettingsPanel from "../pages/admin/AdminSettingsPanel";
import { useSettings } from "../hooks/admin/useSettings";

interface AppRoutesProps {
    isLoggedIn: boolean;
    role: string;
};

const AppRoutes: React.FC<AppRoutesProps> = ({ isLoggedIn, role }) => {
    const { publicSettings } = useSettings(); // fetch public settings (user mode)

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

            <Route path="/request-email-verification"
                element={
                    <ProtectedRoute
                        isAllowed={isLoggedIn}
                        redirectTo="/unauthorized"
                        element={<RequestEmailVerification />}
                    />
                }
            />

            {(publicSettings?.allowEmailMigration ?? false) && (
                <Route
                    path="/request-email-change"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn}
                            redirectTo="/unauthorized"
                            element={<RequestEmailChange />}
                        />
                    }
                />
            )}

            {(publicSettings?.allowEmailMigration ?? false) && (
                <Route path="/verify-email-change" element={<EmailChangeVerification />} />
            )}

            <Route path="/verify-email-change" element={<EmailChangeVerification />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />


            <Route element={<AppShell />}>
                <Route path="/" element={<HomePage />} />

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
                {/* <Route
                    path="/student/dashboard"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && role === AudienceEnum.Student}
                            redirectTo="/forbidden"
                            element={<StudentDashboard />}
                        />
                    }
                /> */}

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

            <Route element={<SocialShell />}>
                <Route path="/forums" element={<ForumPage />} />
                <Route path="/forums/:slug" element={<ForumDetailPage />} />
                <Route path="/forums/:forumId/moderators" element={<ModeratorsPage />} />
                <Route path="/forums/:forumSlug/:postSlug" element={<PostPage />} />

                <Route
                    path="/forums/profile"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn}
                            redirectTo="/login"
                            element={<ForumUserProfile />}
                        />
                    }
                />
                <Route path="/forums/profile/:userIdOrUsername" element={<UserForumProfile />} />

            </Route>

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default AppRoutes;