import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivatedSemester, CourseOfferingCreateInput, CourseOfferingUpdateInput, ScheduleSlot } from "../../shared/constants/core/interfaces";
import { useToast } from "../../shared/context/ToastContext";
import { useEffect, useState } from "react";
import { completeBatchSemester, deleteBatchSemester, getCatalogueCoursesForActivatedSemester, getSemestersByBatch, updateBatchSemester } from "../../api/core/batch/batch-semester-api";
import { createCourseOfferings, deleteCourseOffering, getCourseOfferings, updateCourseOffering } from "../../api/core/batch/course-offering-api";
import { TermEnum } from "../../../../server/src/shared/enums";

interface CourseOption {
    value: string;
    label: string;
}

interface OfferingEditState extends CourseOfferingUpdateInput {
    capacityInput?: string; // for input field
    sectionSchedules?: Record<string, ScheduleSlot[]>;
}

type SemesterUpdatePayload = {
    isActive?: boolean;
    term?: TermEnum;
    semesterNo?: number;
    startedAt?: string;
    endedAt?: string;
    enrollmentDeadline?: string;
};

export const useSemesterManagement = (batchId: string) => {
    const queryClient = useQueryClient();
    const toast = useToast();

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<ActivatedSemester> | null>(null);
    const [courseOptions, setCourseOptions] = useState<Record<string, CourseOption[]>>({});
    const [selectedCourses, setSelectedCourses] = useState<Record<string, CourseOption[]>>({});
    const [semesterOfferings, setSemesterOfferings] = useState<Record<string, any[]>>({});
    const [editingOfferingId, setEditingOfferingId] = useState<string | null>(null);
    const [offeringEditValues, setOfferingEditValues] = useState<Record<string, OfferingEditState>>({});

    // Fetch semesters
    const { data, isLoading } = useQuery({
        queryKey: ["semesters", batchId],
        queryFn: () => getSemestersByBatch(batchId),
    });

    const semesters: ActivatedSemester[] = data?.semesters || [];

    // Mutation
    const updateMutation = useMutation({
        mutationFn: async (params: { batchSemesterId: string; payload: SemesterUpdatePayload }) =>
            updateBatchSemester(params.batchSemesterId, params.payload),
        onSuccess: () => {
            toast.success("Semester updated!");
            queryClient.invalidateQueries({ queryKey: ["batch-semesters", batchId] });
            setExpandedId(null);
            setEditValues(null);
        },
        onError: (err: any) => {
            if (err.fieldErrors && typeof err.fieldErrors === "object") {
                Object.values(err.fieldErrors)
                    .flatMap((v: any) => (Array.isArray(v) ? v : []))
                    .forEach((msg: string) => toast.error(msg));
                return;
            }
            toast.error(err.message || "Failed to update semester.");
        },
    });

    // When preparing the payload, convert nulls to undefined
    const handleUpdate = () => {
        if (!editValues?.id) return;

        const payload: SemesterUpdatePayload = {
            isActive: editValues.isActive,
            term: editValues.term,
            semesterNo: editValues.semesterNo,
            startedAt: editValues.startedAt ?? undefined,
            endedAt: editValues.endedAt ?? undefined,
            enrollmentDeadline: editValues.enrollmentDeadline ?? undefined,
        };

        updateMutation.mutate({ batchSemesterId: editValues.id, payload });
    };

    // Complete semester
    const completeMutation = useMutation({
        mutationFn: (batchSemesterId: string) => completeBatchSemester(batchSemesterId),
        onSuccess: () => {
            toast.success("Semester completed!");
            queryClient.invalidateQueries({ queryKey: ["batch-semesters", batchId] });
        },
        onError: (err: any) => toast.error(err.message || "Failed to complete semester"),
    });

    // Delete semester
    const deleteMutation = useMutation({
        mutationFn: (batchSemesterId: string) => deleteBatchSemester(batchSemesterId),
        onSuccess: () => {
            toast.success("Semester deleted!");
            queryClient.invalidateQueries({ queryKey: ["batch-semesters", batchId] });
        },
        onError: (err: any) => toast.error(err.message || "Failed to delete semester"),
    });

    // Delete offering
    const deleteOfferingMutation = useMutation({
        mutationFn: async ({ offeringId }: { offeringId: string; semesterId: string }) =>
            deleteCourseOffering(offeringId),
        onSuccess: (_, variables) => {
            toast.success("Course offering deleted!");
            setSemesterOfferings((prev) => ({
                ...prev,
                [variables.semesterId]: prev[variables.semesterId].filter(
                    (off) => off.id !== variables.offeringId
                ),
            }));
        },
        onError: (err: any) => toast.error(err.message || "Failed to delete course offering"),
    });

    // Update offering
    const updateOfferingMutation = useMutation({
        mutationFn: async (params: { offeringId: string; payload: CourseOfferingUpdateInput; semesterId: string }) =>
            updateCourseOffering(params.offeringId, params.payload),
        onSuccess: () => {
            toast.success("Course offering updated!");
            queryClient.invalidateQueries({ queryKey: ["batch-semesters", batchId] });
            setEditingOfferingId(null);
        },
        onError: (err: any) => {
            if (err.validationErrors) {
                const messages = Object.values(err.validationErrors).flatMap((errors: any) => errors);
                toast.error(messages.join("\n") || "Validation failed");
            } else {
                toast.error(err.message || "Failed to update course offering");
            }
        },
    });

    // Create course offerings
    const courseOfferingMutation = useMutation({
        mutationFn: async (params: { activatedSemesterId: string; selectedCourses: CourseOption[] }) => {
            const offerings: CourseOfferingCreateInput[] = params.selectedCourses.map((c) => ({ courseId: c.value }));
            return createCourseOfferings(params.activatedSemesterId, offerings);
        },
        onSuccess: () => {
            toast.success("Course offerings created!");
            queryClient.invalidateQueries({ queryKey: ["batch-semesters", batchId] });
        },
        onError: (err: any) => toast.error(err.message || "Failed to create course offerings"),
    });

    // Fetch catalogue courses and offerings when a semester expands
    useEffect(() => {
        if (!expandedId || courseOptions[expandedId]) return;

        const fetchCoursesAndOfferings = async () => {
            try {
                const [catalogueCourses, offeredCourses] = await Promise.all([
                    getCatalogueCoursesForActivatedSemester(expandedId),
                    getCourseOfferings(expandedId),
                ]);

                const options: CourseOption[] = catalogueCourses.map((c) => ({
                    value: c.id,
                    label: `${c.code} - ${c.title}`,
                }));

                setCourseOptions((prev) => ({ ...prev, [expandedId]: options }));
                setSemesterOfferings((prev) => ({ ...prev, [expandedId]: offeredCourses.offerings }));
            } catch (err: any) {
                toast.error(err.message || "Could not load catalogue or offerings");
            }
        };

        fetchCoursesAndOfferings();
    }, [expandedId, courseOptions]);

    // Handlers
    const handleToggle = (sem: ActivatedSemester) => {
        const isSame = expandedId === sem.id;
        setExpandedId(isSame ? null : sem.id);
        setEditValues(isSame ? null : { ...sem });
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this semester?")) deleteMutation.mutate(id);
    };

    const handleComplete = (id: string) => {
        if (confirm("Are you sure you want to de-activate this semester?")) completeMutation.mutate(id);
    };

    const handleCreateCourseOfferings = (semId: string) => {
        const selected = selectedCourses[semId] || [];
        if (!selected.length) return toast.error("Please select at least one course.");
        courseOfferingMutation.mutate({ activatedSemesterId: semId, selectedCourses: selected });
    };

    const handleScheduleChange = (
        offeringId: string,
        section: string,
        index: number,
        field: keyof ScheduleSlot,
        value: string
    ) => {
        setOfferingEditValues((prev) => {
            const current = prev[offeringId]?.sectionSchedules?.[section] || [];
            const updated = [...current];
            updated[index] = { ...updated[index], [field]: value };
            return {
                ...prev,
                [offeringId]: {
                    ...prev[offeringId],
                    sectionSchedules: { ...prev[offeringId]?.sectionSchedules, [section]: updated },
                },
            };
        });
    };

    const handleAddSlot = (offeringId: string, section: string) => {
        setOfferingEditValues((prev) => {
            const current: ScheduleSlot[] = prev[offeringId]?.sectionSchedules?.[section] || [];
            const updated: ScheduleSlot[] = [
                ...current,
                { day: "Monday", startTime: "09:00", endTime: "10:00" },
            ];

            return {
                ...prev,
                [offeringId]: {
                    ...prev[offeringId],
                    sectionSchedules: {
                        ...prev[offeringId]?.sectionSchedules,
                        [section]: updated,
                    },
                },
            };
        });
    };

    const handleRemoveSlot = (offeringId: string, section: string, index: number) => {
        setOfferingEditValues((prev) => {
            const current = prev[offeringId]?.sectionSchedules?.[section] || [];
            const updated = current.filter((_, i) => i !== index);
            return {
                ...prev,
                [offeringId]: {
                    ...prev[offeringId],
                    sectionSchedules: { ...prev[offeringId]?.sectionSchedules, [section]: updated },
                },
            };
        });
    };

    return {
        semesters,
        isLoading,
        expandedId,
        editValues,
        courseOptions,
        selectedCourses,
        semesterOfferings,
        editingOfferingId,
        offeringEditValues,
        setExpandedId,
        setEditValues,
        setSelectedCourses,
        setCourseOptions,
        setSemesterOfferings,
        setEditingOfferingId,
        setOfferingEditValues,
        handleToggle,
        handleUpdate,
        handleComplete,
        handleDelete,
        handleCreateCourseOfferings,
        handleScheduleChange,
        handleAddSlot,
        handleRemoveSlot,
        courseOfferingMutation,
        updateMutation,
        completeMutation,
        deleteMutation,
        deleteOfferingMutation,
        updateOfferingMutation
    };
};