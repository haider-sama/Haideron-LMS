import { useEffect, useState } from "react";
import PageHeading from "../../../components/ui/PageHeading";
import Modal from "../../../components/ui/Modal";
import { IoMdStats } from "react-icons/io";
import Breadcrumbs, { generateBreadcrumbs } from "../../../components/ui/Breadcrumbs";
import TopCenterLoader from "../../../components/ui/TopCenterLoader";
import { getTranscript } from "../../../api/core/student-api";
import { TranscriptResponse } from "../../../constants/core/interfaces";
import { useQuery } from "@tanstack/react-query";
import ErrorStatus from "../../../components/ui/ErrorStatus";
import { useToast } from "../../../context/ToastContext";

const statusColors: Record<string, string> = {
    Confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    Rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const StudentTranscriptPage = () => {
    const [showGpaModal, setShowGpaModal] = useState(false);
    const toast = useToast();

    const {
        data: transcript,
        isLoading,
        isError,
        error,
    } = useQuery<TranscriptResponse, Error>({
        queryKey: ["studentTranscript"],
        queryFn: () => getTranscript(),
        staleTime: 1000 * 60 * 5, // cache for 5 mins
        retry: false,
    });

    // Handle errors outside the query function
    useEffect(() => {
        if (isError && error) {
            toast.error(error.message || "Failed to load transcript");
        }
    }, [isError, error, toast]);
    
    if (isLoading) return <TopCenterLoader />;

    if (isError || !transcript) {
        return (
            <div className="flex items-center justify-center p-6">
                {isError ? (
                    <ErrorStatus
                        message={`Failed to load transcript: ${(error as Error).message}`}
                    />
                ) : (
                    <div className="text-center text-gray-600 dark:text-darkTextSecondary">
                        No transcript available.
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-8">
            <Breadcrumbs items={generateBreadcrumbs("/student/transcript")} />

            <PageHeading title="Academic Transcript" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-darkSurface py-8 px-4 sm:px-6 rounded-xl">
                <div className="text-md font-semibold text-primary dark:text-darkTextPrimary">
                    Cumulative GPA (CGPA):{" "}
                    <span className="text-blue-600 dark:text-darkBlurple">
                        {transcript.cgpa}
                    </span>
                </div>

                <button
                    onClick={() => setShowGpaModal(true)}
                    className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-400 dark:bg-darkBlurple text-white rounded-full text-sm font-medium shadow hover:bg-blue-600 dark:hover:bg-darkBlurpleHover focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-darkTextSecondary/30 focus:ring-offset-2 transition"
                    aria-label="Show Semester GPAs"
                    title="Show Semester GPAs"
                >
                    <IoMdStats size={16} />
                    Semester GPAs
                </button>
            </div>

            {/* Transcript Table */}
            <div className="overflow-x-auto rounded-sm shadow-sm border border-gray-300 dark:border-darkBorderLight mt-6">
                <table className="w-full table-auto text-sm text-left text-gray-800 dark:text-darkTextPrimary">
                    <thead className="bg-gray-50 border-b border-gray-300 dark:bg-darkMuted text-gray-700 dark:text-darkTextSecondary uppercase text-xs tracking-wide">
                        <tr>
                            <th className="px-4 py-2 font-semibold">Semester</th>
                            <th className="px-4 py-2 font-semibold">Course</th>
                            <th className="px-4 py-2 text-center font-semibold">Credits</th>
                            <th className="px-4 py-2 text-center font-semibold">Grade Point</th>
                            <th className="px-4 py-2 text-center font-semibold">Grade</th>
                            <th className="px-4 py-2 text-center font-semibold">Status</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200 dark:divide-darkBorderMuted">
                        {transcript?.semesters?.length ? (
                            transcript.semesters.map((sem) =>
                                sem.courses.map((course, idx) => {
                                    const status = (course.status || "-") as string;
                                    return (
                                        <tr
                                            key={`${sem.semesterNo}-${course.courseCode}-${idx}`}
                                            className="hover:bg-gray-100 dark:hover:bg-darkMuted transition-colors"
                                        >
                                            {idx === 0 && (
                                                <td
                                                    rowSpan={sem.courses.length}
                                                    className="px-4 py-2 align-top font-medium text-gray-900 dark:text-darkTextPrimary whitespace-nowrap bg-white dark:bg-darkSurface"
                                                >
                                                    {sem.term} {sem.sessionYear}
                                                </td>
                                            )}
                                            <td className="px-4 py-2 whitespace-nowrap bg-white dark:bg-darkSurface">
                                                <div className="font-medium text-gray-600 dark:text-darkTextSecondary">
                                                    {course.courseCode} - {course.courseTitle}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-center bg-white dark:bg-darkSurface">
                                                {course.creditHours}
                                            </td>
                                            <td className="px-4 py-2 text-center bg-white dark:bg-darkSurface">
                                                {course.gradePoint}
                                            </td>
                                            <td className="px-4 py-2 text-center bg-white dark:bg-darkSurface">
                                                {course.grade}
                                            </td>
                                            <td className="px-4 py-2 text-center bg-white dark:bg-darkSurface">
                                                {status !== "-" ? (
                                                    <span
                                                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[status] ||
                                                            "bg-gray-200 text-gray-800 dark:bg-darkMuted dark:text-darkTextSecondary"
                                                            }`}
                                                    >
                                                        {status}
                                                    </span>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )
                        ) : (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="p-4 text-center text-gray-600 dark:text-darkTextSecondary text-base"
                                >
                                    Transcript not available yet. Check back soon!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal for Semester GPAs */}
            {showGpaModal && (
                <Modal isOpen={showGpaModal} onClose={() => setShowGpaModal(false)}>
                    <div className="p-6 max-w-md mx-auto bg-white dark:bg-darkSurface rounded-xl shadow">
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-darkTextPrimary text-center mb-6">
                            Semester GPAs
                        </h2>

                        <ul className="divide-y divide-gray-300 dark:divide-darkBorderMuted">
                            {transcript.semesters.map((sem) => (
                                <li
                                    key={sem.semesterNo}
                                    className="py-4 flex justify-between font-medium text-gray-700 dark:text-darkTextSecondary text-lg"
                                >
                                    <span>
                                        {sem.term} {sem.sessionYear} (Semester {sem.semesterNo})
                                    </span>
                                    <span className="text-blue-600 dark:text-darkBlurple font-medium">
                                        GPA: {sem.gpa}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default StudentTranscriptPage;