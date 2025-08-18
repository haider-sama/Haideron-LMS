// import { useSelector } from "react-redux";
// import { useQuery } from "react-query";

// import { RootState } from "../../../store/authStore";
// import { fetchStudentPerformance } from "../../../api/lms/intelligence-layer/intelligenceApi";
// import { WeeklyCalendar } from "../../../components/pages/lms/student/WeeklyCalendar";
// import { SummaryCards } from "../../../components/pages/lms/student/dashboard/SummaryCards";
// import PageHeading from "../../../components/ui/PageHeading";
// import Breadcrumbs, { generateBreadcrumbs } from "../../../components/ui/Breadcrumbs";
// import { CourseGradesTable } from "../../../components/pages/lms/student/dashboard/CourseGradesTable.";
// import CLOPerformanceChart from "../../../components/pages/lms/student/dashboard/CLOPerformanceChart";
// import PLOPerformanceChart from "../../../components/pages/lms/student/dashboard/PLOPerformanceChart";
// import TopCenterLoader from "../../../components/ui/TopCenterLoader";
// import InternalError from "../../forbidden/InternalError";
// import NotFound from "../../forbidden/NotFound";
// import { useEffect, useState } from "react";
// import { getEnrolledCourses } from "../../../api/lms/student/courseEnrollmentApi";
// import { ActivatedSemester, EnrolledCourse } from "../../../constants/lms/interfaces";
// import { useToast } from "../../../context/ToastContext";
// import { useDashboards } from "../../../hooks/auth/useDashboards";
// import { usePermissions } from "../../../hooks/usePermissions";

// export function StudentDashboard() {
//     const { user, isLoggedIn } = usePermissions();
//     const { student: studentDashboard } = useDashboards(user?.role, isLoggedIn);

//     const activatedSemesters = studentDashboard.data?.activatedSemesters ?? [];
//     const contextLoading = studentDashboard.isLoading;
//     const error = studentDashboard.isError;

//     const studentId = user?._id;

//     const toast = useToast();
//     const [selectedSemester, setSelectedSemester] = useState<ActivatedSemester | null>(null);
//     const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
//     const [loading, setLoading] = useState(false);

//     // Set default active semester
//     useEffect(() => {
//         if (activatedSemesters.length > 0) {
//             const sorted = [...activatedSemesters]
//                 .filter((s) => s.isActive)
//                 .sort(
//                     (a, b) =>
//                         new Date(b.createdAt || "").getTime() -
//                         new Date(a.createdAt || "").getTime()
//                 );
//             setSelectedSemester(sorted[0] || null);
//         }
//     }, [activatedSemesters]);

//     // Fetch enrolled courses based on selected semester
//     useEffect(() => {
//         if (!selectedSemester) return;

//         setLoading(true);
//         getEnrolledCourses()
//             .then((data) => {
//                 const filtered = data.filter(
//                     (enrollment) =>
//                         enrollment.courseOffering.activatedSemester === selectedSemester._id
//                 );
//                 setEnrolledCourses(filtered);
//             })
//             .catch((err) => {
//                 toast.error(err.message || "Failed to load enrolled courses");
//             })
//             .finally(() => setLoading(false));
//     }, [selectedSemester]);

//     const {
//         data,
//         isLoading,
//         isError,
//     } = useQuery(
//         ["student-performance"],
//         () => fetchStudentPerformance(),
//         {
//             retry: 1,
//             staleTime: 5 * 60 * 1000,
//         }
//     );

//     if (!studentId) {
//         return (
//             <div className="p-4 text-yellow-600">
//                 No student ID found. Are you logged in as a student?
//             </div>
//         );
//     }

//     if (isLoading) return <TopCenterLoader />;
//     if (isError) return <InternalError />;
//     if (!data) return <NotFound />;

//     return (
//         <div className="p-6 md:p-8 space-y-6">
//             <div className="space-y-2">
//                 <Breadcrumbs items={generateBreadcrumbs("/student/dashboard")} />
//                 <PageHeading title={`Welcome, ${user?.firstName || "Student"}!`} />
//             </div>

//             <SummaryCards data={data} />

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <CLOPerformanceChart cloPerformance={data.cloPerformance} />
//                 <PLOPerformanceChart ploPerformance={data.ploPerformance} />
//             </div>

//             <div className="rounded-xl p-4">
//                 <h2 className="text-base font-semibold text-gray-700 mb-4 dark:text-darkTextPrimary">Course Grades</h2>
//                 <CourseGradesTable courseGrades={data.courseGrades} />
//             </div>

//             <div className="rounded-xl p-4">
//                 <WeeklyCalendar
//                     enrolledCourses={enrolledCourses}
//                     activatedSemesters={activatedSemesters}
//                     selectedSemester={selectedSemester}
//                     setSelectedSemester={setSelectedSemester}
//                 />
//             </div>
//         </div>
//     );
// }
