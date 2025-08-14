import React, { useEffect, useState } from "react";
import { usePermissions } from "../../hooks/usePermissions";
import { useDashboards } from "../../hooks/auth/useDashboards";
import { useToast } from "../../context/ToastContext";
import { GLOBAL_TITLE, MAX_PAGE_LIMIT } from "../../constants";
import { Helmet } from "react-helmet-async";
import Breadcrumbs, { generateBreadcrumbs } from "../../components/ui/Breadcrumbs";
import PageHeading from "../../components/ui/PageHeading";
import TopCenterLoader from "../../components/ui/TopCenterLoader";
import AddCard from "../../components/ui/AddCard";
import { Pagination } from "../../components/ui/Pagination";
import Modal from "../../components/ui/Modal";
import { useQuery } from "@tanstack/react-query";
import { CourseFilters, GetCoursesResponse } from "../../constants/core/interfaces";
import { getCourseById, getCourses, updateCourseById } from "../../api/core/course-api";
import CreateCourse from "../../components/pages/core/course/CreateCourse";
import { truncateName } from "../../utils/truncate-name";
import { FiEdit } from "react-icons/fi";
import CourseProfile from "../../components/pages/core/course/CourseProfile";
import { Course } from "../../../../server/src/shared/interfaces";


const CourseManagement: React.FC = () => {
    const { user, isLoggedIn, isAdmin, isDepartmentHead } = usePermissions();
    const { head: departmentHeadDashboard } = useDashboards(user?.role, isLoggedIn);
    const deptHeadProgram = departmentHeadDashboard.data?.program;

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const [page, setPage] = useState(1);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const toast = useToast();

    const handleViewCourse = (courseId: string) => {
        setSelectedCourseId(courseId);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedCourseId(null);
    };

    const {
        data: courseData,
        isLoading: isCoursesLoading,
        isError: isCoursesError,
        error: coursesError
    } = useQuery<GetCoursesResponse, Error>({
        queryKey: [
            'courses',
            page,
            isDepartmentHead ? deptHeadProgram?._id : undefined,
            debouncedSearch || undefined,
        ],
        queryFn: () =>
            getCourses({
                page,
                limit: MAX_PAGE_LIMIT,
                programId: isDepartmentHead ? deptHeadProgram?._id : undefined,
                title: debouncedSearch || undefined,
            }),
        retry: 1, // optional retry
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Handle errors manually
    useEffect(() => {
        if (isCoursesError && coursesError) {
            toast.error(`Error fetching courses: ${coursesError.message}`);
        }
    }, [isCoursesError, coursesError, toast]);

    const courses = courseData?.courses || [];
    const totalPages = courseData?.totalPages || 1;
    const totalCourses = courseData?.totalCourses || 0;

    const filteredCourses = courses.filter((course) => {
        const q = debouncedSearch.trim().toLowerCase();
        return (
            course.title.toLowerCase().includes(q) ||
            course.code.toLowerCase().includes(q) ||
            course.codePrefix.toLowerCase().includes(q) ||
            course.subjectType.toLowerCase().includes(q) ||
            course.subjectLevel.toLowerCase().includes(q) ||
            course.knowledgeArea.toLowerCase().includes(q) ||
            course.domain.toLowerCase().includes(q)
        );
    });

    return (
        <div className="p-8 max-w-6xl mx-auto overflow-x-auto">
            <Helmet>
                <title>{GLOBAL_TITLE} - Course Management</title>
            </Helmet>
            <Breadcrumbs items={generateBreadcrumbs('/faculty/semesters/courses/')} />

            <div className="mt-2 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <PageHeading title="Course Management" />
                <input
                    type="text"
                    placeholder="Search courses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border border-gray-300 rounded px-4 py-2 w-full md:max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm
                    dark:bg-darkSurface dark:border-darkBorderLight dark:text-darkTextPrimary dark:placeholder-darkTextMuted"
                />
            </div>

            <div className="mb-4 text-right">
                {(isAdmin || isDepartmentHead) && (
                    <button
                        onClick={() => setShowRegisterModal(true)}
                        className="inline-block bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded transition"
                    >
                        + Add New Course
                    </button>
                )}
            </div>

            {isCoursesLoading ? (
                <TopCenterLoader />
            ) : filteredCourses.length > 0 ? (
                <>
                    <div className="overflow-x-auto border border-gray-300 rounded-sm shadow-sm bg-white dark:bg-darkSurface dark:border-darkBorderLight">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-100 border-b border-gray-300 text-gray-600 uppercase text-xs tracking-wide dark:bg-darkMuted dark:text-darkTextMuted">
                                <tr>
                                    <th className="px-4 py-2">Code Prefix</th>
                                    <th className="px-4 py-2">Code</th>
                                    <th className="px-4 py-2">Title</th>
                                    <th className="px-4 py-2">Level</th>
                                    <th className="px-4 py-2">Type</th>
                                    <th className="px-4 py-2">CrH</th>
                                    <th className="px-4 py-2">CtH</th>
                                    <th className="px-4 py-2">Knowledge Area</th>
                                    <th className="px-4 py-2">Domain</th>
                                    <th className="px-4 py-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCourses.map((course) => (
                                    <tr
                                        key={course.id}
                                        className="border-b last:border-0 hover:bg-gray-50 transition dark:border-darkBorderLight dark:hover:bg-darkMuted"
                                    >
                                        <td className="px-4 py-2 font-medium text-gray-800 dark:text-darkTextPrimary">
                                            {course.codePrefix || "-"}
                                        </td>
                                        <td className="px-4 py-2 font-medium text-gray-800 dark:text-darkTextPrimary">
                                            {course.code}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-darkTextSecondary">
                                            {truncateName(course.title) || "-"}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-darkTextSecondary">
                                            {course.subjectLevel || "-"}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-darkTextSecondary">
                                            {course.subjectType || "-"}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-darkTextSecondary">
                                            {course.creditHours || "-"}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-darkTextSecondary">
                                            {course.contactHours || "-"}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-darkTextSecondary">
                                            {truncateName((course.knowledgeArea) || "-", 20)}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-darkTextSecondary">
                                            {truncateName((course.domain) || "-", 20)}
                                        </td>
                                        <td className="px-4 py-2 text-center space-x-2">
                                            <button
                                                onClick={() => handleViewCourse(course.id)}
                                                className="inline-flex items-center justify-center p-2 rounded hover:bg-gray-100 transition dark:hover:bg-darkMuted"
                                                title="Edit course"
                                            >
                                                <FiEdit className="w-4 h-4 text-blue-500" />
                                            </button>
                                            {/* Optional additional actions, e.g., edit */}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <p className="text-center text-gray-600 mt-8">No courses found.</p>
            )}

            
            {showModal && selectedCourseId && (
                <Modal isOpen={showModal} onClose={closeModal}>
                    <CourseProfile
                        courseId={selectedCourseId}
                        fetchCourse={getCourseById}
                        updateCourse={updateCourseById as (id: string, data: Partial<Course>) => Promise<any>}
                        onDelete={() => {
                            closeModal();     // close the modal
                        }}
                    />
                </Modal>
            )}

            {showRegisterModal && (
                <Modal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)}>
                    <CreateCourse
                        onSuccess={() => {
                            setShowRegisterModal(false);
                        }} />
                </Modal>
            )}

            <div className="flex justify-end">
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            </div>
        </div>
    );
};


export default CourseManagement;
