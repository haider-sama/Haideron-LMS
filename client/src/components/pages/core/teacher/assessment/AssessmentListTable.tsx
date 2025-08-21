import React, { useState } from "react";
import TopCenterLoader from "../../../../ui/TopCenterLoader";
import { Assessment, CLO } from "../../../../../constants/core/interfaces";
import { deleteAssessmentById, getCourseAssessments } from "../../../../../api/core/teacher/assessment-api";
import { useToast } from "../../../../../context/ToastContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../../../ui/Button";
import Modal from "../../../../ui/Modal";
import AssessmentResultsForm from "./AssessmentResultsForm";
import ErrorStatus from "../../../../ui/ErrorStatus";
import UpdateAssessmentForm from "./UpdateAssessmentForm";

interface AssessmentListTableProps {
    offeringId: string;
    section: string;
    clos: CLO[];
}

const AssessmentListTable: React.FC<AssessmentListTableProps> = ({
    offeringId,
    section,
    clos,
}) => {
    const queryClient = useQueryClient();
    const toast = useToast();

    const [resultsModalOpen, setResultsModalOpen] = useState(false);
    const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [assessmentToEdit, setAssessmentToEdit] = useState<Assessment | null>(null);

    /**
     * Query: fetch assessments
     */
    const {
        data,
        isLoading: loadingAssessments,
        isError,
        error,
    } = useQuery({
        queryKey: ["courseAssessments", offeringId],
        queryFn: () => getCourseAssessments(offeringId),
        select: (data) => data.assessments, // we only care about assessments array
    });

    const assessments = data ?? [];

    /**
     * Mutation: delete assessment
     */
    const deleteAssessmentMutation = useMutation({
        mutationFn: deleteAssessmentById,
        onSuccess: (res) => {
            toast.success(res.message);
            queryClient.invalidateQueries({ queryKey: ["courseAssessments", offeringId] });
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to delete assessment");
        },
    });

    /**
     * Handlers
     */
    const handleOpenEditModal = (assessment: Assessment) => {
        setAssessmentToEdit(assessment);
        setEditModalOpen(true);
    };

    const handleDeleteAssessment = (assessmentId: string) => {
        const firstConfirm = confirm("Are you sure you want to delete this assessment?");
        if (!firstConfirm) return;

        const secondConfirm = confirm("This action is irreversible. Do you really want to proceed?");
        if (!secondConfirm) return;

        deleteAssessmentMutation.mutate(assessmentId);
    };

    const handleOpenResultsModal = (assessmentId: string) => {
        setActiveAssessmentId(assessmentId);
        setResultsModalOpen(true);
    };

    /**
     * Rendering
     */
    if (loadingAssessments) return <TopCenterLoader />;
    if (isError) {
        return <ErrorStatus message={`Error: ${(error as Error).message}`} />;
    }

    return (
        <div className="mx-auto p-6 w-full max-w-6xl border border-gray-300 dark:border-darkBorderLight rounded-lg bg-white dark:bg-darkSurface text-gray-900 dark:text-darkTextPrimary">
            <h3 className="text-xl font-semibold mb-4 text-center">Existing Assessments</h3>

            {loadingAssessments ? (
                <TopCenterLoader />
            ) : assessments.length === 0 ? (
                <p className="text-gray-500 dark:text-darkTextMuted text-center">No assessments found.</p>
            ) : (
                <div className="overflow-x-auto border border-gray-300 dark:border-darkBorderLight rounded-sm shadow-sm">
                    <table className="min-w-full rounded-lg overflow-hidden text-sm text-left">
                        <thead className="bg-gray-100 border-b border-gray-300 dark:bg-darkSidebar text-gray-700 dark:text-darkTextSecondary uppercase text-xs">
                            <tr className="border-b last:border-0 border-gray-200 dark:border-darkBorderLight">
                                <th className="px-4 py-2">Title</th>
                                <th className="px-4 py-2">Type</th>
                                <th className="px-4 py-2">Weightage (%)</th>
                                <th className="px-4 py-2">Due Date</th>
                                <th className="px-4 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-darkSurface text-gray-800 dark:text-darkTextPrimary divide-y divide-gray-200 dark:divide-darkBorderMuted">
                            {assessments.map((a) => (
                                <tr key={a.id} className="border-b last:border-0 border-gray-200 dark:border-darkBorderLight hover:bg-gray-100 dark:hover:bg-darkMuted">
                                    <td className="px-4 py-2">{a.title}</td>
                                    <td className="px-4 py-2 capitalize">{a.type}</td>
                                    <td className="px-4 py-2">{a.weightage}</td>
                                    <td className="px-4 py-2">{new Date(a.dueDate).toLocaleDateString()}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex flex-wrap gap-2">
                                            <Button onClick={() => handleOpenResultsModal(a.id)} fullWidth={false} size="sm">
                                                View/Submit
                                            </Button>
                                            <Button onClick={() => handleOpenEditModal(a)} fullWidth={false} size="sm" variant="gray">
                                                Edit
                                            </Button>
                                            <Button onClick={() => handleDeleteAssessment(a.id)} fullWidth={false} size="sm" variant="red">
                                                Delete
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {resultsModalOpen && activeAssessmentId && (
                <Modal isOpen={resultsModalOpen} onClose={() => setResultsModalOpen(false)}>
                    <AssessmentResultsForm
                        offeringId={offeringId}
                        section={section}
                        assessmentId={activeAssessmentId}
                        onClose={() => setResultsModalOpen(false)}
                    />
                </Modal>
            )}

            {editModalOpen && assessmentToEdit && (
                <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}>
                    <UpdateAssessmentForm
                        assessment={assessmentToEdit}
                        onClose={() => setEditModalOpen(false)}
                        clos={clos} // assigned course offering CLOs
                    />
                </Modal>
            )}

        </div>
    );
};

export default AssessmentListTable;
