import React, { useState } from "react";
import { usePermissions } from "../../../hooks/usePermissions";
import { useToast } from "../../../context/ToastContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPrograms } from "../../../api/core/program-api";
import { getBatchesByProgram } from "../../../api/core/batch/batch-api";
import { createStudentBatchEnrollment, listStudentsInBatch, reinstateStudentInBatch, removeStudentFromBatch, softRemoveStudentFromBatch } from "../../../api/core/batch/batch-enrollment-api";
import { BatchEnrollmentStatus } from "../../../../../server/src/shared/enums";
import { Helmet } from "react-helmet-async";
import Breadcrumbs, { generateBreadcrumbs } from "../../../components/ui/Breadcrumbs";
import { GLOBAL_TITLE, MAX_PAGE_LIMIT } from "../../../constants";
import PageHeading from "../../../components/ui/PageHeading";
import { SelectInput } from "../../../components/ui/Input";
import TopCenterLoader from "../../../components/ui/TopCenterLoader";
import { FaTrash, FaUserMinus, FaUserPlus, FaUserSlash } from "react-icons/fa";

const EnrolledStudentsList: React.FC = () => {
    const { user, isAdmin, isDepartmentHead } = usePermissions();

    const [selectedProgramId, setSelectedProgramId] = useState("");
    const [selectedBatchId, setSelectedBatchId] = useState("");
    const [search, setSearch] = useState("");

    const toast = useToast();
    const queryClient = useQueryClient();

    // --- Programs ---
    const { data: programsData } = useQuery({
        queryKey: ["programs", user?.id],
        queryFn: () => getPrograms({ page: 1, limit: MAX_PAGE_LIMIT }),
        enabled: !!user,
    });

    // --- Batches ---
    const { data: batches = [] } = useQuery({
        queryKey: ["batches", selectedProgramId],
        queryFn: () => getBatchesByProgram(selectedProgramId).then((res) => res.batches || []),
        enabled: !!selectedProgramId,
    });


    // --- Students ---
    const { data: studentsData = [], isLoading: isStudentsLoading } = useQuery({
        queryKey: ["students", selectedBatchId],
        queryFn: () => listStudentsInBatch(selectedBatchId),
        enabled: !!selectedBatchId,
    });

    const filteredStudents = studentsData.filter((s) =>
        `${s.student.firstName}${s.student.lastName}${s.student.email}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    // --- Mutations ---
    const dropMutation = useMutation({
        mutationFn: (studentId: string) =>
            createStudentBatchEnrollment({
                studentId,
                programBatchId: selectedBatchId,
                status: BatchEnrollmentStatus.Dropped,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students", selectedBatchId] });
            toast.success("Student marked as Dropped.");
        },
        onError: (err: any) => toast.error(err.message || "Failed to drop student."),
    });

    const softRemoveMutation = useMutation({
        mutationFn: (studentId: string) =>
            softRemoveStudentFromBatch({ studentId, programBatchId: selectedBatchId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students", selectedBatchId] });
            toast.success("Student softly removed.");
        },
        onError: (err: any) => toast.error(err.message || "Soft remove failed."),
    });

    const permanentRemoveMutation = useMutation({
        mutationFn: (studentId: string) =>
            removeStudentFromBatch({ studentId, programBatchId: selectedBatchId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students", selectedBatchId] });
            toast.success("Student permanently removed.");
        },
        onError: (err: any) => toast.error(err.message || "Permanent removal failed."),
    });

    const reinstateMutation = useMutation({
        mutationFn: (studentId: string) =>
            reinstateStudentInBatch({ studentId, programBatchId: selectedBatchId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students", selectedBatchId] });
            toast.success("Student reinstated.");
        },
        onError: (err: any) => toast.error(err.message || "Failed to reinstate student."),
    });


    return (
        <div className="p-8 max-w-6xl mx-auto overflow-x-auto">
            <div className="overflow-x-auto">
                <Helmet>
                    <title>{GLOBAL_TITLE} - Session Management - Batch Student List</title>
                </Helmet>
                <Breadcrumbs items={generateBreadcrumbs('/batches/enrollments/student-list')} />

                <div className="mt-2 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <PageHeading title="Batch Student List" />
                    <input
                        type="text"
                        placeholder="Search enrolled students..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border border-gray-300 rounded px-4 py-2 w-full md:max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm
                        dark:bg-darkSurface dark:border-darkBorderLight dark:text-darkTextPrimary dark:placeholder-darkTextMuted"
                    />
                </div>
            </div>

            <div className="w-full max-w-6xl mx-auto mt-8 border border-gray-300 dark:border-darkBorderLight p-6 rounded-sm shadow bg-white dark:bg-darkSurface">
                <h2 className="text-xl font-semibold mb-6 text-center text-gray-800 dark:text-darkTextPrimary">
                    View Enrolled Students
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {(isAdmin || isDepartmentHead) ? (
                        <SelectInput
                            label="Program"
                            value={selectedProgramId}
                            onChange={(e) => {
                                setSelectedProgramId(e.target.value);
                                setSelectedBatchId("");
                            }}
                            options={programsData?.programs?.map((p) => ({
                                label: p.title,
                                value: p.id
                            })) || []}
                        />
                    ) : (
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                Program
                            </label>
                            <div className="border p-2 rounded bg-gray-100 text-gray-500 italic">
                                Not allowed to select program
                            </div>
                        </div>
                    )}

                    <SelectInput
                        label="Batch"
                        value={selectedBatchId}
                        onChange={(e) => setSelectedBatchId(e.target.value)}
                        options={batches?.map((b) => ({
                            label: String(b.sessionYear),
                            value: b.id
                        })) || []}
                        disabled={!batches?.length}
                    />
                </div>

                {isStudentsLoading && <TopCenterLoader />}

                <div className="overflow-x-auto border border-gray-300 rounded-sm shadow-sm bg-white dark:bg-darkSurface dark:border-darkBorderLight">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-100 border-b border-gray-300 text-gray-700 dark:bg-darkMuted dark:text-darkTextSecondary dark:border-darkBorderLight uppercase text-xs tracking-wide">
                            <tr>
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2">Email</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isStudentsLoading ? (
                                <tr>
                                    <td colSpan={4} className="text-center px-4 py-6 text-gray-500 dark:text-darkTextMuted">
                                        Loading students...
                                    </td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center px-4 py-6 text-gray-500 dark:text-darkTextMuted">
                                        No enrolled students found.
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map(({ student, status }) => (
                                    <tr
                                        key={student.id}
                                        className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-darkMuted transition dark:border-darkBorderLight"
                                    >
                                        <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-800 dark:text-darkTextPrimary">
                                            {student.firstName} {student.lastName}
                                        </td>
                                        <td className="px-4 py-2 text-gray-700 dark:text-darkTextSecondary">{student.email}</td>
                                        <td className="px-4 py-2">
                                            <span
                                                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full
                                            ${status === BatchEnrollmentStatus.Active
                                                        ? "bg-green-100 text-green-700 border border-green-300 dark:bg-darkOnlineGreen/10 dark:text-darkOnlineGreen dark:border-darkOnlineGreen/40"
                                                        : status === BatchEnrollmentStatus.Graduated
                                                            ? "bg-blue-100 text-blue-700 border border-blue-300 dark:bg-darkBlurple/10 dark:text-darkBlurple dark:border-darkBlurple/30"
                                                            : status === BatchEnrollmentStatus.Dropped
                                                                ? "bg-red-100 text-red-700 border border-red-300 dark:bg-red-500/10 dark:text-red-400 dark:border-red-400/40"
                                                                : "bg-gray-100 text-gray-600 border border-gray-300 dark:bg-darkMuted dark:text-darkTextMuted dark:border-darkBorderLight"
                                                    }`}
                                            >
                                                {status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-center text-lg flex justify-center gap-3">
                                            {status !== BatchEnrollmentStatus.Active && (
                                                <button
                                                    onClick={() => reinstateMutation.mutate(student.id)}
                                                    className="text-green-600 hover:text-green-800 dark:text-darkOnlineGreen dark:hover:text-green-400"
                                                    title="Reinstate"
                                                >
                                                    <FaUserPlus />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => dropMutation.mutate(student.id)}
                                                className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300"
                                                title="Drop"
                                            >
                                                <FaUserSlash />
                                            </button>
                                            <button
                                                onClick={() => softRemoveMutation.mutate(student.id)}
                                                className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                                                title="Soft Remove"
                                            >
                                                <FaUserMinus />
                                            </button>
                                            <button
                                                onClick={() => permanentRemoveMutation.mutate(student.id)}
                                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                title="Remove Permanently"
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EnrolledStudentsList;
