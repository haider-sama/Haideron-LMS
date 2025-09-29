import React, { useState } from "react";
import { Button } from "../../../../ui/Button";
import { AssessmentPayload, AssignedCourseOffering, CLO } from "../../../../../shared/constants/core/interfaces";
import { AssessmentTypeEnum } from "../../../../../../../server/src/shared/enums";
import { useToast } from "../../../../../shared/context/ToastContext";
import { createAssessment } from "../../../../../api/core/teacher/assessment-api";
import { Input, SelectInput } from "../../../../ui/Input";
import DatePicker from "react-datepicker";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateAssessmentFormProps {
    offering: AssignedCourseOffering;
    clos: CLO[];
}

const CreateAssessmentForm: React.FC<CreateAssessmentFormProps> = ({ offering, clos }) => {
    const [type, setType] = useState<AssessmentTypeEnum>(AssessmentTypeEnum.Quiz);
    const [title, setTitle] = useState("");
    const [weightage, setWeightage] = useState<number>(0);
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [selectedCLOIds, setSelectedCLOIds] = useState<string[]>([]);
    const toast = useToast();
    const queryClient = useQueryClient();

    const createAssessmentMutation = useMutation({
        mutationFn: (payload: AssessmentPayload) =>
            createAssessment(offering.offeringId, payload),
        onSuccess: () => {
            toast.success("Assessment created successfully.");
            setType(AssessmentTypeEnum.Quiz);
            setTitle("");
            setWeightage(0);
            setDueDate(null);
            setSelectedCLOIds([]);
            queryClient.invalidateQueries({ queryKey: ["assessments", offering.offeringId] });
        },
        onError: (err: any) => {
            if (err.errors && typeof err.errors === "object") {
                Object.values(err.errors).forEach((messages) => {
                    if (Array.isArray(messages)) {
                        messages.forEach((msg: string) => toast.error(msg));
                    }
                });
            } else {
                toast.error(err.message || "Failed to create assessment.");
            }
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!dueDate) {
            toast.error("Please select a valid due date.");
            return;
        }

        createAssessmentMutation.mutate({
            type,
            title,
            weightage,
            dueDate: dueDate.toISOString(),
            clos: selectedCLOIds,
        });
    };

    return (
        <div className="w-full max-w-xl bg-white dark:bg-darkSurface text-gray-800 dark:text-darkTextPrimary mx-auto rounded p-6">
            <div className="w-full">
                <h2 className="text-2xl font-semibold mb-6 text-center text-primary dark:text-darkTextPrimary">Create Assessment</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <SelectInput
                        label="Assessment Type"
                        name="type"
                        value={type}
                        onChange={(e) => setType(e.target.value as AssessmentTypeEnum)}
                        options={Object.values(AssessmentTypeEnum)}
                    />

                    <Input
                        label="Title"
                        name="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Assessment title"
                        required
                    />

                    <Input
                        label="Weightage (%)"
                        name="weightage"
                        type="number"
                        value={weightage}
                        onChange={(e) => setWeightage(Number(e.target.value))}
                        required
                    />

                    <div className="w-full">
                        <label className="block mb-1 font-medium text-gray-800 dark:text-darkTextSecondary">
                            Due Date
                        </label>
                        <DatePicker
                            selected={dueDate}
                            onChange={(date) => setDueDate(date)}
                            dateFormat="yyyy-MM-dd"
                            placeholderText="Select due date"
                            required
                            wrapperClassName="w-full"
                            className="w-full px-3 py-2 text-sm rounded-md
                                border border-gray-300 dark:border-darkBorderLight
                                bg-white dark:bg-darkMuted
                                text-gray-900 dark:text-darkTextPrimary
                                focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-darkBlurple"
                        />
                    </div>

                    <div className="w-full">
                        <label className="block text-sm font-medium mb-2 text-primary dark:text-darkTextPrimary">
                            Select CLOs
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {clos.map((clo) => {
                                if (!clo.id) return null; // skip CLOs without an id

                                const isChecked = selectedCLOIds.includes(clo.id);

                                return (
                                    <div
                                        key={clo.id}
                                        className={`flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer transition
                                         ${isChecked ? 'bg-primary/10 border-gray-300 dark:bg-darkBlurple/20 dark:border-darkBlurple' : 'bg-white dark:bg-darkSurface border-gray-300 dark:border-darkBorderLight'}
                                        `}
                                        onClick={() => {
                                            setSelectedCLOIds((prev) =>
                                                isChecked ? prev.filter((c) => c !== clo.id) : [...prev, clo.id!]
                                            );
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            value={clo.id}
                                            checked={isChecked}
                                            onChange={() => { }}
                                            className="accent-blue-600 dark:accent-darkBlurple cursor-pointer"
                                        />
                                        <span className="text-gray-800 dark:text-darkTextPrimary text-sm">
                                            {clo.code}: {clo.title}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <Button
                        isLoading={createAssessmentMutation.isPending}
                        loadingText="Creating..."
                        disabled={createAssessmentMutation.isPending}
                    >
                        Create Assessment
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default CreateAssessmentForm;