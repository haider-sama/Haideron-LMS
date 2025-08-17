import React, { useState } from "react";
import { usePermissions } from "../../../../hooks/usePermissions";
import { useToast } from "../../../../context/ToastContext";
import { getCataloguesByProgram } from "../../../../api/core/catalogue-api";
import { MAX_PAGE_LIMIT } from "../../../../constants";
import { createProgramBatch } from "../../../../api/core/batch/batch-api";
import { SelectInput } from "../../../ui/Input";
import { Button } from "../../../ui/Button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type CreateBatchFormData = {
    programId: string;
    programCatalogueId: string;
    sessionYear: string;
};

interface CreateBatchFormProps {
    programs: { id: string; title: string }[];
    onClose: () => void;
}

const currentYear = new Date().getFullYear();
const availableYears = Array.from({ length: 6 }, (_, i) => {
    const year = currentYear + i;
    return { label: `${year}`, value: year.toString() };
});

const CreateBatchForm: React.FC<CreateBatchFormProps> = ({ programs, onClose }) => {
    const { user, isLoggedIn, isAdmin } = usePermissions();
    const toast = useToast();
    const queryClient = useQueryClient();

    const [form, setForm] = useState<CreateBatchFormData>({
        programId: programs[0]?.id || "",
        programCatalogueId: "",
        sessionYear: currentYear.toString(),
    });


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Load catalogues for selected program
    const { data: cataloguesData } = useQuery({
        queryKey: ["catalogues", form.programId],
        queryFn: () => getCataloguesByProgram({ programId: form.programId, limit: MAX_PAGE_LIMIT }),
        enabled: !!form.programId, // only fetch if program selected
    });

    const catalogues = cataloguesData?.data || [];

    const mutation = useMutation({
        mutationFn: ({ programId, programCatalogueId, sessionYear }: CreateBatchFormData) =>
            createProgramBatch(programId, programCatalogueId, Number(sessionYear)),
        onSuccess: () => {
            toast.success("Program batch created successfully.");
            onClose();
            // Optional: reset form
            setForm({
                programId: programs[0]?.id || "",
                programCatalogueId: "",
                sessionYear: currentYear.toString(),
            });
            
            queryClient.invalidateQueries({ queryKey: ["batches"] });
        },
        onError: (err: any) => {
            if (err.fieldErrors) {
                const fieldErrors = err.fieldErrors as Record<string, string[]>;
                for (const messages of Object.values(fieldErrors)) {
                    messages.forEach((msg) => toast.error(msg));
                }
            } else {
                toast.error(err.message || "Something went wrong");
            }
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoggedIn || !user) return toast.error("You must be logged in.");

        const { programId, programCatalogueId, sessionYear } = form;
        if (!programId || !programCatalogueId || !sessionYear) {
            return toast.error("All fields are required.");
        }

        mutation.mutate(form);
    };

    return (
        <div className="flex justify-center items-center">
            <div className="p-6 w-full max-w-md space-y-4">
                <h2 className="text-2xl font-semibold text-center">Create New Program Batch</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isAdmin && (
                        <SelectInput
                            label="Select Program"
                            name="programId"
                            value={form.programId}
                            onChange={handleChange}
                            options={programs.map((prog) => ({
                                label: prog.title,
                                value: prog.id,
                            }))}
                            disabled={mutation.isPending}
                        />
                    )}

                    <SelectInput
                        label="Select Program Catalogue"
                        name="programCatalogueId"
                        value={form.programCatalogueId}
                        onChange={handleChange}
                        options={catalogues.map((cat) => ({
                            label: cat.catalogueYear.toString(),
                            value: cat.id,
                        }))}
                        disabled={mutation.isPending || !form.programId}
                    />

                    <SelectInput
                        label="Session Year"
                        name="sessionYear"
                        value={form.sessionYear}
                        onChange={handleChange}
                        options={availableYears}
                        disabled={mutation.isPending}
                    />

                    <Button
                        loadingText="Creating..."
                        isLoading={mutation.isPending}
                        disabled={mutation.isPending}
                    >
                        Create Batch
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default CreateBatchForm;
