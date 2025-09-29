import React, { useEffect, useState } from "react";
import { usePermissions } from "../../../../features/auth/hooks/usePermissions";
import { useToast } from "../../../../shared/context/ToastContext";
import { DegreeEnum, DepartmentEnum } from "../../../../../../server/src/shared/enums";
import { registerProgram } from "../../../../api/core/program-api";
import { Input, ReadOnlyInput, SelectInput, TextAreaInput } from "../../../ui/Input";
import { Button } from "../../../ui/Button";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Reuse constants
export const REGISTER_PROGRAM_YEARS_ARRAY = [1, 2, 3, 4, 5, 6, 7, 8];

const RegisterProgramForm = ({ onSuccess }: { onSuccess?: () => void }) => {
    const { user, isLoggedIn, isAdmin, isDepartmentHead } = usePermissions();

    const toast = useToast();
    const queryClient = useQueryClient();

    const [form, setForm] = useState({
        title: "",
        programLevel: DegreeEnum.BS,
        departmentTitle: DepartmentEnum.CSE,
        maxDurationYears: 4,
        requirements: "",
        vision: "",
        mission: "",
        createdBy: user?.id || "",
    });

    useEffect(() => {
        if (isDepartmentHead && user?.department) {
            setForm(prev => ({
                ...prev,
                departmentTitle: user.department as DepartmentEnum,
            }));
        }
    }, [isDepartmentHead, user?.department]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const registerProgramMutation = useMutation({
        mutationFn: (payload: typeof form) => registerProgram(payload),
        onSuccess: () => {
            toast.success("Program registered successfully.");
            queryClient.invalidateQueries({ queryKey: ['programs'] });
            setForm(prev => ({ ...prev, title: "", requirements: "", vision: "", mission: "" }));
            if (onSuccess) onSuccess();
        },
        onError: async (err: any) => {
            // Try to parse the error response if fetch returned a JSON
            if (err?.fieldErrors) {
                Object.entries(err.fieldErrors).forEach(([_, messages]) => {
                    if (Array.isArray(messages)) {
                        messages.forEach(msg => toast.error(msg));
                    }
                });
            } else if (err?.message) {
                toast.error(err.message);
            } else {
                toast.error("An error occurred while registering the program.");
            }
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoggedIn || !user) return toast.error("You must be logged in.");
        registerProgramMutation.mutate({ ...form, createdBy: user.id });
    };

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="p-6 w-full max-w-xl space-y-4">
                <h2 className="text-2xl font-semibold text-center">Register New Program</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Program Title"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        disabled={registerProgramMutation.isPending}
                    />

                    <SelectInput
                        label="Program Level"
                        name="programLevel"
                        value={form.programLevel}
                        onChange={handleChange}
                        options={Object.values(DegreeEnum)}
                        disabled={registerProgramMutation.isPending}
                    />

                    {isAdmin ? (
                        <SelectInput
                            label="Department"
                            name="departmentTitle"
                            value={form.departmentTitle}
                            onChange={handleChange}
                            options={Object.values(DepartmentEnum)}
                            disabled={registerProgramMutation.isPending}
                        />
                    ) : isDepartmentHead ? (
                        <ReadOnlyInput
                            label="Department"
                            value={user?.department} // Or dashboard.departmentTitle if stored there
                        />
                    ) : null}

                    <SelectInput
                        label="Max Duration (Years)"
                        name="maxDurationYears"
                        value={form.maxDurationYears}
                        onChange={handleChange}
                        options={REGISTER_PROGRAM_YEARS_ARRAY.map((y) => ({ label: `${y} Year${y > 1 ? "s" : ""}`, value: y }))}
                        disabled={registerProgramMutation.isPending}
                    />

                    <TextAreaInput
                        name="requirements"
                        label="Requirements"
                        placeholder="Requirements"
                        value={form.requirements}
                        onChange={handleChange}
                        disabled={registerProgramMutation.isPending}
                    />

                    <TextAreaInput
                        name="vision"
                        label="Vision"
                        placeholder="Vision"
                        value={form.vision}
                        onChange={handleChange}
                        disabled={registerProgramMutation.isPending}
                    />

                    <TextAreaInput
                        name="mission"
                        label="Mission"
                        placeholder="Mission"
                        value={form.mission}
                        onChange={handleChange}
                        disabled={registerProgramMutation.isPending}
                    />

                    <Button disabled={registerProgramMutation.isPending} loadingText="Registering..."
                        isLoading={registerProgramMutation.isPending} >
                        Register Program
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default RegisterProgramForm;
