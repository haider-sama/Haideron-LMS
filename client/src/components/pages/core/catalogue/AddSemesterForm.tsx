import React, { useState } from "react";
import { usePermissions } from "../../../../hooks/usePermissions";
import { useToast } from "../../../../context/ToastContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addSemesterToCatalogue } from "../../../../api/core/semester-api";
import { SelectInput } from "../../../ui/Input";
import { Button } from "../../../ui/Button";
import { AddSemesterPayload } from "../../../../constants/core/interfaces";


const semesterNumbers = Array.from({ length: 8 }, (_, i) => ({
    label: `Semester ${i + 1}`,
    value: `${i + 1}`,
}));

const AddSemesterForm: React.FC<{ catalogueId: string; onSuccess?: () => void }> = ({
    catalogueId,
    onSuccess,
}) => {
    const { user, isLoggedIn } = usePermissions();
    const [semesterNo, setSemesterNo] = useState("1");
    const toast = useToast();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (payload: AddSemesterPayload) => addSemesterToCatalogue(payload),
        onSuccess: () => {
            toast.success("Semester created successfully.");
            queryClient.invalidateQueries({ queryKey: ["semesters", catalogueId] });
            setSemesterNo("1");
            onSuccess?.();
        },
        onError: (err: any) => {
            if (err.fieldErrors) {
                const fieldErrors = err.fieldErrors as Record<string, string[]>;
                for (const messages of Object.values(fieldErrors)) {
                    messages.forEach((msg) => toast.error(msg));
                }
            } else {
                toast.error(err.message || "Failed to create semester");
            }
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoggedIn || !user) return toast.error("You must be logged in.");
        if (!catalogueId || !semesterNo) return toast.error("All fields are required.");

        mutation.mutate({
            programCatalogueId: catalogueId,
            semesterNo: Number(semesterNo),
        });
    };

    return (
        <div className="p-6 mx-auto w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-center">Add a New Semester</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <SelectInput
                    label="Semester Number"
                    name="semesterNo"
                    value={semesterNo}
                    onChange={(e) => setSemesterNo(e.target.value)}
                    options={semesterNumbers}
                    disabled={mutation.isPending}
                    className="w-full"
                />

                <div className="flex justify-center">
                    <Button
                        loadingText="Adding..."
                        isLoading={mutation.isPending}
                        disabled={mutation.isPending}
                    >
                        Add Semester
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AddSemesterForm;