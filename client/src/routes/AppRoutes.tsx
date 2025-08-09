import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "../pages/main/AppContainer";
import ProtectedRoute from "../components/account/ProtectedRoute";
import Register from "../pages/core/authentication/credentials/Register";
import Login from "../pages/core/authentication/credentials/Login";
import RequestEmailVerification from "../pages/core/authentication/verification/RequestEmailVerification";
import ForgotPassword from "../pages/core/authentication/verification/ForgotPassword";
import ResetPassword from "../pages/core/authentication/verification/ResetPassword";

import UserRegistration from "../pages/core/admin/UserRegistration";
import UserManagementTable from "../pages/core/admin/UserManagementTable";
import NotFound from "../pages/forbidden/NotFound";
import EmailVerification from "../pages/core/authentication/verification/EmailVerification";
import Forbidden from "../pages/forbidden/Forbidden";
import Unauthorized from "../pages/forbidden/Unauthorized";
import InternalError from "../pages/forbidden/InternalError";
import { AudienceEnum } from "../../../server/src/shared/enums";
import HomePage from "../pages/main/HomePage";
import { ALLOW_EMAIL_MIGRATION, ALLOW_PUBLIC_REGISTRATION } from "../constants";
import RequestEmailChange from "../pages/core/authentication/verification/RequestEmailChange";
import EmailChangeVerification from "../pages/core/authentication/verification/EmailChangeVerification";
// import SocialShell from "../pages/main/SocialShell";

interface AppRoutesProps {
    isLoggedIn: boolean;
    role: string;
};

const AppRoutes: React.FC<AppRoutesProps> = ({ isLoggedIn, role }) => {
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

            {ALLOW_PUBLIC_REGISTRATION === true && (
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

            <Route element={<AppShell />}>
                <Route path="/" element={<HomePage />} />
                {/* Auth Routes */}
                <Route path="/request-email-verification"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn}
                            redirectTo="/unauthorized"
                            element={<RequestEmailVerification />}
                        />
                    }
                />

                {ALLOW_EMAIL_MIGRATION && (
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
                {ALLOW_EMAIL_MIGRATION && (
                    <Route path="/verify-email-change" element={<EmailChangeVerification />} />
                )}

                <Route path="/verify-email-change" element={<EmailChangeVerification />} />
                <Route path="/verify-email" element={<EmailVerification />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />


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


                {/* Program routes */}
                {/* <Route path="/faculty/programs"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && (role === AudienceEnum.Admin || role === AudienceEnum.DepartmentHead)}
                            redirectTo="/forbidden"
                            element={<ProgramManagement />}
                        />
                    }
                /> */}


                {/* Catalogue routes */}
                {/* <Route path="/faculty/catalogues"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && (role === AudienceEnum.Admin || role === AudienceEnum.DepartmentHead)}
                            redirectTo="/forbidden"
                            element={<CatalogueManagement />}
                        />
                    }
                /> */}


                {/* Course routes */}
                {/* <Route
                    path="/faculty/semesters/courses/"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && (role === AudienceEnum.Admin || role === AudienceEnum.DepartmentHead)}
                            redirectTo="/forbidden"
                            element={<CourseManagement />}
                        />
                    }
                /> */}


                {/* Faculty routes */}
                {/* <Route
                    path="/faculty/members"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && (role === AudienceEnum.Admin || role === AudienceEnum.DepartmentHead)}
                            redirectTo="/forbidden"
                            element={<FacultyManagement />}
                        />
                    }
                /> */}
                {/* <Route path="/faculty/pending-results"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && role === AudienceEnum.DepartmentHead}
                            redirectTo="/forbidden"
                            element={<PendingFinalizedResultsList />}
                        />
                    }
                /> */}


                {/* ProgramBatch routes */}
                {/* <Route
                    path="/batches"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && (role === AudienceEnum.Admin || role === AudienceEnum.DepartmentHead)}
                            redirectTo="/forbidden"
                            element={<BatchManagement />}
                        />
                    }
                /> */}
                {/* <Route
                    path="/batches/enrollments/student-batch"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && (role === AudienceEnum.Admin || role === AudienceEnum.DepartmentHead)}
                            redirectTo="/forbidden"
                            element={<StudentBatchEnrollmentForm />}
                        />
                    }
                /> */}
                {/* <Route
                    path="/batches/enrollments/student-list"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && (role === AudienceEnum.Admin || role === AudienceEnum.DepartmentHead)}
                            redirectTo="/forbidden"
                            element={<EnrolledStudentsList />}
                        />
                    }
                /> */}


                {/* Student routes */}
                {/* <Route
                    path="/student/course-enrollment"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && role === AudienceEnum.Student}
                            redirectTo="/forbidden"
                            element={<StudentCourseEnrollment />}
                        />
                    }
                /> */}
                {/* <Route
                    path="/student/transcript"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && role === AudienceEnum.Student}
                            redirectTo="/forbidden"
                            element={<StudentTranscriptPage />}
                        />
                    }
                /> */}
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
                {/* <Route
                    path="/teacher/assigned-courses"
                    element={
                        <ProtectedRoute
                            isAllowed={isLoggedIn && role === AudienceEnum.DepartmentTeacher}
                            redirectTo="/forbidden"
                            element={<OfferedCoursesList />}
                        />
                    }
                /> */}


                {/* Error routes */}
                <Route path="/not-found" element={<NotFound />} />
                <Route path="/internal-error" element={<InternalError />} />
                <Route path="/forbidden" element={<Forbidden />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

            </Route>

            {/* <Route element={<SocialShell />}>
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
                            element={<ForumProfile />}
                        />
                    }
                />
                <Route path="/forums/profile/:userIdOrUsername" element={<UserForumProfile />} />

            </Route> */}

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default AppRoutes;