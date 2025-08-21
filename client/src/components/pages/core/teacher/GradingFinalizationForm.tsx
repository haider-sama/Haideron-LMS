import React, { useState } from 'react';
import { useToast } from '../../../../context/ToastContext';
import { finalizeAssessmentResults, saveGradingScheme, withdrawFinalizedResult } from '../../../../api/core/teacher/result-api';
import { ReadOnlyInput } from '../../../ui/Input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GradingRule } from '../../../../constants/core/interfaces';
import { Button } from '../../../ui/Button';

interface GradingFinalizationFormProps {
    courseOfferingId: string;
    section: string;
}

export const GradingFinalizationForm: React.FC<GradingFinalizationFormProps> = ({
    courseOfferingId,
    section,
}) => {
    const [gradingRules, setGradingRules] = useState<GradingRule[]>([
        { grade: 'A+', minPercentage: 85, gradePoint: 4.0 },
        { grade: 'A', minPercentage: 80, gradePoint: 4.0 },
        { grade: 'A-', minPercentage: 75, gradePoint: 3.7 },
        { grade: 'B+', minPercentage: 70, gradePoint: 3.3 },
        { grade: 'B', minPercentage: 65, gradePoint: 3.0 },
        { grade: 'B-', minPercentage: 60, gradePoint: 2.7 },
        { grade: 'C+', minPercentage: 55, gradePoint: 2.3 },
        { grade: 'C', minPercentage: 50, gradePoint: 2.0 },
        { grade: 'C-', minPercentage: 45, gradePoint: 1.7 },
        { grade: 'D+', minPercentage: 40, gradePoint: 1.3 },
        { grade: 'D', minPercentage: 35, gradePoint: 1.0 },
        { grade: 'F', minPercentage: 0, gradePoint: 0.0 },
    ]);

    const toast = useToast();
    const queryClient = useQueryClient();

    const handleUpdateRule = (
        index: number,
        key: keyof GradingRule,
        value: string | number
    ) => {
        const updated = [...gradingRules];

        switch (key) {
            case "grade":
                updated[index][key] = value as string;
                break;
            case "minPercentage":
            case "gradePoint":
                updated[index][key] =
                    typeof value === "string" ? parseFloat(value) || 0 : (value as number);
                break;
        }

        setGradingRules(updated);
    };

    // Mutation for saving grading scheme
    const saveSchemeMutation = useMutation({
        mutationFn: () => saveGradingScheme(courseOfferingId, gradingRules, section),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message);
                queryClient.invalidateQueries({ queryKey: ['gradingScheme', courseOfferingId, section] });
            } else {
                toast.error(res.message);
            }
        },
        onError: () => toast.error('Network or server error while saving grading scheme.'),
    });

    // Mutation for finalizing results
    const finalizeMutation = useMutation({
        mutationFn: () => finalizeAssessmentResults(courseOfferingId, section),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message);
                console.log('Grades:', res.grades);
                queryClient.invalidateQueries({ queryKey: ['finalizedResults', courseOfferingId, section] });
            } else {
                toast.error(res.message);
            }
        },
        onError: () => toast.error('Network or server error while finalizing results.'),
    });

    // Mutation for withdrawing finalized results
    const withdrawMutation = useMutation({
        mutationFn: () => withdrawFinalizedResult(courseOfferingId, section),
        onSuccess: (res) => {
            if (res.success) toast.success(res.message);
            else toast.error(res.message);
            queryClient.invalidateQueries({ queryKey: ['finalizedResults', courseOfferingId, section] });
        },
        onError: () => toast.error('Unexpected error occurred while withdrawing result.'),
    });

    const handleSaveScheme = () => saveSchemeMutation.mutate();
    const handleFinalizeResults = () => finalizeMutation.mutate();
    const handleWithdrawResults = () => {
        const firstConfirm = confirm(
            "This will revoke the finalized result sent to the Department Head.\n\nAre you sure you want to continue?"
        );
        if (!firstConfirm) return;

        const secondConfirm = confirm(
            "After withdrawing, you must re-finalize the result before the Department Head can approve it.\n\nDo you still want to proceed?"
        );
        if (!secondConfirm) return;

        withdrawMutation.mutate();
    };

    return (
        <div className="p-6 bg-white dark:bg-darkSurface rounded-2xl space-y-6 w-full text-gray-800 dark:text-darkTextPrimary">
            <h2 className="text-2xl font-bold text-center text-primary dark:text-darkTextPrimary">Custom Grading Scheme</h2>

            <div className="space-y-6">
                {gradingRules.map((rule, index) => (
                    <div
                        key={index}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-300 dark:border-darkBorderLight pb-4"
                    >
                        <div className="flex gap-2 items-center w-full md:w-1/3">
                            <div className="w-20">
                                <label className="block text-xs font-medium text-gray-600 dark:text-darkTextMuted">Grade</label>
                                <ReadOnlyInput
                                    value={rule.grade}
                                    className="w-full text-center bg-gray-100 dark:bg-darkMuted text-black dark:text-darkTextPrimary"
                                />
                            </div>

                            <div className="w-20">
                                <label className="block text-xs font-medium text-gray-600 dark:text-darkTextMuted">GPA</label>
                                <ReadOnlyInput
                                    value={rule.gradePoint}
                                    className="w-full text-center bg-gray-100 dark:bg-darkMuted text-black dark:text-darkTextPrimary"
                                />
                            </div>
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-600 dark:text-darkTextMuted mb-1">
                                Min %: {rule.minPercentage}%
                            </label>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                step={5}
                                value={rule.minPercentage}
                                onChange={(e) => handleUpdateRule(index, 'minPercentage', parseInt(e.target.value))}
                                className="w-full accent-primary"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
                <Button
                    onClick={handleSaveScheme}
                    isLoading={saveSchemeMutation.isPending}
                    loadingText="Saving..."
                    disabled={saveSchemeMutation.isPending}
                    variant='green'
                >
                    Save Grading Scheme
                </Button>
                <Button
                    onClick={handleFinalizeResults}
                    isLoading={finalizeMutation.isPending}
                    loadingText="Finalizing..."
                    disabled={finalizeMutation.isPending}
                    variant='gray'
                >
                    Finalize Results
                </Button>
                <Button
                    onClick={handleWithdrawResults}
                    isLoading={withdrawMutation.isPending}
                    loadingText="Withdrawing..."
                    disabled={withdrawMutation.isPending}
                    variant='red'
                >
                    Withdraw Finalized Result
                </Button>
            </div>
        </div>
    );
};