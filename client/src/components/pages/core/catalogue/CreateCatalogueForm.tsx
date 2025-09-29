import React, { useState } from "react";
import { usePermissions } from "../../../../features/auth/hooks/usePermissions";
import { useToast } from "../../../../shared/context/ToastContext";
import { createProgramCatalogue } from "../../../../api/core/catalogue-api";
import { SelectInput } from "../../../ui/Input";
import { Button } from "../../../ui/Button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Program } from "../../../../../../server/src/shared/interfaces";

type CreateCatalogueFormData = {
    programs: Program[];
    onSuccess?: () => void;
};

const currentYear = new Date().getFullYear();
const availableYears = Array.from({ length: 6 }, (_, i) => {
    const year = currentYear + i;
    return { label: `${year}`, value: year.toString() };
});

const CreateCatalogueForm: React.FC<CreateCatalogueFormData> = ({ programs, onSuccess }) => {
    const { user, isLoggedIn } = usePermissions();
    const queryClient = useQueryClient();
    const toast = useToast();

    const [form, setForm] = useState({
        programId: programs[0]?.id || "", // default to first program if available
        catalogueYear: currentYear.toString(),
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Mutation for creating catalogue
    const createCatalogueMutation = useMutation({
        mutationFn: (payload: { programId: string; catalogueYear: number }) =>
            createProgramCatalogue(payload.programId, payload.catalogueYear),
        onSuccess: () => {
            toast.success("Catalogue created successfully.");
            setForm({ programId: programs[0]?.id || "", catalogueYear: currentYear.toString() });
            queryClient.invalidateQueries({ queryKey: ["catalogues"] });
            onSuccess?.();
        },
        onError: (err: any) => {
            if (err?.fieldErrors) {
                Object.values(err.fieldErrors).forEach((messages: any) => {
                    if (Array.isArray(messages)) messages.forEach((msg) => toast.error(msg));
                });
            } else if (err?.message) {
                toast.error(err.message);
            } else {
                toast.error("An error occurred while registering the catalogue.");
            }
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoggedIn || !user) return toast.error("You must be logged in.");
        if (!form.programId || !form.catalogueYear) return toast.error("All fields are required.");

        createCatalogueMutation.mutate({
            programId: form.programId,
            catalogueYear: Number(form.catalogueYear),
        });
    };

    return (
        <div className="flex justify-center items-center">
            <div className="p-6 w-full max-w-md space-y-4">
                <h2 className="text-2xl font-bold text-center">Create New Catalogue</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <SelectInput
                        label="Select Program"
                        name="programId"
                        value={form.programId}
                        onChange={handleChange}
                        options={programs.map((prog) => ({
                            label: prog.title,
                            value: prog.id,
                        }))}
                        disabled={createCatalogueMutation.isPending}
                    />

                    <SelectInput
                        label="Catalogue Year"
                        name="catalogueYear"
                        value={form.catalogueYear}
                        onChange={handleChange}
                        options={availableYears}
                        disabled={createCatalogueMutation.isPending}
                    />

                    <Button disabled={createCatalogueMutation.isPending}
                        isLoading={createCatalogueMutation.isPending} loadingText="Creating..."
                        size="md">
                        Create Catalogue
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default CreateCatalogueForm;
