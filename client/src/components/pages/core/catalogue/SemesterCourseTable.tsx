import { useState } from "react";
import { FiChevronUp, FiTrash2, FiEdit3 } from "react-icons/fi";
import { MultiSelectOption } from "../../../ui/Input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../../../context/ToastContext";
import TopCenterLoader from "../../../ui/TopCenterLoader";
import { getCourses } from "../../../../api/core/course-api";
import CourseList from "./CourseList";
import { deleteSemester, getSemestersByCatalogue } from "../../../../api/core/semester-api";
import { MAX_PAGE_LIMIT } from "../../../../constants";
import React from "react";
import { Semester } from "../../../../constants/core/interfaces";

interface SemesterCourseTableProps {
    catalogueId: string;
}

const SemesterCourseTable: React.FC<SemesterCourseTableProps> = ({ catalogueId }) => {
    const [expandedSemesterId, setExpandedSemesterId] = useState<string | null>(null);
    const [selectedCourseIds, setSelectedCourseIds] = useState<MultiSelectOption[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const queryClient = useQueryClient();
    const toast = useToast();

    // Fetch semesters for this catalogue
    const { data: semesters, isLoading: loadingSemesters } = useQuery({
        queryKey: ["semesters", catalogueId],
        queryFn: () => getSemestersByCatalogue(catalogueId).then((res) => res.semesters),
        enabled: !!catalogueId,
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    // Fetch all courses (for CourseList)
    const { data: allCourses = [], isFetching: coursesLoading } = useQuery({
        queryKey: ["allCourses", searchTerm], // include searchTerm in key so it refetches
        queryFn: () =>
            getCourses({
                page: 1,
                limit: MAX_PAGE_LIMIT,
                search: searchTerm
            }).then((res) => res.courses),
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    // console.log(allCourses)

    const toggleExpand = (id: string) => {
        setExpandedSemesterId((prev) => (prev === id ? null : id));
        setSelectedCourseIds([]);
    };

    // Delete semester mutation
    const deleteSemesterMutation = useMutation({
        mutationFn: (id: string) => deleteSemester(id),
        onSuccess: () => {
            toast.success("Semester deleted");
            queryClient.invalidateQueries({ queryKey: ["semesters", catalogueId] });
        },
        onError: () => {
            toast.error("Failed to delete semester");
        },
    });

    if (loadingSemesters || coursesLoading) return <TopCenterLoader />;

    return (
        <div className="mt-8 max-w-5xl mx-auto px-4">
            <h3 className="text-2xl font-bold text-center mb-10 text-gray-800 dark:text-darkTextPrimary">
                Catalogue Semesters
            </h3>

            <div className="overflow-x-auto border border-gray-300 rounded-sm shadow-sm bg-white dark:bg-darkSurface dark:border-darkBorderLight">
                <table className="min-w-full text-left">
                    <thead className="bg-gray-100 border-b border-gray-300 text-gray-700 dark:bg-darkMuted dark:text-darkTextMuted uppercase text-xs tracking-wider">
                        <tr>
                            <th className="px-4 py-2 w-1/3">Semester</th>
                            <th className="px-4 py-2 text-center w-1/3">Total Courses</th>
                            <th className="px-4 py-2 text-center w-1/3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {semesters?.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="text-center py-6 text-gray-500 dark:text-darkTextMuted"
                                >
                                    No semesters found.
                                </td>
                            </tr>
                        ) : (
                            semesters?.map((sem: Semester) => {
                                const isExpanded = expandedSemesterId === sem.id;
                                const courseCount = sem.semesterCourses?.length ?? 0;
                                
                                return (
                                    <React.Fragment key={sem.id}>
                                        <tr className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-darkMuted transition border-gray-200 dark:border-darkBorderLight">
                                            <td className="px-4 py-2 font-medium text-gray-900 dark:text-darkTextPrimary">
                                                Semester {sem.semesterNo}
                                            </td>
                                            <td className="px-4 py-2 text-center text-gray-700 dark:text-darkTextSecondary">
                                                {courseCount}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <div className="flex justify-center items-center gap-4">
                                                    <button
                                                        onClick={() => toggleExpand(sem.id)}
                                                        className="text-blue-600 hover:text-blue-800 dark:text-darkBlurple dark:hover:text-darkBlurpleHover transition"
                                                        title={isExpanded ? "Collapse" : "Expand to edit"}
                                                    >
                                                        {isExpanded ? <FiChevronUp size={16} /> : <FiEdit3 size={16} />}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const first = window.confirm(
                                                                "Are you sure you want to delete this semester?"
                                                            );
                                                            if (!first) return;
                                                            const second = window.confirm(
                                                                "This action is irreversible. Confirm delete?"
                                                            );
                                                            if (!second) return;
                                                            deleteSemesterMutation.mutate(sem.id);
                                                        }}
                                                        className="text-red-600 hover:text-red-800 transition"
                                                        disabled={deleteSemesterMutation.isPending}
                                                        title="Delete semester"
                                                    >
                                                        <FiTrash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr className="border-b dark:border-darkBorderLight bg-gray-50 dark:bg-darkSurface">
                                                <td colSpan={3} className="p-6">
                                                    <CourseList
                                                        semester={sem}
                                                        allCourses={allCourses}
                                                        catalogueId={catalogueId}
                                                    />
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SemesterCourseTable;