import React, { useEffect, useState } from "react";
import { fetchEnrolledStudentsForCourse } from "../../../../api/core/teacher/teacher-course-api";
import { getAttendanceRecords, getAttendanceSessions, markAttendanceRecords } from "../../../../api/core/teacher/attendance-api";
import { Input, SelectInput } from "../../../ui/Input";
import { Pagination } from "../../../ui/Pagination";
import { useToast } from "../../../../context/ToastContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../../ui/Button";
import ErrorStatus from "../../../ui/ErrorStatus";
import TopCenterLoader from "../../../ui/TopCenterLoader";
import { AudienceEnum } from "../../../../../../server/src/shared/enums";
import { useUserManagement } from "../../../../hooks/admin/useUserManagement";
import { usePermissions } from "../../../../hooks/usePermissions";
import Modal from "../../../ui/Modal";
import CreateAttendanceSessionForm from "./CreateAttendanceSessionForm";

interface EnrolledStudentsListProps {
    offeringId: string;
    section: string;
}

const LOCAL_MAX_PAGE_LIMIT = 100;

const CourseEnrolledStudentsList: React.FC<EnrolledStudentsListProps> = ({
    offeringId,
    section,
}) => {
    const toast = useToast();
    const queryClient = useQueryClient();

    const { user } = usePermissions();
    const { page, setPage, search, setSearch, debouncedSearch } =
        useUserManagement(user?.role as AudienceEnum);

    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [limit, setLimit] = useState<number>(10); // default fetch limit
    const [inputLimit, setInputLimit] = useState<string>("10"); // controlled input

    const handleUpdateLimit = () => {
        const parsed = parseInt(inputLimit);
        if (!isNaN(parsed) && parsed > 0 && parsed <= LOCAL_MAX_PAGE_LIMIT) {
            setLimit(parsed);
            setPage(1); // reset to first page
        } else {
            toast.error(`Please enter a valid number (1-${LOCAL_MAX_PAGE_LIMIT})`);
        }
    };

    // Fetch students
    const {
        data: studentsData,
        isLoading: loadingStudents,
        error: studentsError,
    } = useQuery({
        queryKey: ["enrolled-students", offeringId, section, page, debouncedSearch, limit],
        queryFn: () =>
            fetchEnrolledStudentsForCourse(offeringId, section, {
                page,
                limit,
                search: debouncedSearch,
            }),
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    const totalPages = studentsData?.totalPages || 1;

    // Fetch attendance sessions
    const {
        data: sessions,
        isLoading: loadingSessions,
        error: sessionsError,
    } = useQuery({
        queryKey: ["attendance-sessions", offeringId],
        queryFn: () => getAttendanceSessions(offeringId),
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    const {
        data: attendanceRecords,
        isLoading: loadingRecords,
        error: recordsError,
    } = useQuery({
        queryKey: ["attendance-records", currentSessionId],
        queryFn: () => getAttendanceRecords(currentSessionId!),
        enabled: !!currentSessionId && (studentsData?.students?.length ?? 0) > 0,
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    useEffect(() => {
        if (attendanceRecords?.records) {
            const map: Record<string, boolean> = {};
            for (const record of attendanceRecords.records) {
                map[record.studentId] = record.present;
            }
            setAttendanceMap(map);
        }
    }, [attendanceRecords]);


    // Mutation to mark attendance
    const markAttendanceMutation = useMutation({
        mutationFn: (records: { studentId: string; present: boolean }[]) =>
            markAttendanceRecords(currentSessionId!, records),
        onSuccess: (res) => {
            toast.success(res.message);
            queryClient.invalidateQueries({ queryKey: ["attendance-records", currentSessionId] });
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to submit attendance");
        },
    });

    // Handlers
    const handleAttendanceToggle = (studentId: string, present: boolean) => {
        setAttendanceMap((prev) => ({ ...prev, [studentId]: present }));
    };

    const handleSubmitAttendance = () => {
        if (!currentSessionId) {
            toast.error("No attendance session selected.");
            return;
        }

        const records = Object.entries(attendanceMap).map(([studentId, present]) => ({
            studentId,
            present,
        }));

        markAttendanceMutation.mutate(records);
    };

    const refreshSessions = () => {
        queryClient.invalidateQueries({ queryKey: ["attendance-sessions", offeringId] });
        toast.success("Attendance sessions refreshed");
    };

    const queryErrors = [
        { error: studentsError, label: "Enrolled students" },
        { error: sessionsError, label: "Attendance sessions" },
        { error: recordsError, label: "Attendance records" },
    ].filter((e) => e.error);

    // If any error exists, show the first one
    if (queryErrors.length > 0) {
        const { error, label } = queryErrors[0];
        return (
            <ErrorStatus
                message={`Failed to load ${label}: ${(error as Error).message}`}
            />
        );
    }

    return (
        <div className="w-full mx-auto">
            <div className="bg-white dark:bg-darkSurface rounded-sm p-6 border border-gray-300 dark:border-darkBorderLight">

                {(loadingStudents || loadingSessions || loadingRecords) && <TopCenterLoader />}

                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-darkTextPrimary">
                        Enrolled Students{" "}
                        <span className="text-gray-600 dark:text-darkTextMuted">
                            (Section {section})
                        </span>
                    </h2>
                    <Button
                        variant="green"
                        fullWidth={false}
                        size="sm"
                        onClick={() => setShowCreateModal(true)}
                    >
                        Create Attendance Session
                    </Button>

                </div>

                <div className="flex gap-4 mb-6">
                    <Input
                        type="text"
                        placeholder="Search by name or email"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full"
                    />
                    <SelectInput
                        value={currentSessionId ?? ""}
                        onChange={(e) => setCurrentSessionId(e.target.value)}
                        options={(sessions ?? []).map((session) => ({
                            label: new Date(session.date).toLocaleDateString(),
                            value: session.id,
                        }))}
                        placeholder={
                            loadingSessions ? "Loading sessions..." : "Select Attendance Date"
                        }
                        className="w-full"
                    />

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

                <div className="overflow-hidden border border-gray-300 dark:border-darkBorderLight rounded-sm shadow-sm">
                    <table className="w-full table-auto text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-darkMuted text-primary dark:text-darkTextPrimary uppercase tracking-wider text-xs font-semibold border-b border-gray-200 dark:border-darkBorderLight">
                            <tr className="border-b last:border-0 border-gray-200 dark:border-darkBorderLight">
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2">Email</th>
                                {currentSessionId && (
                                    <th className="px-4 py-3 text-center w-1/6">Present</th>
                                )}
                                <th className="px-4 py-2">Enrolled Date</th>
                            </tr>
                        </thead>

                        <tbody className="bg-white dark:bg-darkSurface divide-y divide-gray-100 dark:divide-darkBorderMuted text-gray-800 dark:text-darkTextPrimary">
                            {/* Loading */}
                            {loadingStudents ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="text-center p-6 text-gray-500 dark:text-darkTextMuted"
                                    >
                                        Loading students...
                                    </td>
                                </tr>
                            ) : (studentsData?.students ?? []).length === 0 ? (
                                /* Empty state */
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="text-center p-6 text-gray-500 dark:text-darkTextMuted"
                                    >
                                        No enrolled students found.
                                    </td>
                                </tr>
                            ) : (
                                /* Student rows */
                                studentsData?.students.map((student) => (
                                    <tr
                                        key={student.id}
                                        className={`hover:bg-blue-50 dark:hover:bg-darkMuted transition ${attendanceMap.hasOwnProperty(student.id)
                                            ? "bg-gray-50 dark:bg-darkMuted/50"
                                            : ""
                                            }`}
                                    >
                                        <td className="px-4 py-3 font-medium text-gray-600 dark:text-darkTextPrimary">
                                            {student.name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-darkTextPrimary">
                                            {student.email}
                                        </td>
                                        {currentSessionId && (
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={attendanceMap[student.id] ?? false}
                                                    onChange={(e) =>
                                                        handleAttendanceToggle(
                                                            student.id,
                                                            e.target.checked
                                                        )
                                                    }
                                                    className="accent-primary dark:accent-darkBlurple"
                                                />
                                            </td>
                                        )}
                                        <td className="px-4 py-3 text-gray-600 dark:text-darkTextSecondary">
                                            {new Date(student.enrolledAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {currentSessionId && (
                    <div className="mt-4 flex justify-end">
                        <Button
                            isLoading={markAttendanceMutation.isPending}
                            loadingText="Submitting..."
                            disabled={markAttendanceMutation.isPending}
                            onClick={handleSubmitAttendance}
                            fullWidth={false}
                            variant="gray"
                            size="sm"
                        >
                            Mark Attendance
                        </Button>
                    </div>
                )}

                <div className="flex justify-end">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={(newPage) => setPage(newPage)}
                    />
                </div>
            </div>

            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
                <CreateAttendanceSessionForm
                    isOpen={showCreateModal}
                    onClose={() => {
                        setShowCreateModal(false);
                        refreshSessions();
                    }}
                    offeringId={offeringId}
                />
            </Modal>
        </div>
    );
};

export default CourseEnrolledStudentsList;
