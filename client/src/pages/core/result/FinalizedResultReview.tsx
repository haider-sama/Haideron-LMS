import React from "react";
import { useToast } from "../../../context/ToastContext";
import { reviewFinalizedResult } from "../../../api/core/teacher/result-api";
import { FinalizedResultStatusEnum } from "../../../../../server/src/shared/enums";
import { FinalizedResultWithRelations } from "../../../constants/core/interfaces";
import { Button } from "../../../components/ui/Button";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface FinalizedResultReviewProps {
    result: FinalizedResultWithRelations;
    onClose: () => void;
    onFinalized?: () => void;
}

const FinalizedResultReview: React.FC<FinalizedResultReviewProps> = ({
    result,
    onClose,
    onFinalized,
}) => {
    const queryClient = useQueryClient();
    const toast = useToast();

    const mutation = useMutation({
        mutationFn: () =>
            reviewFinalizedResult(result.id, FinalizedResultStatusEnum.Confirmed),
        onSuccess: (message) => {
            toast.success(message || "Result finalized successfully.");
            // invalidate cache so pending results list refetches
            queryClient.invalidateQueries({ queryKey: ["pendingFinalizedResults"] });
            onFinalized?.();
            onClose();
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to finalize result.");
        },
    });

    const rejectMutation = useMutation({
        mutationFn: () =>
            reviewFinalizedResult(result.id, FinalizedResultStatusEnum.Rejected),
        onSuccess: (message) => {
            toast.success(message || "Result rejected successfully.");
            queryClient.invalidateQueries({ queryKey: ["pendingFinalizedResults"] });
            onFinalized?.();
            onClose();
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to reject result.");
        },
    });

    const statusColors = {
        Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        Confirmed:
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        Rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };

    const statusClass =
        statusColors[result.status as keyof typeof statusColors] ||
        "bg-gray-100 text-gray-800";

    return (
        <div className="space-y-6 text-gray-800 dark:text-white">
            <h2 className="text-xl font-semibold text-center">
                Review Finalized Result
            </h2>

            <div className="grid grid-cols-2 gap-4 text-sm max-w-2xl mx-auto">
                <div>
                    <strong>Course Code:</strong> {result.courseOffering.course.code}
                </div>
                <div>
                    <strong>Title:</strong> {result.courseOffering.course.title}
                </div>
                <div>
                    <strong>Credit Hours:</strong>{" "}
                    {result.courseOffering.course.creditHours}
                </div>
                <div>
                    <strong>Section:</strong> {result.section}
                </div>
                <div>
                    <strong>Program:</strong>{" "}
                    {result.courseOffering.programBatch.program.title}
                </div>
                <div>
                    <strong>Department:</strong>{" "}
                    {result.courseOffering.programBatch.program.departmentTitle}
                </div>
                <div>
                    <strong>Submitted By:</strong>{" "}
                    {result.submittedByUser.firstName} {result.submittedByUser.lastName}
                </div>
                <div>
                    <strong>Status:</strong>{" "}
                    <span
                        className={`px-2 py-1 rounded text-xs font-medium inline-block ${statusClass}`}
                    >
                        {result.status}
                    </span>
                </div>
            </div>

            <div className="flex justify-center gap-4 mt-6">
                <Button
                    onClick={() => mutation.mutate()}
                    disabled={mutation.isPending}
                    isLoading={mutation.isPending}
                    loadingText="Finalizing..."
                    variant="green"
                    fullWidth={false}
                >
                    Finalize Result
                </Button>
                <Button
                    onClick={() => rejectMutation.mutate()}
                    disabled={rejectMutation.isPending}
                    isLoading={rejectMutation.isPending}
                    loadingText="Rejecting..."
                    variant="red"
                    fullWidth={false}
                >
                    Reject Result
                </Button>
            </div>
        </div>
    );
};

export default FinalizedResultReview;
