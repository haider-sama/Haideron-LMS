import { useState } from "react";
import { REGISTER_PROGRAM_YEARS_ARRAY } from "./RegisterProgramForm";
import { Program } from "../../../../../../server/src/shared/interfaces";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../../../context/ToastContext";
import TopCenterLoader from "../../../ui/TopCenterLoader";
import InternalError from "../../../../pages/forbidden/InternalError";
import { Helmet } from "react-helmet-async";
import { GLOBAL_TITLE } from "../../../../constants";
import { Input, SelectInput, TextAreaInput } from "../../../ui/Input";
import { DegreeEnum, DepartmentEnum } from "../../../../../../server/src/shared/enums";
import { deleteProgramById } from "../../../../api/core/program/program-api";
import { ProgramById } from "../../../../constants/core/interfaces";
import { Button } from "../../../ui/Button";

interface ProgramProps {
    programId: string;
    fetchProgram: (id: string) => Promise<{ program: ProgramById }>
    updateProgram: (id: string, data: Partial<Program>) => Promise<any>;
}

const ProgramProfile = ({ programId, fetchProgram, updateProgram }: ProgramProps) => {
    const queryClient = useQueryClient();
    const toast = useToast();

    const [program, setProgram] = useState<ProgramById | null>(null);
    const [editFields, setEditFields] = useState<Partial<ProgramById>>({});

    // Fetch single program
    const { data, isLoading, isError } = useQuery({
        queryKey: ['program', programId],
        enabled: !!programId,
        queryFn: async () => {
            if (!programId) throw new Error('Program ID is required');

            try {
                const data = await fetchProgram(programId); // use prop function
                // Side-effects: update state
                const { peos, ...safeData } = data.program;
                setProgram(data.program); // ProgramById
                setEditFields(safeData);  // Partial<ProgramById> without `peos`
                return data;
            } catch (err: any) {
                toast.error(err.message || 'Failed to fetch program.');
                throw err; // re-throw so react-query knows the query failed
            }
        },
        retry: false,
    });

    // Mutation for updating program
    const mutation = useMutation({
        mutationFn: (updatedData: Partial<Program>) => {
            if (!programId) throw new Error('Program ID is required for update');
            return updateProgram(programId, updatedData);
        },
        onSuccess: () => {
            toast.success('Program updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['program', programId] }); // note: use singular 'program'
        },
        onError: (err: any) => {
            if (err?.zodErrors) {
                Object.entries(err.zodErrors).forEach(([_, messages]) => {
                    if (Array.isArray(messages)) messages.forEach((msg) => toast.error(msg));
                });
            } else {
                toast.error(err.message || 'Failed to update program.');
            }
        },
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setEditFields((prev) => ({ ...prev, [name]: value }));
    };

    const isFormChanged =
        program &&
        Object.keys(editFields).some(
            (key) => editFields[key as keyof Program] !== program[key as keyof Program]
        );

    const handleSave = () => {
        const getEditableProgramFields = (data: Partial<Program>) => ({
            title: data.title,
            programLevel: data.programLevel,
            departmentTitle: data.departmentTitle,
            maxDurationYears: data.maxDurationYears,
            requirements: data.requirements,
            vision: data.vision,
            mission: data.mission,
        });
        const safePayload = getEditableProgramFields(editFields);
        mutation.mutate(safePayload);
    };

    const deleteMutation = useMutation({
        mutationFn: () => deleteProgramById(programId),
        onSuccess: () => {
            toast.success("Program deleted successfully");
            queryClient.invalidateQueries({ queryKey: ['program', programId] });
        },
        onError: (err: any) => {
            toast.error(err?.message || "Failed to delete program");
        },
    });

    // Delete handler
    const handleDelete = () => {
        const firstConfirm = window.confirm("Are you sure you want to delete this program?");
        if (!firstConfirm) return;

        const secondConfirm = window.confirm("This action is irreversible. Do you still want to proceed?");
        if (!secondConfirm) return;

        deleteMutation.mutate(); // trigger the mutation
    };

    // const getStrengthBadgeClass = (strength: string) => {
    //     switch (strength.toLowerCase()) {
    //         case "low":
    //             return "bg-red-50 text-red-600 ring-1 ring-inset ring-red-200 shadow-sm dark:bg-red-900 dark:text-red-300 dark:ring-red-700";
    //         case "medium":
    //             return "bg-yellow-50 text-yellow-600 ring-1 ring-inset ring-yellow-200 shadow-sm dark:bg-yellow-900 dark:text-yellow-200 dark:ring-yellow-700";
    //         case "high":
    //             return "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200 shadow-sm dark:bg-emerald-900 dark:text-emerald-200 dark:ring-emerald-700";
    //         default:
    //             return "bg-gray-50 text-gray-500 ring-1 ring-inset ring-gray-200 shadow-sm dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600";
    //     }
    // };

    if (isLoading || !program) return <TopCenterLoader />;
    if (isError) return <InternalError />;

    return (
        <div className="flex flex-col items-center px-4 space-y-8">
            <Helmet>
                <title>{GLOBAL_TITLE} - Program Management - Edit Program</title>
            </Helmet>

            <div className="w-full max-w-4xl p-6 space-y-6 bg-white dark:bg-darkSurface rounded-xl border border-gray-200 dark:border-darkBorderLight">
                <h1 className="text-2xl font-bold text-center text-black dark:text-white">
                    Edit Program Details
                </h1>


                {/* Basic Info Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    <Input
                        label="Title"
                        name="title"
                        value={editFields.title || ""}
                        onChange={handleChange}
                    />
                    <SelectInput
                        label="Program Level"
                        name="programLevel"
                        value={editFields.programLevel || ""}
                        onChange={handleChange}
                        options={Object.values(DegreeEnum)}
                        placeholder="Select Level"
                    />
                    <SelectInput
                        label="Department"
                        name="departmentTitle"
                        value={editFields.departmentTitle || ""}
                        onChange={handleChange}
                        options={Object.values(DepartmentEnum)}
                        placeholder="Select Department"
                    />
                    <SelectInput
                        label="Max Duration (Years)"
                        name="maxDurationYears"
                        value={editFields.maxDurationYears?.toString() || ""}
                        onChange={handleChange}
                        options={REGISTER_PROGRAM_YEARS_ARRAY.map((y) => ({
                            label: `${y} Year${y > 1 ? "s" : ""}`,
                            value: y.toString(), // Ensure value is a string if SelectInput expects string
                        }))}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                    <TextAreaInput
                        label="Requirements"
                        name="requirements"
                        value={editFields.requirements || ""}
                        onChange={handleChange}
                        rows={3}
                    />
                    <TextAreaInput
                        label="Vision"
                        name="vision"
                        value={editFields.vision || ""}
                        onChange={handleChange}
                        rows={3}
                    />
                    <TextAreaInput
                        label="Mission"
                        name="mission"
                        value={editFields.mission || ""}
                        onChange={handleChange}
                        rows={3}
                    />
                </div>

                {/* Submit Button */}
                <div className="flex justify-center pt-4 gap-4">
                    <Button isLoading={mutation.isPending} loadingText="Saving..." variant="gray"
                        disabled={!isFormChanged} onClick={handleSave} fullWidth={false}>
                        Save Changes
                    </Button>
                    <Button isLoading={deleteMutation.isPending} loadingText="Deleting..." variant="red"
                        disabled={deleteMutation.isPending} onClick={handleDelete} fullWidth={false}>
                        Delete Program
                    </Button>
                </div>
            </div>


        </div>
    );
};

export default ProgramProfile;
