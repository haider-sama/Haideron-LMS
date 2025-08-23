import React, { useEffect, useState } from "react";
import { usePermissions } from "../../../hooks/usePermissions";
import { useToast } from "../../../context/ToastContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBatchesByProgram } from "../../../api/core/batch/batch-api";
import { createStudentBatchEnrollment, fetchPaginatedStudentsByDepartment } from "../../../api/core/batch/batch-enrollment-api";
import { AudienceEnum, BatchEnrollmentStatus } from "../../../../../server/src/shared/enums";
import { Helmet } from "react-helmet-async";
import Breadcrumbs, { generateBreadcrumbs } from "../../../components/ui/Breadcrumbs";
import { GLOBAL_TITLE, MAX_PAGE_LIMIT } from "../../../constants";
import PageHeading from "../../../components/ui/PageHeading";
import { SelectInput } from "../../../components/ui/Input";
import TopCenterLoader from "../../../components/ui/TopCenterLoader";
import { Pagination } from "../../../components/ui/Pagination";
import { getPrograms } from "../../../api/core/program-api";
import { useUserManagement } from "../../../hooks/admin/useUserManagement";
import { FiCheckCircle, FiUserPlus } from "react-icons/fi";
import { Button } from "../../../components/ui/Button";
import { User } from "../../../../../server/src/shared/interfaces";

interface StudentWithEnrollmentStatus extends User {
    isAlreadyEnrolled: boolean;
}

const StudentBatchRegistration: React.FC = () => {
    const { user, isAdmin, isDepartmentHead } = usePermissions();
    const toast = useToast();


    const { page, setPage, debouncedSearch } =
        useUserManagement(user?.role as AudienceEnum);

    const [selectedProgramId, setSelectedProgramId] = useState("");
    const [selectedBatchId, setSelectedBatchId] = useState("");
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [status, setStatus] = useState<BatchEnrollmentStatus>(BatchEnrollmentStatus.Active);
    const [search, setSearch] = useState("");
    const [hideAlreadyEnrolled, setHideAlreadyEnrolled] = useState(false);

    const queryClient = useQueryClient();

    useEffect(() => setPage(1), [hideAlreadyEnrolled]);

    // --- Queries ---

    const programsQuery = useQuery({
        queryKey: ["programs", user?.role],
        queryFn: async () => {
            if (!user) return [];
            const { programs } = await getPrograms({ page: 1, limit: MAX_PAGE_LIMIT });
            return programs || [];
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    const programs = programsQuery.data || [];

    // Batches query
    const batchesQuery = useQuery({
        queryKey: ["batches", selectedProgramId],
        queryFn: async () => {
            const data = await getBatchesByProgram(selectedProgramId);
            return data.batches || [];
        },
        enabled: !!selectedProgramId,
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    const batches = batchesQuery.data || [];

    // Reset selected batch when batches change
    useEffect(() => {
        setSelectedBatchId(""); // reset batch selection when program changes
    }, [selectedProgramId]);

    // Students query
    const studentsQuery = useQuery({
        queryKey: ["students", selectedProgramId, page, debouncedSearch, hideAlreadyEnrolled],
        queryFn: async () => {
            if (!selectedProgramId) return { data: [], totalPages: 1 };

            const program = programs.find((p) => p.id === selectedProgramId);
            if (!program) return { data: [], totalPages: 1 };

            const studentRes = await fetchPaginatedStudentsByDepartment(
                program.departmentTitle,
                page,
                MAX_PAGE_LIMIT,
                debouncedSearch,
                hideAlreadyEnrolled
            );

            return { data: studentRes.data as StudentWithEnrollmentStatus[], totalPages: studentRes.totalPages };
        },
        enabled: !!selectedProgramId && programs.length > 0,
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    const studentsData = studentsQuery.data?.data || [];
    const totalPages = studentsQuery.data?.totalPages || 1;
    const isStudentsLoading = studentsQuery.isLoading;

    // Clear selected students whenever studentsData changes
    useEffect(() => {
        setSelectedStudentIds(new Set());
    }, [studentsData.length]); // only runs when number of students changes

    // --- Mutation ---

    const enrollMutation = useMutation({
        mutationFn: async () => {
            if (selectedStudentIds.size === 0) return;

            await createStudentBatchEnrollment({
                studentIds: Array.from(selectedStudentIds), // send all selected students
                programBatchId: selectedBatchId,
                status,
            });
        },
        onSuccess: () => {
            toast.success("Students enrolled successfully!");
            queryClient.invalidateQueries({ queryKey: ["batches", selectedProgramId] });
            setSelectedStudentIds(new Set());
            setPage(1);
            queryClient.invalidateQueries({ queryKey: ["students", selectedProgramId] });
        },
        onError: (err: any) => {
            if (err.validationErrors && typeof err.validationErrors === "object") {
                const fieldErrors = err.validationErrors as Record<string, string[]>;
                for (const [field, messages] of Object.entries(fieldErrors)) {
                    toast.error(`${field}: ${messages.join(", ")}`);
                }
            } else {
                toast.error(`Error: ${err.message}`);
            }
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedBatchId || selectedStudentIds.size === 0) {
            toast.error("Please select at least one student and a batch.");
            return;
        }

        enrollMutation.mutate();
    };

    // --- Filtered students for search ---
    const filteredStudents = studentsData.filter((s) =>
        `${s.firstName ?? ""}${s.lastName ?? ""}${s.email ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    return (
        <div className="p-8 max-w-6xl mx-auto overflow-x-auto">
            <div className="max-w-6xl">
                <Helmet>
                    <title>{GLOBAL_TITLE} - Session Management - Register Batch Students</title>
                </Helmet>
                <Breadcrumbs items={generateBreadcrumbs('/batches/enrollments/student-batch')} />

                <div className="mt-2 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <PageHeading title="Register Batch Students" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault(); // prevents form submission on Enter
                            }
                        }}
                        placeholder="Search students by name or email..."
                        className="border border-gray-300 rounded px-4 py-2 w-full md:max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm
                        dark:bg-darkSurface dark:border-darkBorderLight dark:text-darkTextPrimary dark:placeholder-darkTextMuted"
                    />
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                className="w-full space-y-6 border p-6 border-gray-200 dark:border-darkBorderLight rounded-lg"
            >
                <h2 className="text-xl font-bold text-center">Enroll Student in Batch</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(isAdmin || isDepartmentHead) ? (
                        <SelectInput
                            label="Program"
                            value={selectedProgramId}
                            onChange={(e) => setSelectedProgramId(e.target.value)}
                            options={programs.map((p) => ({ label: p.title, value: p.id }))}
                        />
                    ) : (
                        <div>
                            <label className="block mb-1">Program</label>
                            <div className="border p-2 rounded bg-gray-100 text-gray-500 italic">
                                Not allowed to select program
                            </div>
                        </div>
                    )}

                    <SelectInput
                        label="Batch"
                        value={selectedBatchId}
                        onChange={(e) => setSelectedBatchId(e.target.value)}
                        options={[
                            ...batches.map((b) => ({ label: String(b.sessionYear), value: b.id })),
                        ]}
                        disabled={!batches.length}
                    />

                    <SelectInput
                        label="Status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as BatchEnrollmentStatus)}
                        options={Object.values(BatchEnrollmentStatus).map((s) => ({
                            label: s,
                            value: s,
                        }))}
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Select a student:</h3>
                        <label className="flex items-center space-x-2 text-sm">
                            <input
                                type="checkbox"
                                checked={hideAlreadyEnrolled}
                                onChange={(e) => setHideAlreadyEnrolled(e.target.checked)}
                            />
                            <span>Hide already enrolled</span>
                        </label>
                    </div>

                    {isStudentsLoading && <TopCenterLoader />}

                    <div className="overflow-x-auto border border-gray-300 rounded-sm shadow-sm bg-white dark:bg-darkSurface dark:border-darkBorderLight">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-700 border-b border-gray-300 uppercase text-xs tracking-wide dark:bg-darkMuted dark:text-gray-300">
                                <tr>
                                    <th className="px-4 py-2 text-center">
                                        <input
                                            type="checkbox"
                                            className="accent-blue-500 dark:accent-blue-400"
                                            // true only if all *eligible* students are selected
                                            checked={
                                                filteredStudents.filter((s) => !s.isAlreadyEnrolled).length > 0 &&
                                                filteredStudents
                                                    .filter((s) => !s.isAlreadyEnrolled)
                                                    .every((s) => selectedStudentIds.has(s.id))
                                            }
                                            // indeterminate if some but not all are selected
                                            ref={(el) => {
                                                if (el) {
                                                    const eligible = filteredStudents.filter((s) => !s.isAlreadyEnrolled);
                                                    el.indeterminate =
                                                        eligible.some((s) => selectedStudentIds.has(s.id)) &&
                                                        !eligible.every((s) => selectedStudentIds.has(s.id));
                                                }
                                            }}
                                            onChange={(e) => {
                                                const eligible = filteredStudents.filter((s) => !s.isAlreadyEnrolled);
                                                const newSet = new Set(selectedStudentIds);
                                                if (e.target.checked) {
                                                    eligible.forEach((s) => newSet.add(s.id));
                                                } else {
                                                    eligible.forEach((s) => newSet.delete(s.id));
                                                }
                                                setSelectedStudentIds(newSet);
                                            }}
                                        />
                                    </th>
                                    <th className="px-4 py-2">Name</th>
                                    <th className="px-4 py-2">Email</th>
                                    <th className="px-4 py-2">Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {isStudentsLoading ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="text-center px-4 py-6 text-gray-500 dark:text-gray-400"
                                        >
                                            Loading students...
                                        </td>
                                    </tr>
                                ) : filteredStudents.length > 0 ? (
                                    filteredStudents.map((s) => (
                                        <tr
                                            key={s.id}
                                            className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-darkMuted transition dark:border-darkBorderLight"
                                        >
                                            <td className="px-4 py-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    value={s.id}
                                                    checked={selectedStudentIds.has(s.id)}
                                                    disabled={s.isAlreadyEnrolled}
                                                    onChange={(e) => {
                                                        const newSet = new Set(selectedStudentIds);
                                                        if (e.target.checked) newSet.add(s.id);
                                                        else newSet.delete(s.id);
                                                        setSelectedStudentIds(newSet);
                                                    }}
                                                    className="accent-blue-500 dark:accent-blue-400"
                                                />
                                            </td>

                                            <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-800 dark:text-gray-100">
                                                {s.firstName} {s.lastName}
                                            </td>

                                            <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                                {s.email}
                                            </td>

                                            <td className="px-4 py-2">
                                                {s.isAlreadyEnrolled ? (
                                                    <span className="inline-flex items-center gap-1 text-yellow-600 font-medium text-xs bg-yellow-100 border border-yellow-300 px-2 py-1 rounded-full dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-600">
                                                        <FiCheckCircle className="w-4 h-4" />
                                                        Already Enrolled
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-purple-600 font-medium text-xs bg-purple-100 border border-purple-300 px-2 py-1 rounded-full dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-600">
                                                        <FiUserPlus className="w-4 h-4" />
                                                        Eligible
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="text-center px-4 py-6 text-gray-500 dark:text-gray-400"
                                        >
                                            No students found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>

                <div className="text-center">
                    <Button
                        isLoading={enrollMutation.isPending}
                        loadingText="Enrolling..."
                        disabled={enrollMutation.isPending}
                        fullWidth={false}
                    >
                        Enroll Student
                    </Button>
                </div>

                <div className="flex justify-end">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </div>

            </form>

        </div>
    );
};

export default StudentBatchRegistration;
