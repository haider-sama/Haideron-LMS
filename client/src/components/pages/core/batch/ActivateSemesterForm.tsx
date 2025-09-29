import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import DatePicker from "react-datepicker";
import { useToast } from "../../../../shared/context/ToastContext";
import { TermEnum } from "../../../../../../server/src/shared/enums";
import { activateSemester } from "../../../../api/core/batch/batch-semester-api";
import { SelectInput } from "../../../ui/Input";
import { Button } from "../../../ui/Button";

const SEMESTER_NUMBERS = Array.from({ length: 8 }, (_, i) => i + 1);

interface ActivateSemesterFormProps {
    batchId: string;
    onClose: () => void;
}

const ActivateSemesterForm: React.FC<ActivateSemesterFormProps> = ({ batchId, onClose }) => {
    const queryClient = useQueryClient();
    const toast = useToast();

    const [semesterNo, setSemesterNo] = useState<number>(1);
    const [term, setTerm] = useState<TermEnum>(TermEnum.Fall);
    const [startedAt, setStartedAt] = useState<Date | null>(null);

    const mutation = useMutation({
        mutationFn: () =>
            activateSemester({
                programBatchId: batchId,
                semesterNo,
                term,
                startedAt: startedAt?.toISOString(),
            }),
        onSuccess: () => {
            toast.success(`Semester ${semesterNo} (${term}) activated successfully!`);
            queryClient.invalidateQueries({ queryKey: ["semesters", batchId] });
            onClose();
        },
        onError: (err: any) => {
            const errors = err?.errors;
            if (errors && typeof errors === "object") {
                Object.values(errors)
                    .flat()
                    .forEach((msg) => {
                        if (typeof msg === "string") toast.error(msg);
                    });
                return;
            }
            toast.error(err.message || "Failed to activate semester.");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!semesterNo || semesterNo < 1 || semesterNo > 8) {
            return toast.error("Select a valid semester number");
        }
        if (!term) {
            return toast.error("Select a valid term");
        }
        mutation.mutate();
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6 w-full max-w-md mx-auto px-4"
        >
            <h2 className="text-2xl font-semibold text-center">
                Activate a New Semester
            </h2>

            <div className="flex flex-col w-full">
                <SelectInput
                    label="Semester Number"
                    name="semesterNo"
                    value={semesterNo.toString()}
                    onChange={(e) => setSemesterNo(Number(e.target.value))}
                    options={SEMESTER_NUMBERS.map((num) => ({
                        label: `Semester ${num}`,
                        value: num.toString(),
                    }))}
                    className="w-full"
                />
            </div>

            {/* Term */}
            <div className="flex flex-col w-full">
                <SelectInput
                    label="Term"
                    name="term"
                    value={term}
                    onChange={(e) => setTerm(e.target.value as TermEnum)}
                    options={Object.values(TermEnum).map((t) => ({
                        label: t,
                        value: t,
                    }))}
                    className="w-full"
                />
            </div>

            {/* Start Date */}
            <div className="flex flex-col w-full">
                <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-darkTextPrimary">
                    Start Date (optional)
                </label>
                <DatePicker
                    selected={startedAt}
                    onChange={(date: Date | null) => setStartedAt(date)}
                    dateFormat="yyyy-MM-dd"
                    className="w-full border border-gray-300 dark:border-darkBorderLight bg-white dark:bg-darkSurface text-gray-900 dark:text-darkTextPrimary placeholder-gray-400 dark:placeholder-darkTextMuted px-3 py-2 rounded transition-colors duration-200"
                    placeholderText="Select a start date"
                    isClearable
                />
            </div>

            <div className="flex justify-center w-full">
                <Button
                    loadingText="Activating..."
                    isLoading={mutation.isPending}
                    disabled={mutation.isPending}
                >
                    Activate Semester
                </Button>
            </div>
        </form>
    );
};

export default ActivateSemesterForm;
