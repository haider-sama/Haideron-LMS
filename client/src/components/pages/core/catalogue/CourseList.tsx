import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { Course } from "../../../../../../server/src/shared/interfaces";
import { useToast } from "../../../../shared/context/ToastContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MultiSelectInput, MultiSelectOption } from "../../../ui/Input";
import { Button } from "../../../ui/Button";
import TopCenterLoader from "../../../ui/TopCenterLoader";
import { getCourses } from "../../../../api/core/course-api";
import { updateSemester } from "../../../../api/core/semester-api";
import { Semester } from "../../../../shared/constants/core/interfaces";

interface CourseListProps {
    semester: Semester;
    allCourses: Course[];
    catalogueId: string;
}

const CourseList: React.FC<CourseListProps> = ({ semester, allCourses, catalogueId }) => {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [selectedCourseIds, setSelectedCourseIds] = useState<MultiSelectOption[]>([]);
    const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

    // Fetch courses in this semester
    const { data: courses = [], isLoading } = useQuery({
        queryKey: ["courses", semester.id],
        queryFn: () => getCourses({ semesterId: semester.id }).then((res) => res.courses),
        enabled: !!semester.id,
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    const existingCourseIds = semester.semesterCourses?.map(sc => sc.courseId) ?? [];
    const availableCourses = allCourses.filter(c => !existingCourseIds.includes(c.id));

    // Update semester courses mutation
    const mutation = useMutation({
        mutationFn: (payload: { courses: string[] }) =>
            updateSemester(semester.id, payload),
        onSuccess: () => {
            toast.success("Semester updated");
            queryClient.invalidateQueries({ queryKey: ["courses", semester.id] });
            queryClient.invalidateQueries({ queryKey: ["semesters", catalogueId] });
        },
        onError: (err: any) => {
            if (err.fieldErrors) {
                const fieldErrors = err.fieldErrors as Record<string, string[]>;
                for (const messages of Object.values(fieldErrors)) {
                    messages.forEach((msg) => toast.error(msg));
                }
            } else {
                toast.error(err.message || "Failed to update semester");
            }
        },
    });

    const handleAddCourse = () => {
        const existingIds = courses.map((c) => c.id); // <- from query, always fresh
        const newIds = selectedCourseIds
            .map((opt) => opt.value)
            .filter((id) => !existingIds.includes(id));

        if (newIds.length === 0) {
            toast.error("Please select at least one new course");
            return;
        }

        mutation.mutate({ courses: [...existingIds, ...newIds] });
        setSelectedCourseIds([]);
    };

    const handleRemove = async (courseId: string) => {
        setDeletingCourseId(courseId);

        // Always base off latest query data
        const existingIds = courses.map((c) => c.id);
        const updatedCourses = existingIds.filter((id) => id !== courseId);

        await mutation.mutateAsync({ courses: updatedCourses });
        setDeletingCourseId(null);
    };

    if (isLoading) return <TopCenterLoader />;

    return (
        <div className="space-y-2">
            {courses && courses.length > 0 ? (
                courses.map((course) => (
                    <div
                        key={course.id}
                        className="flex justify-between items-center bg-gray-100 dark:bg-darkMuted border border-gray-200 dark:border-darkBorderLight px-4 py-2 rounded"
                    >
                        <p className="text-sm font-medium text-gray-800 dark:text-darkTextPrimary">
                            {course.code}
                            {course.subjectType === "Lab" ? "L" : ""} - {course.title}
                        </p>
                        <button
                            onClick={() => handleRemove(course.id)}
                            disabled={deletingCourseId === course.id}
                            className={`flex items-center gap-1 px-2 py-1 text-sm rounded ${deletingCourseId === course.id
                                ? "bg-red-300 text-white cursor-not-allowed dark:bg-red-500"
                                : "text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                }`}
                        >
                            <FiTrash2 className="inline" />
                            {deletingCourseId === course.id ? "Deleting..." : "Remove"}
                        </button>
                    </div>
                ))
            ) : (
                <p className="text-sm py-2 text-gray-500 dark:text-darkTextMuted">
                    No courses found. Add one below.
                </p>
            )}

            <div className="flex gap-2 mt-4">
                <div className="w-80">
                    <MultiSelectInput
                        label="Add Courses"
                        options={availableCourses.map((c) => ({
                            label: `${c.code} - ${c.title}`,
                            value: c.id,
                        }))}
                        value={selectedCourseIds}
                        onChange={setSelectedCourseIds}
                    />
                </div>
                <div className="self-end">
                    <Button
                        loadingText="Adding..."
                        isLoading={mutation.isPending}
                        disabled={mutation.isPending}
                        onClick={handleAddCourse}
                        fullWidth={false}
                        variant="blue"
                    >
                        Add Course
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CourseList;