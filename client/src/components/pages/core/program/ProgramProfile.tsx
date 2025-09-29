import { useEffect, useState } from "react";
import { REGISTER_PROGRAM_YEARS_ARRAY } from "./RegisterProgramForm";
import { Program } from "../../../../../../server/src/shared/interfaces";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../../../shared/context/ToastContext";
import TopCenterLoader from "../../../ui/TopCenterLoader";
import { Helmet } from "react-helmet-async";
import { GLOBAL_TITLE } from "../../../../shared/constants";
import { Input, SelectInput, TextAreaInput } from "../../../ui/Input";
import { DegreeEnum, DepartmentEnum } from "../../../../../../server/src/shared/enums";
import { deleteProgramById } from "../../../../api/core/program-api";
import { Button } from "../../../ui/Button";
import ErrorStatus from "../../../ui/ErrorStatus";

interface ProgramProps {
    programId: string;
    fetchProgram: (id: string) => Promise<{ program: Program }>
    updateProgram: (id: string, data: Partial<Program>) => Promise<any>;
}

const ProgramProfile = ({ programId, fetchProgram, updateProgram }: ProgramProps) => {
    const queryClient = useQueryClient();
    const toast = useToast();
    const [editFields, setEditFields] = useState<Partial<Program>>({});

    // Fetch single program
    const { data, isLoading, isError } = useQuery({
        queryKey: ['program', programId],
        enabled: !!programId,
        queryFn: () => fetchProgram(programId),
        retry: false,
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    const program = data?.program;

    useEffect(() => {
        if (program) {
            setEditFields(program); // initialize form only when program changes
        }
    }, [program]);

    // Mutation for updating program
    const mutation = useMutation({
        mutationFn: (updatedData: Partial<Program>) => {
            if (!programId) throw new Error('Program ID is required for update');
            return updateProgram(programId, updatedData);
        },
        onSuccess: () => {
            toast.success('Program updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['programs'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['program', programId] }); // refresh single program
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
            queryClient.invalidateQueries({ queryKey: ['programs'], exact: false });
            queryClient.removeQueries({ queryKey: ['program', programId] }); // optional: clear single program cache
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


    if (isLoading || !program) return <TopCenterLoader />;
    if (isError) return <ErrorStatus message="Failed to fetch program details" />

    return (
        <div className="flex flex-col items-center px-4 space-y-8">
            <Helmet>
                <title>{GLOBAL_TITLE} - Program Management - Edit Program</title>
            </Helmet>

            <div className="w-full max-w-4xl p-6 space-y-6 bg-white dark:bg-darkSurface">
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
