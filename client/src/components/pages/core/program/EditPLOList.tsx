import { useEffect, useState } from "react";
import { FiEdit3, FiChevronUp } from "react-icons/fi";
import { PLOFrontend } from "../../../../constants/core/interfaces";
import { useToast } from "../../../../context/ToastContext";
import { Input, TextAreaInput } from "../../../ui/Input";
import TopCenterLoader from "../../../ui/TopCenterLoader";
import { deletePLO, getPLOsForProgram, updatePLO } from "../../../../api/core/program-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../../ui/Button";
import ErrorStatus from "../../../ui/ErrorStatus";

interface EditPLOListProps {
    programId: string;
}

const EditPLOList: React.FC<EditPLOListProps> = ({ programId }) => {
    const [editedPlos, setEditedPlos] = useState<PLOFrontend[]>([]);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [savingIndex, setSavingIndex] = useState<number | null>(null);
    const toast = useToast();
    const queryClient = useQueryClient();

    // Fetch PLOs
    const { data, isLoading, isError } = useQuery({
        queryKey: ["plos", programId],
        queryFn: async () => {
            if (!programId) throw new Error("Program ID is required");
            return getPLOsForProgram(programId);
        },
        enabled: !!programId,
        retry: false,
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    // Side effect for setting state
    useEffect(() => {
        if (data?.plos) {
            setEditedPlos(data.plos);
        }
    }, [data]);

    // Mutation: update PLO
    const updateMutation = useMutation({
        mutationFn: (plo: PLOFrontend) => updatePLO(programId, plo.id, {
            code: plo.code,
            title: plo.title,
            description: plo.description
        }),
        onSuccess: (_, variables) => {
            toast.success(`${variables.code} updated successfully`);
            queryClient.invalidateQueries({ queryKey: ["peos", programId] });
            queryClient.invalidateQueries({ queryKey: ["plos", programId] });
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

    const handleChange = (index: number, field: keyof PLOFrontend, value: string) => {
        const updated = [...editedPlos];
        updated[index][field] = value;
        setEditedPlos(updated);
    };

    const handleSave = (index: number) => {
        const plo = editedPlos[index];
        if (!plo.id) return toast.error("PLO ID missing");
        setSavingIndex(index);
        updateMutation.mutate(plo, {
            onSettled: () => setSavingIndex(null),
        });
    };

    // Mutation: delete PLO
    const handleDeletePLO = async (index: number) => {
        const plo = editedPlos[index];
        if (!plo.id) return toast.error("PLO ID missing");

        if (!confirm("Are you sure you want to delete this PLO?")) return;

        try {
            await deletePLO(programId, plo.id);
            toast.success("PLO deleted successfully");

            // Remove locally without refetch
            setEditedPlos(prev => prev.filter((_, i) => i !== index));
            queryClient.invalidateQueries({ queryKey: ["peos", programId] });
            queryClient.invalidateQueries({ queryKey: ["plos", programId] });
        } catch (err: any) {
            toast.error(err.message || "Failed to delete PLO.");
        }
    };

    if (isLoading) return <TopCenterLoader />
    if (isError) return <ErrorStatus message="Failed to fetch PLOs" />

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <h2 className="text-2xl font-semibold mb-6 text-center text-black dark:text-darkTextPrimary">
                Edit Program Learning Outcomes (PLOs)
            </h2>

            <div className="space-y-6">
                {editedPlos.map((plo, index) => {
                    const isExpanded = expandedIndex === index;

                    return (
                        <div
                            key={plo.id}
                            className="bg-white dark:bg-darkSurface rounded-xl border border-gray-200 dark:border-darkBorderLight p-6"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-base font-semibold text-gray-800 dark:text-darkTextPrimary">
                                    {plo.code} – {plo.title}
                                </h3>
                                <button
                                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                                    className="text-black dark:text-white hover:text-blue-600 dark:hover:text-darkBlurple text-xl"
                                    title={isExpanded ? "Collapse" : "Edit"}
                                >
                                    {isExpanded ? <FiChevronUp /> : <FiEdit3 />}
                                </button>
                            </div>

                            {/* Collapsed View */}
                            {!isExpanded && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-800 dark:text-darkTextPrimary">
                                    <div>
                                        <span className="block font-semibold">Code:</span>
                                        <span className="text-gray-600 dark:text-darkTextMuted">{plo.code}</span>
                                    </div>
                                    <div>
                                        <span className="block font-semibold">Title:</span>
                                        <span className="text-gray-600 dark:text-darkTextMuted">{plo.title}</span>
                                    </div>
                                    <div>
                                        <span className="block font-semibold">Description:</span>
                                        <span className="text-gray-600 dark:text-darkTextMuted">{plo.description}</span>
                                    </div>
                                </div>
                            )}

                            {/* Expanded View */}
                            {isExpanded && (
                                <div className="mt-4 space-y-4 border-t border-gray-200 dark:border-darkBorderLight pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Input
                                            label="Code"
                                            name="code"
                                            value={plo.code}
                                            onChange={(e) => handleChange(index, "code", e.target.value)}
                                        />
                                        <Input
                                            label="Title"
                                            name="title"
                                            value={plo.title}
                                            onChange={(e) => handleChange(index, "title", e.target.value)}
                                        />
                                    </div>

                                    <TextAreaInput
                                        label="Description"
                                        name="description"
                                        value={plo.description}
                                        onChange={(e) => handleChange(index, "description", e.target.value)}
                                    />

                                    <div className="flex justify-between items-center mt-4 flex-wrap gap-2">
                                        <Button onClick={() => handleDeletePLO(index)} fullWidth={false}
                                            variant="red">
                                            Delete PLO
                                        </Button>

                                        <Button isLoading={savingIndex === index} loadingText="Saving..."
                                            variant="gray" disabled={savingIndex === index}
                                            onClick={() => handleSave(index)} fullWidth={false}>
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EditPLOList;
