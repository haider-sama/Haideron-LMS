import React, { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { AddPLOPayload } from "../../../../constants/core/interfaces";
import { useToast } from "../../../../context/ToastContext";
import { addPLOsToProgram } from "../../../../api/core/program-api";
import { Input, SelectInput } from "../../../ui/Input";
import { Button } from "../../../ui/Button";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const AddPLOsForm = ({ programId }: { programId: string | null }) => {
    const [plos, setPlos] = useState<AddPLOPayload[]>([]);
    const toast = useToast();
    const queryClient = useQueryClient();

    // Add new PLO field
    const addPLOField = () =>
        setPlos([...plos, { code: "", title: "", description: "" }]);

    // Remove PLO field
    const removePLOField = (index: number) =>
        setPlos((prev) => prev.filter((_, i) => i !== index));

    // Update field value
    const handleChange = (index: number, field: keyof AddPLOPayload, value: string) => {
        const updated = [...plos];
        updated[index][field] = value;
        setPlos(updated);
    };

    const mutation = useMutation({
        mutationFn: async (payload: AddPLOPayload[]) => {
            if (!programId) throw new Error("Program ID not found.");
            return addPLOsToProgram(programId, payload);
        },
        onSuccess: () => {
            toast.success("PLOs added successfully.");
            setPlos([]);
            queryClient.invalidateQueries({ queryKey: ["programs", programId] });
        },
        onError: (err: any) => {
            if (err?.zodErrors && typeof err.zodErrors === "object") {
                const zodErrors = err.zodErrors as Record<string, string[]>;
                Object.values(zodErrors).forEach((messages) =>
                    messages.forEach((msg) => toast.error(msg))
                );
            } else {
                toast.error(err.message || "Failed to add PLOs");
            }
        },
    });

    // Submit PLOs
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!programId) return toast.error("Program ID not found.");
        await mutation.mutateAsync(plos);
    };


    return (
        <form onSubmit={handleSubmit} className="space-y-8 p-6 mx-auto ">
            <h2 className="text-xl font-bold">Add PLOs</h2>

            {plos.map((plo, idx) => (
                <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-end gap-2"
                >
                    <div className="w-full sm:w-1/4">
                        <SelectInput
                            label="Code"
                            name="code"
                            value={plo.code}
                            onChange={(e) => handleChange(idx, "code", e.target.value)}
                            options={Array.from({ length: 10 }, (_, i) => `PLO${i + 1}`)}
                        />
                    </div>

                    <div className="w-full sm:w-1/2">
                        <Input
                            type="string"
                            label="Title"
                            name="title"
                            value={plo.title}
                            onChange={(e) => handleChange(idx, "title", e.target.value)}
                        />
                    </div>

                    <div className="w-full sm:w-1/3">
                        <Input
                            type="string"
                            label="Description"
                            placeholder="Description"
                            name="description"
                            value={plo.description}
                            onChange={(e) => handleChange(idx, "description", e.target.value)}
                        />
                    </div>

                    <div className="w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => removePLOField(idx)}
                            className="w-full sm:w-auto text-red-500 hover:text-red-700 text-sm flex items-center justify-center border border-red-300 rounded px-2 py-1"
                            title="Remove PLO"
                        >
                            <FiTrash2 className="mr-1" />
                            <span>Delete</span>
                        </button>
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={addPLOField}
                className="text-blue-600 text-sm"
            >
                + Add PLO
            </button>

            <div className="flex justify-center">
                <Button isLoading={mutation.isPending} loadingText="Submitting..."
                    disabled={mutation.isPending || plos.length === 0} fullWidth={false}>
                    Submit PLOs
                </Button>
            </div>
        </form >
    );
};

export default AddPLOsForm;
