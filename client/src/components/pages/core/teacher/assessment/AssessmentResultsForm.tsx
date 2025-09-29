import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "../../../../../shared/context/ToastContext";
import TopCenterLoader from "../../../../ui/TopCenterLoader";
import { AssessmentResultEntry } from "../../../../../shared/constants/core/interfaces";
import { fetchEnrolledStudentsForCourse } from "../../../../../api/core/teacher/teacher-course-api";
import { getAssessmentResults, submitBulkAssessmentResults } from "../../../../../api/core/teacher/assessment-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ErrorStatus from "../../../../ui/ErrorStatus";
import { Button } from "../../../../ui/Button";
import { useUserManagement } from "../../../../../hooks/admin/useUserManagement";
import { AudienceEnum } from "../../../../../../../server/src/shared/enums";
import { usePermissions } from "../../../../../features/auth/hooks/usePermissions";
import { Pagination } from "../../../../ui/Pagination";
import { DropdownEditor } from "../../../../ui/DropdownEditor";
import { SelectInput } from "../../../../ui/Input";

interface Props {
    offeringId: string;
    section: string;
    assessmentId: string;
    onClose: () => void;
}

const LOCAL_MAX_PAGE_LIMIT = 100;

const AssessmentResultsForm: React.FC<Props> = ({
    offeringId,
    section,
    assessmentId,
    onClose,
}) => {
    const [marks, setMarks] = useState<Record<string, { marksObtained: string; totalMarks: string }>>({});
    const [editableCell, setEditableCell] = useState<{ rowIndex: number; field: string } | null>(null);
    const [tempValue, setTempValue] = useState("");
    const [limit, setLimit] = useState<number>(10); // default limit
    const [inputLimit, setInputLimit] = useState<string>("10"); // controlled input

    const toast = useToast();
    const queryClient = useQueryClient();

    const { user } = usePermissions();
    const { page, setPage, search, setSearch, debouncedSearch } =
        useUserManagement(user?.role as AudienceEnum);

    const onCellDoubleClick = (rowIndex: number, field: string, value: string) => {
        setEditableCell({ rowIndex, field });
        setTempValue(value);
    };

    const onCancel = () => {
        setEditableCell(null);
        setTempValue("");
    };

    const onSave = (studentId: string, field: "marksObtained" | "totalMarks") => {
        handleMarksChange(studentId, field, tempValue);
        setEditableCell(null);
        setTempValue("");
    };

    // Update limit when user clicks button
    const handleUpdateLimit = () => {
        const parsed = parseInt(inputLimit);
        if (!isNaN(parsed) && parsed > 0 && parsed <= LOCAL_MAX_PAGE_LIMIT) {
            setLimit(parsed);
            setPage(1); // reset to first page
        } else {
            toast.error(`Please enter a valid number (1-${LOCAL_MAX_PAGE_LIMIT})`);
        }
    };

    // Queries
    const {
        data: studentsData,
        isLoading: studentsLoading,
        error: studentsError,
    } = useQuery({
        queryKey: ["students", offeringId, section, debouncedSearch, page, limit],
        queryFn: () =>
            fetchEnrolledStudentsForCourse(offeringId, section, {
                page,
                limit,
                search: debouncedSearch,
            }),
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    const totalPages = studentsData?.totalPages || 1;

    const {
        data: resultsData,
        isLoading: resultsLoading,
        error: resultsError,
    } = useQuery({
        queryKey: ["assessmentResults", assessmentId],
        queryFn: () => getAssessmentResults(assessmentId),
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    const submitMutation = useMutation({
        mutationFn: (resultsPayload: AssessmentResultEntry[]) =>
            submitBulkAssessmentResults(assessmentId, resultsPayload),
        onSuccess: () => {
            toast.success("Results submitted successfully.");
            queryClient.invalidateQueries({ queryKey: ["assessmentResults", assessmentId] });
            onClose();
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to submit results");
        },
    });

    // Prepare marks state once data arrives
    const students = studentsData?.students || [];

    // Map results by studentId
    const resultsMap = useMemo(() => {
        return (
            resultsData?.results.reduce((acc, r) => {
                acc[r.studentId] = {
                    marksObtained: String(r.marksObtained),
                    totalMarks: String(r.totalMarks),
                };
                return acc;
            }, {} as Record<string, { marksObtained: string; totalMarks: string }>) || {}
        );
    }, [resultsData]);

    // Merge results into marks state
    useEffect(() => {
        if (students.length === 0) return;

        setMarks((prev) => {
            const updatedMarks: Record<string, { marksObtained: string; totalMarks: string }> = { ...prev };

            students.forEach((student) => {
                const existing = prev[student.id] || { marksObtained: "", totalMarks: "" };
                const fromResults = resultsMap[student.id] || { marksObtained: "", totalMarks: "" };

                // Merge: prioritize existing edits, fallback to fetched results
                updatedMarks[student.id] = {
                    marksObtained: existing.marksObtained || fromResults.marksObtained,
                    totalMarks: existing.totalMarks || fromResults.totalMarks,
                };
            });

            return updatedMarks;
        });
    }, [students, resultsMap]);

    const handleMarksChange = (
        studentId: string,
        field: "marksObtained" | "totalMarks",
        value: string
    ) => {
        setMarks((prev) => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value,
            },
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const resultsPayload: AssessmentResultEntry[] = Object.entries(marks).map(
            ([studentId, { marksObtained, totalMarks }]) => ({
                studentId,
                marksObtained: parseFloat(marksObtained || "0"),
                totalMarks: parseFloat(totalMarks || "0"),
            })
        );

        submitMutation.mutate(resultsPayload);
    };

    if (studentsError) return <ErrorStatus message={`Error: ${(studentsError as Error).message}`} />;
    if (resultsError) return <ErrorStatus message={`Error: ${(resultsError as Error).message}`} />;

    return (
        <div className="text-gray-900 dark:text-darkTextPrimary">
            <h2 className="text-lg font-semibold mb-4 text-center">Submit Results</h2>

            {(studentsLoading || resultsLoading) && <TopCenterLoader />}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                {/* Search Box */}
                <input
                    type="text"
                    placeholder="Search students..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-darkBorderLight rounded bg-white dark:bg-darkSurface text-gray-900 dark:text-darkTextPrimary placeholder-gray-500 dark:placeholder-darkTextMuted"
                />

                {/* Limit Input + Button */}
                <div className="flex items-center space-x-2">
                    <SelectInput
                        value={inputLimit}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setInputLimit(e.target.value)}
                        options={Array.from({ length: 10 }, (_, i) => {
                            const val = (i + 1) * 10;
                            return { label: val.toString(), value: val.toString() };
                        })}
                        className="w-32 text-sm"
                    />
                    <Button onClick={handleUpdateLimit} size="sm" variant="blue">
                        Set Limit
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="border border-gray-300 dark:border-darkBorderLight rounded-sm mb-6">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-100 border-b border-gray-300 dark:bg-darkSidebar text-gray-700 dark:text-darkTextSecondary uppercase text-xs">
                            <tr>
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2">Email</th>
                                <th className="px-4 py-2">Marks Obtained</th>
                                <th className="px-4 py-2">Total Marks</th>
                            </tr>
                        </thead>

                        <tbody className="bg-white dark:bg-darkSurface text-gray-800 dark:text-darkTextPrimary divide-y divide-gray-200 dark:divide-darkBorderMuted">
                            {(studentsLoading || resultsLoading) ? (
                                <tr>
                                    <td colSpan={4} className="py-6 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <TopCenterLoader />
                                            <span className="text-sm text-gray-500 dark:text-darkTextMuted">Loading students...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-4 text-gray-500 dark:text-darkTextMuted">
                                        No students found
                                    </td>
                                </tr>
                            ) : (
                                students.map((student, rowIndex) => (
                                    <tr
                                        key={student.id}
                                        className={`border-b last:border-0 border-gray-200 dark:border-darkBorderLight hover:bg-gray-100 dark:hover:bg-darkMuted transition 
              ${marks[student.id]?.marksObtained && marks[student.id]?.totalMarks
                                                ? "bg-green-50 dark:bg-green-900/20"
                                                : ""}`}
                                    >
                                        {/* Student Name */}
                                        <td className="px-4 py-2">{student.name}</td>

                                        {/* Student Email */}
                                        <td className="px-4 py-2">{student.email}</td>

                                        {/* Editable Marks Obtained */}
                                        <td
                                            className="p-2 border-l border-gray-300 dark:border-darkBorderLight cursor-pointer relative"
                                            onDoubleClick={() => onCellDoubleClick(rowIndex, "marksObtained", marks[student.id]?.marksObtained || "")}
                                        >
                                            {editableCell?.rowIndex === rowIndex && editableCell?.field === "marksObtained" ? (
                                                <DropdownEditor
                                                    tempValue={tempValue}
                                                    setTempValue={setTempValue}
                                                    onCancel={onCancel}
                                                    onSave={() => onSave(student.id, "marksObtained")}
                                                    type="number"
                                                />
                                            ) : (
                                                marks[student.id]?.marksObtained || "-"
                                            )}
                                        </td>

                                        {/* Editable Total Marks */}
                                        <td
                                            className="p-2 border-l border-gray-300 dark:border-darkBorderLight cursor-pointer relative"
                                            onDoubleClick={() => onCellDoubleClick(rowIndex, "totalMarks", marks[student.id]?.totalMarks || "")}
                                        >
                                            {editableCell?.rowIndex === rowIndex && editableCell?.field === "totalMarks" ? (
                                                <DropdownEditor
                                                    tempValue={tempValue}
                                                    setTempValue={setTempValue}
                                                    onCancel={onCancel}
                                                    onSave={() => onSave(student.id, "totalMarks")}
                                                    type="number"
                                                />
                                            ) : (
                                                marks[student.id]?.totalMarks || "-"
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>


                <div className="flex justify-center">
                    <Button
                        isLoading={submitMutation.isPending}
                        loadingText="Submitting..."
                        disabled={submitMutation.isPending}
                        fullWidth={false}
                    >
                        Submit Results
                    </Button>
                </div>
            </form>

            <div className="flex justify-end">
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={(newPage) => setPage(newPage)}
                />
            </div>
        </div>
    );
};

export default AssessmentResultsForm;
