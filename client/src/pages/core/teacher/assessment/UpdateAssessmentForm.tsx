import React, { useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import { AssessmentTypeEnum } from "../../../../../../server/src/shared/enums";
import { useToast } from "../../../../context/ToastContext";
import { Button } from "../../../../components/ui/Button";
import { Assessment, AssessmentPayload, CLO } from "../../../../constants/core/interfaces";
import { updateAssessment } from "../../../../api/core/teacher/assessment-api";
import { Input, SelectInput } from "../../../../components/ui/Input";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UpdateAssessmentFormProps {
    assessment: Assessment;
    clos: CLO[]; // from course (all available CLOs)
    onClose: () => void;
}

const UpdateAssessmentForm: React.FC<UpdateAssessmentFormProps> = ({
    assessment,
    clos,
    onClose,
}) => {
    const toast = useToast();
    const queryClient = useQueryClient();

    // merge assessment.clos (with details) + course clos
    const mergedClos = useMemo(() => {
        if (!assessment.clos) return clos;

        // Ensure uniqueness by ID
        const allClos = [...clos, ...assessment.clos];
        const uniqueClos = allClos.filter(
            (clo, index, self) => clo.id && index === self.findIndex(c => c.id === clo.id)
        );

        return uniqueClos;
    }, [assessment.clos, clos]);

    const [formData, setFormData] = useState<AssessmentPayload>({
        type: assessment.type,
        title: assessment.title,
        weightage: assessment.weightage,
        dueDate: new Date(assessment.dueDate).toISOString(),
        // initialize with assessment's clo IDs
        clos: assessment.clos?.map(c => c.id!).filter(Boolean) || [],
    });

    const [dueDate, setDueDate] = useState<Date>(new Date(assessment.dueDate));

    const updateAssessmentMutation = useMutation({
        mutationFn: (payload: AssessmentPayload) =>
            updateAssessment(assessment.id, payload),
        onSuccess: () => {
            toast.success("Assessment updated successfully.");
            queryClient.invalidateQueries({
                queryKey: ["courseAssessments", assessment.courseOfferingId],
            });
            onClose();
        },
        onError: (err: any) => {
            if (err.zodErrors && typeof err.zodErrors === "object") {
                Object.values(err.zodErrors).forEach((messages) => {
                    if (Array.isArray(messages)) {
                        messages.forEach((msg: string) => toast.error(msg));
                    }
                });
            } else {
                toast.error(err.message || "Failed to update assessment.");
            }
        },
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "weightage" ? Number(value) : value,
        }));
    };

    const handleCLOToggle = (cloId: string, checked: boolean) => {
        setFormData((prev) => ({
            ...prev,
            clos: checked
                ? [...prev.clos, cloId]
                : prev.clos.filter((id) => id !== cloId),
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!dueDate) {
            toast.error("Please select a valid due date.");
            return;
        }

        updateAssessmentMutation.mutate({
            ...formData,
            dueDate: dueDate.toISOString(),
            clos: formData.clos, // only IDs
        });
    };

    return (
        <div className="w-full max-w-xl bg-white dark:bg-darkSurface p-6 sm:p-8 mx-auto rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 text-center text-gray-900 dark:text-darkTextPrimary">
                Edit Assessment
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
                <SelectInput
                    label="Assessment Type"
                    name="type"
                    value={formData.type}
                    onChange={(e) => handleChange(e)}
                    options={Object.values(AssessmentTypeEnum)}
                    className="text-gray-800 dark:text-darkTextPrimary"
                />

                <Input
                    label="Title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="text-gray-800 dark:text-darkTextPrimary"
                />

                <Input
                    label="Weightage (%)"
                    name="weightage"
                    type="number"
                    value={formData.weightage}
                    onChange={handleChange}
                    required
                    className="text-gray-800 dark:text-darkTextPrimary"
                />

                <div className="w-full">
                    <label className="block mb-1 font-medium text-gray-800 dark:text-darkTextSecondary">
                        Due Date
                    </label>
                    <DatePicker
                        selected={dueDate}
                        onChange={(date) => setDueDate(date as Date)}
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
                        {mergedClos.map((clo) => {
                            if (!clo.id) return null;

                            const isChecked = formData.clos.includes(clo.id);

                            return (
                                <div
                                    key={clo.id}
                                    className={`flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer transition
                                    ${isChecked
                                            ? "bg-primary/10 border-gray-300 dark:bg-darkBlurple/20 dark:border-darkBlurple"
                                            : "bg-white dark:bg-darkSurface border-gray-300 dark:border-darkBorderLight"
                                        }`}
                                    onClick={() => {
                                        handleCLOToggle(clo.id!, !isChecked);
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        value={clo.id}
                                        checked={isChecked}
                                        onChange={() => { }} // we toggle via the div click
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
                    isLoading={updateAssessmentMutation.isPending}
                    loadingText="Updating..."
                    disabled={updateAssessmentMutation.isPending}
                    variant="gray"
                >
                    Update Assessment
                </Button>
            </form>
        </div>
    );
};

export default UpdateAssessmentForm;
