// import React, { useEffect, useState } from "react";
// import { getAllCourses, getCourseById, updateCourse } from "../../../../api/lms/faculty/semesterApi";
// import { GLOBAL_TITLE, MAX_PAGE_LIMIT } from "../../../../constants";
// import PaginationControl from "../../../../components/ui/PaginationControl";
// import { Course } from "../../../../constants/lms/interfaces";
// import CourseCard from "../../../../components/pages/lms/faculty/course/CourseCard";
// import TopCenterLoader from "../../../../components/ui/TopCenterLoader";
// import Breadcrumbs, { generateBreadcrumbs } from "../../../../components/ui/Breadcrumbs";
// import PageHeading from "../../../../components/ui/PageHeading";
// import Modal from "../../../../components/ui/Modal";
// import CourseProfile from "../../../../components/pages/lms/faculty/course/CourseProfile";
// import AddCard from "../../../../components/ui/AddCard";
// import AddCourseToSemester from "../../../../components/pages/lms/faculty/course/AddCourseToSemester";
// import { Helmet } from "react-helmet-async";
// import { useQuery } from "react-query";
// import { useToast } from "../../../../context/ToastContext";
// import { useDashboards } from "../../../../hooks/auth/useDashboards";
// import { usePermissions } from "../../../../hooks/usePermissions";
// // import CourseViewOutcomes from "../../../components/pages/faculty/course/course-outcomes/CourseViewOutcomes";

// const CourseManagement: React.FC = () => {
//     const { user, isLoggedIn, isAdmin, isDepartmentHead } = usePermissions();
//     const { head: departmentHeadDashboard } = useDashboards(user?.role, isLoggedIn);

//     const deptHeadProgram = departmentHeadDashboard.data?.program;

//     const [search, setSearch] = useState("");
//     const [debouncedSearch, setDebouncedSearch] = useState(search);
//     const [page, setPage] = useState(1);
//     const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
//     const [showModal, setShowModal] = useState(false);
//     const [showRegisterModal, setShowRegisterModal] = useState(false);
//     const toast = useToast();
//     // const [showOutcomesModal, setShowOutcomesModal] = useState(false);
//     // const [outcomesCourseId, setOutcomesCourseId] = useState<string | null>(null);

//     const handleViewCourse = (courseId: string) => {
//         setSelectedCourseId(courseId);
//         setShowModal(true);
//     };

//     const closeModal = () => {
//         setShowModal(false);
//         setSelectedCourseId(null);
//     };

//     // const openOutcomesModal = (courseId: string) => {
//     //     setOutcomesCourseId(courseId);
//     //     setShowOutcomesModal(true);
//     // };

//     // const closeOutcomesModal = () => {
//     //     setShowOutcomesModal(false);
//     //     setOutcomesCourseId(null);
//     // };

//     useEffect(() => {
//         const timeout = setTimeout(() => {
//             setDebouncedSearch(search);
//         }, 300);
//         return () => clearTimeout(timeout);
//     }, [search]);

//     const { data: courseData, isLoading } = useQuery(
//         ['courses', page],
//         () =>
//             getAllCourses({
//                 page,
//                 limit: MAX_PAGE_LIMIT,
//                 programId: isDepartmentHead ? deptHeadProgram?._id : undefined
//             }),
//         {
//             keepPreviousData: true,
//             onError: () => {
//                 toast.error("Error fetching courses");
//             }
//         }
//     );

//     const courses = courseData?.courses || [];
//     const totalPages = Math.ceil((courseData?.courses?.length || 0) / MAX_PAGE_LIMIT);

//     const filteredCourses = courses.filter((course) => {
//         const q = debouncedSearch.trim().toLowerCase();
//         return (
//             course.title.toLowerCase().includes(q) ||
//             course.code.toLowerCase().includes(q) ||
//             course.codePrefix.toLowerCase().includes(q) ||
//             course.subjectType.toLowerCase().includes(q) ||
//             course.subjectLevel.toLowerCase().includes(q) ||
//             course.knowledgeArea.toLowerCase().includes(q) ||
//             course.domain.toLowerCase().includes(q)
//         );
//     });

//     return (
//         <div className="p-8 max-w-6xl mx-auto overflow-x-auto">
//             <Helmet>
//                 <title>{GLOBAL_TITLE} - Course Management - Existing Courses</title>
//             </Helmet>
//             <Breadcrumbs items={generateBreadcrumbs('/faculty/semesters/courses/')} />

//             <div className="mt-2 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-2">
//                 <PageHeading title="Existing Courses" />
//                 <input
//                     type="text"
//                     placeholder="Search courses..."
//                     value={search}
//                     onChange={(e) => setSearch(e.target.value)}
//                     className="border border-gray-300 rounded px-4 py-2 w-full md:max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm
//                     dark:bg-darkSurface dark:border-darkBorderLight dark:text-darkTextPrimary dark:placeholder-darkTextMuted"
//                 />
//             </div>

//             <div className="mb-4 text-right">
//                 {(isAdmin || isDepartmentHead) && (
//                     <button
//                         onClick={() => setShowRegisterModal(true)}
//                         className="inline-block bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded transition"
//                     >
//                         + Add New Course
//                     </button>
//                 )}
//             </div>

//             {isLoading ? (
//                 <TopCenterLoader />
//             ) : filteredCourses.length > 0 ? (
//                 <>
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                         {filteredCourses.map((course) => (
//                             <CourseCard
//                                 key={course._id}
//                                 course={course}
//                                 onView={() => handleViewCourse(course._id)}
//                             // onViewOutcomes={() => openOutcomesModal(course._id)}
//                             />
//                         ))}
//                         <AddCard onClick={() => setShowRegisterModal(true)} />
//                     </div>

//                     <PaginationControl
//                         page={page}
//                         totalPages={totalPages}
//                         onPageChange={setPage}
//                     />
//                 </>
//             ) : (
//                 <p className="text-center text-gray-600 mt-8">No courses found.</p>
//             )}

//             {showModal && selectedCourseId && (
//                 <Modal isOpen={showModal} onClose={closeModal}>
//                     <CourseProfile
//                         courseId={selectedCourseId}
//                         fetchCourse={getCourseById}
//                         updateCourse={updateCourse as (id: string, data: Partial<Course>) => Promise<any>}
//                         onDelete={() => {
//                             closeModal();     // close the modal
//                         }}
//                     />
//                 </Modal>
//             )}

//             {showRegisterModal && (
//                 <Modal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)}>
//                     <AddCourseToSemester
//                         onSuccess={() => {
//                             setShowRegisterModal(false);
//                         }} />
//                 </Modal>
//             )}

//             {/* TODO: Add course outcomes view button */}
//             {/* {showOutcomesModal && outcomesCourseId && (
//                 <Modal isOpen={showOutcomesModal} onClose={closeOutcomesModal}>
//                     <div className="p-4">
//                         <CourseViewOutcomes courseId={outcomesCourseId} />
//                     </div>
//                 </Modal>
//             )} */}

//         </div>
//     );
// };


// export default CourseManagement;
