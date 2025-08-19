import { useState } from "react";
import DatePicker from "react-datepicker";
import { useToast } from "../../../../context/ToastContext";
import { createAttendanceSession } from "../../../../api/core/teacher/attendance-api";
import { Button } from "../../../ui/Button";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateAttendanceSessionFormProps {
    isOpen: boolean;
    onClose: () => void;
    offeringId: string;
}

const CreateAttendanceSessionForm: React.FC<CreateAttendanceSessionFormProps> = ({
    onClose,
    offeringId,
}) => {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [date, setDate] = useState<Date>(new Date());

    const createSessionMutation = useMutation({
        mutationFn: async () => {
            const isoDate = date.toISOString().split("T")[0]; // 'YYYY-MM-DD'
            return createAttendanceSession(offeringId, isoDate);
        },
        onSuccess: (result) => {
            if ((result as any).errors) {
                const errors = (result as any).errors;
                if (errors.date) {
                    toast.error(`Date error: ${errors.date[0]}`);
                } else {
                    toast.error("Validation failed");
                }
                return;
            }

            toast.success(result.message || "Attendance session created");
            // refresh session list
            queryClient.invalidateQueries({
                queryKey: ["attendance-sessions", offeringId],
            });
            onClose();
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to create session");
        },
    });

    const handleSubmit = () => {
        createSessionMutation.mutate();
    };

    return (
        <div className="p-6 w-full max-w-sm mx-auto flex flex-col items-center text-center bg-white dark:bg-darkSurface rounded-xl">
            <h2 className="text-xl font-semibold mb-6 text-primary dark:text-darkTextPrimary">
                Mark Attendance
            </h2>

            <div className="w-full text-left space-y-4">
                <div>
                    <label className="block mb-1 font-medium text-gray-700 dark:text-darkTextPrimary">
                        Select Date
                    </label>
                    <DatePicker
                        selected={date}
                        onChange={(date: Date | null) => {
                            if (date) setDate(date);
                        }}
                        dateFormat="yyyy-MM-dd"
                        placeholderText="Select due date"
                        required
                        wrapperClassName="w-full"
                        maxDate={new Date()}
                        dropdownMode="select"
                        className="w-full px-3 py-2 text-sm rounded-md
                        border border-gray-300 dark:border-darkBorderLight
                        bg-white dark:bg-darkMuted
                        text-gray-900 dark:text-darkTextPrimary
                        focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-darkBlurple"
                    />
                </div>

                <Button
                    isLoading={createSessionMutation.isPending}
                    loadingText="Creating..."
                    disabled={createSessionMutation.isPending}
                    onClick={handleSubmit}
                >
                    Create Attendance Session
                </Button>
            </div>
        </div>
    );
};

export default CreateAttendanceSessionForm;
