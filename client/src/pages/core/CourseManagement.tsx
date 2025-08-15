import React, { useEffect, useState } from "react";
import { usePermissions } from "../../hooks/usePermissions";
import { useDashboards } from "../../hooks/auth/useDashboards";
import { useToast } from "../../context/ToastContext";
import { GLOBAL_TITLE, MAX_PAGE_LIMIT } from "../../constants";
import { Helmet } from "react-helmet-async";
import Breadcrumbs, { generateBreadcrumbs } from "../../components/ui/Breadcrumbs";
import PageHeading from "../../components/ui/PageHeading";
import TopCenterLoader from "../../components/ui/TopCenterLoader";
import { Pagination } from "../../components/ui/Pagination";
import Modal from "../../components/ui/Modal";
import { useQuery } from "@tanstack/react-query";
import { GetCoursesResponse } from "../../constants/core/interfaces";
import { getCourseById, getCourses, updateCourseById } from "../../api/core/course-api";
import CreateCourse from "../../components/pages/core/course/CreateCourse";
import { truncateName } from "../../utils/truncate-name";
import { FiEdit } from "react-icons/fi";
import CourseProfile from "../../components/pages/core/course/CourseProfile";
import { Course } from "../../../../server/src/shared/interfaces";
import { Button } from "../../components/ui/Button";
import { useUserManagement } from "../../hooks/admin/useUserManagement";
import { AudienceEnum, DomainEnum, KnowledgeAreaEnum, SubjectLevelEnum, SubjectTypeEnum } from "../../../../server/src/shared/enums";
import { SelectInput } from "../../components/ui/Input";


const CourseManagement: React.FC = () => {
    const { user, isLoggedIn, isAdmin, isDepartmentHead } = usePermissions();
    const { head: departmentHeadDashboard } = useDashboards(user?.role, isLoggedIn);
    const deptHeadProgram = departmentHeadDashboard.data?.program;

    const { page, setPage, search, setSearch, debouncedSearch } =
        useUserManagement(user?.role as AudienceEnum);

    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const toast = useToast();

    const [subjectLevelFilter, setSubjectLevelFilter] = useState<string | null>(null);
    const [subjectTypeFilter, setSubjectTypeFilter] = useState<string | null>(null);
    const [knowledgeAreaFilter, setKnowledgeAreaFilter] = useState<string | null>(null);
    const [domainFilter, setDomainFilter] = useState<string | null>(null);

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
            isDepartmentHead ? deptHeadProgram?.id : undefined,
            debouncedSearch || undefined,
            subjectLevelFilter,
            subjectTypeFilter,
            knowledgeAreaFilter,
            domainFilter
        ],
        queryFn: () =>
            getCourses({
                page,
                limit: MAX_PAGE_LIMIT,
                programId: isDepartmentHead ? deptHeadProgram?.id : undefined,
                search: debouncedSearch || undefined,
                subjectLevel: subjectLevelFilter || undefined,
                subjectType: subjectTypeFilter || undefined,
                knowledgeArea: knowledgeAreaFilter || undefined,
                domain: domainFilter || undefined,
            }),
        retry: 1,
        staleTime: 1000 * 60 * 5,
    });

    // Handle errors manually
    useEffect(() => {
        if (isCoursesError && coursesError) {
            toast.error(`Error fetching courses: ${coursesError.message}`);
        }
    }, [isCoursesError, coursesError, toast]);

    const courses = courseData?.courses || [];
    const totalPages = courseData?.totalPages || 1;

    return (
        <div className="p-8 max-w-6xl mx-auto overflow-x-auto">
            <Helmet>
                <title>{GLOBAL_TITLE} - Course Management</title>
            </Helmet>
            <Breadcrumbs items={generateBreadcrumbs('/faculty/semesters/courses/')} />

            <div className="mt-2 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                {/* Left: Heading */}
                <PageHeading title="Course Management" />

                {/* Right: Search + Button grouped together */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:ml-auto">
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border border-gray-300 rounded px-4 py-2 w-full sm:w-auto md:max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm
                        dark:bg-darkSurface dark:border-darkBorderLight dark:text-darkTextPrimary dark:placeholder-darkTextMuted"
                    />
                    {(isAdmin || isDepartmentHead) && (
                        <Button
                            onClick={() => setShowRegisterModal(true)}
                            fullWidth={false}
                            variant="green"
                            size="md"
                        >
                            Create Course
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex justify-end mt-8">
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {/* Subject Level */}
                    <div className="flex flex-col">
                        <label className="mb-1 text-xs font-semibold text-gray-800 dark:text-gray-300">
                            Subject Level
                        </label>
                        <SelectInput
                            value={subjectLevelFilter || ""}
                            onChange={e => setSubjectLevelFilter(e.target.value || null)}
                            options={[
                                { label: "All", value: "" },
                                ...Object.values(SubjectLevelEnum).map(level => ({ label: level, value: level })),
                            ]}
                            placeholder="Filter by Level"
                            className="max-w-xs text-xs w-full"
                        />
                    </div>

                    {/* Subject Type */}
                    <div className="flex flex-col">
                        <label className="mb-1 text-xs font-semibold text-gray-800 dark:text-gray-300">
                            Subject Type
                        </label>
                        <SelectInput
                            value={subjectTypeFilter || ""}
                            onChange={e => setSubjectTypeFilter(e.target.value || null)}
                            options={[
                                { label: "All", value: "" },
                                ...Object.values(SubjectTypeEnum).map(type => ({ label: type, value: type })),
                            ]}
                            placeholder="Filter by Type"
                            className="max-w-xs text-xs w-full"
                        />
                    </div>

                    {/* Knowledge Area */}
                    <div className="flex flex-col">
                        <label className="mb-1 text-xs font-semibold text-gray-800 dark:text-gray-300">
                            Knowledge Area
                        </label>
                        <SelectInput
                            value={knowledgeAreaFilter || ""}
                            onChange={e => setKnowledgeAreaFilter(e.target.value || null)}
                            options={[
                                { label: "All", value: "" },
                                ...Object.values(KnowledgeAreaEnum).map(area => ({ label: area, value: area })),
                            ]}
                            placeholder="Filter by Area"
                            className="max-w-xs text-xs w-full"
                        />
                    </div>

                    {/* Domain */}
                    <div className="flex flex-col">
                        <label className="mb-1 text-xs font-semibold text-gray-800 dark:text-gray-300">
                            Domain
                        </label>
                        <SelectInput
                            value={domainFilter || ""}
                            onChange={e => setDomainFilter(e.target.value || null)}
                            options={[
                                { label: "All", value: "" },
                                ...Object.values(DomainEnum).map(domain => ({ label: domain, value: domain })),
                            ]}
                            placeholder="Filter by Domain"
                            className="max-w-xs text-xs w-full"
                        />
                    </div>
                </div>
            </div>

            {isCoursesLoading ? (
                <TopCenterLoader />
            ) : (
                <div className="overflow-x-auto mt-4 border border-gray-300 rounded-sm shadow-sm bg-white dark:bg-darkSurface dark:border-darkBorderLight">
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
                            {courses.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={10}
                                        className="text-center py-6 text-gray-600 dark:text-darkTextSecondary"
                                    >
                                        No courses found.
                                    </td>
                                </tr>
                            ) : (
                                courses.map((course) => (
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
                                            {truncateName(course.knowledgeArea || "-", 20)}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-darkTextSecondary">
                                            {truncateName(course.domain || "-", 20)}
                                        </td>
                                        <td className="px-4 py-2 text-center space-x-2">
                                            <button
                                                onClick={() => handleViewCourse(course.id)}
                                                className="inline-flex items-center justify-center p-2 rounded hover:bg-gray-100 transition dark:hover:bg-darkMuted"
                                                title="Edit course"
                                            >
                                                <FiEdit className="w-4 h-4 text-blue-500" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
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
