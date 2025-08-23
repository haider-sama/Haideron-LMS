import { useEffect, useState } from "react";
import { FiEdit3, FiChevronUp, FiTrash2 } from "react-icons/fi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deletePEO, getPEOsForProgram, getPLOsForProgram, updatePEOInProgram } from "../../../../api/core/program-api";
import { PEOFrontend, PEOUpdatePayload, PEOWithMappings, PLOFrontend } from "../../../../constants/core/interfaces";
import { PEO } from "../../../../../../server/src/shared/interfaces";
import { useToast } from "../../../../context/ToastContext";
import { StrengthEnum } from "../../../../../../server/src/shared/enums";
import { SelectInput, TextAreaInput } from "../../../ui/Input";
import TopCenterLoader from "../../../ui/TopCenterLoader";
import ErrorStatus from "../../../ui/ErrorStatus";

interface EditPEOListProps {
    programId: string;
}

const EditPEOList = ({ programId }: EditPEOListProps) => {
    const [plos, setPlos] = useState<PLOFrontend[]>([]);
    const [editedPeos, setEditedPeos] = useState<PEOFrontend[]>([]);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [savingIndex, setSavingIndex] = useState<number | null>(null);
    const toast = useToast();
    const queryClient = useQueryClient();

    // Fetch PEOs
    const { data, isLoading, isError } = useQuery({
        queryKey: ["peos", programId],
        queryFn: () => getPEOsForProgram(programId),
        enabled: !!programId,
        retry: false,
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    // Sync data to local state
    useEffect(() => {
        if (!data?.peos) return;

        const mappedPeos: PEOFrontend[] = data.peos.map((peo: PEOWithMappings) => ({
            id: peo.id,
            title: peo.title,
            description: peo.description,
            ploMapping: peo.mappings.map((m) => ({
                plo: {
                    id: m.ploId,
                    code: m.ploCode,
                    title: m.ploTitle,
                    description: m.ploDescription,
                },
                strength: m.strength,
            })),
        }));

        setEditedPeos(mappedPeos);
    }, [data]);

    // Fetch PLOs for the program
    useEffect(() => {
        if (!programId) return;

        const fetchPLOs = async () => {
            try {
                const response = await getPLOsForProgram(programId);
                setPlos(response.plos ?? []);
            } catch (err: any) {
                console.error("Failed to fetch PLOs:", err.message);
                toast.error(err.message || "Failed to load PLOs");
            }
        };

        fetchPLOs();
    }, [programId, toast]);

    // Mutation for updating a PEO
    const updateMutation = useMutation({
        mutationFn: (payload: { peoId: string; update: PEOUpdatePayload }) =>
            updatePEOInProgram(programId, payload.peoId, payload.update),
        onSuccess: () => {
            toast.success("PEO updated successfully");
            queryClient.invalidateQueries({ queryKey: ["peos", programId] });
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

    const handlePeoChange = (index: number, field: keyof PEO, value: string) => {
        const updated = [...editedPeos];
        (updated[index] as any)[field] = value;
        setEditedPeos(updated);
    };

    const handleMappingChange = (
        peoIndex: number,
        mapIndex: number,
        field: "plo" | "strength",
        value: string
    ) => {
        const updated = [...editedPeos];
        if (field === "strength") {
            updated[peoIndex].ploMapping[mapIndex].strength = value as StrengthEnum;
        } else {
            const selectedPlo = plos.find((p) => p.id === value);
            if (selectedPlo) updated[peoIndex].ploMapping[mapIndex].plo = selectedPlo;
        }
        setEditedPeos(updated);
    };

    const handleAddMapping = (peoIndex: number) => {
        if (!plos.length) {
            toast.error("No PLOs available to map");
            return;
        }
        const updated = [...editedPeos];
        updated[peoIndex].ploMapping.push({
            plo: plos[0],
            strength: StrengthEnum.Medium,
        });
        setEditedPeos(updated);
    };

    const handleRemoveMapping = (peoIndex: number, mapIndex: number) => {
        const updated = [...editedPeos];
        updated[peoIndex].ploMapping.splice(mapIndex, 1);
        setEditedPeos(updated);
    };

    const handleSave = (peoIndex: number) => {
        const peo = editedPeos[peoIndex];
        if (!peo.id) return toast.error("PEO ID missing");

        const payload: PEOUpdatePayload = {
            title: peo.title,
            description: peo.description,
            ploMapping: peo.ploMapping.map((map) => ({
                plo: map.plo.id!,
                strength: map.strength,
            })),
        };

        setSavingIndex(peoIndex);
        updateMutation.mutate(
            { peoId: peo.id, update: payload },
            {
                onSettled: () => setSavingIndex(null),
            }
        );
    };

    const handleDeletePEO = async (peoIndex: number) => {
        if (editedPeos.length <= 1) {
            return toast.error("Cannot delete the only PEO");
        }

        const peo = editedPeos[peoIndex];
        if (!peo.id) return toast.error("PEO ID missing");

        if (!confirm("Are you sure you want to delete this PEO?")) return;

        try {
            await deletePEO(programId, peo.id);
            toast.success("PEO deleted successfully");
            const updated = [...editedPeos];
            updated.splice(peoIndex, 1);
            setEditedPeos(updated);
            queryClient.invalidateQueries({ queryKey: ["peos", programId] });
        } catch (err: any) {
            toast.error(err.message || "Failed to delete PEO");
        }
    };

    const getStrengthBadgeClass = (strength: string) => {
        switch (strength.toLowerCase()) {
            case "low":
                return "bg-red-50 text-red-600 ring-1 ring-inset ring-red-200 shadow-sm dark:bg-red-900 dark:text-red-300 dark:ring-red-700";
            case "medium":
                return "bg-yellow-50 text-yellow-600 ring-1 ring-inset ring-yellow-200 shadow-sm dark:bg-yellow-900 dark:text-yellow-200 dark:ring-yellow-700";
            case "high":
                return "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200 shadow-sm dark:bg-emerald-900 dark:text-emerald-200 dark:ring-emerald-700";
            default:
                return "bg-gray-50 text-gray-500 ring-1 ring-inset ring-gray-200 shadow-sm dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600";
        }
    };

    if (isLoading) return <TopCenterLoader />
    if (isError) return <ErrorStatus message="Failed to fetch PEOs" />

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-6">
            <h2 className="text-2xl font-semibold text-center mb-6 text-black dark:text-darkTextPrimary">
                Edit Program Educational Objectives (PEOs)
            </h2>

            <div className="space-y-6">
                {editedPeos.map((peo, idx) => {
                    const isExpanded = expandedIndex === idx;

                    return (
                        <div
                            key={idx}
                            className="bg-white dark:bg-darkSurface rounded-xl border border-gray-200 dark:border-darkBorderLight p-6"
                        >
                            {/* Collapsed View */}
                            <div className="flex justify-between items-start">
                                <div className="w-full space-y-2 text-sm text-gray-800 dark:text-darkTextPrimary">
                                    <div>
                                        <span className="font-semibold">Title:</span> {peo.title}
                                    </div>
                                    <div>
                                        <div className="font-semibold">Description:</div>
                                        <p className="text-gray-600 dark:text-darkTextMuted whitespace-pre-line">
                                            {peo.description}
                                        </p>
                                    </div>
                                    <div className="font-semibold pt-2">
                                        Mapped PLOs:
                                        <ul className="mt-2 space-y-2 text-gray-800 dark:text-darkTextPrimary pl-4 text-sm">
                                            {peo.ploMapping.map((map, i) => (
                                                <li key={i} className="flex items-center gap-2">
                                                    <span className="font-medium">{map.plo.code}</span>
                                                    <span className="text-gray-600 dark:text-darkTextMuted truncate">
                                                        {map.plo.title}
                                                    </span>
                                                    <span
                                                        className={`text-xs font-semibold px-2 rounded-full ${getStrengthBadgeClass(map.strength)}`}
                                                    >
                                                        {map.strength}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                                    className="text-black dark:text-darkTextPrimary hover:text-blue-600 dark:hover:text-darkBlurple text-xl ml-4"
                                    title={isExpanded ? "Collapse" : "Edit"}
                                >
                                    {isExpanded ? <FiChevronUp /> : <FiEdit3 />}
                                </button>
                            </div>

                            {/* Expanded Edit Form */}
                            {isExpanded && (
                                <div className="mt-6 border-t border-gray-200 dark:border-darkBorderLight pt-4 space-y-4">
                                    <SelectInput
                                        label="Title"
                                        name={`peo-title-${idx}`}
                                        value={peo.title}
                                        onChange={(e) => handlePeoChange(idx, "title", e.target.value)}
                                        options={Array.from({ length: 10 }, (_, i) => `PEO${i + 1}`)}
                                    />
                                    <TextAreaInput
                                        label="Description"
                                        name={`peo-description-${idx}`}
                                        value={peo.description}
                                        onChange={(e) => handlePeoChange(idx, "description", e.target.value)}
                                    />

                                    {/* Mapped PLOs */}
                                    <div className="space-y-2">
                                        <div className="font-medium text-gray-800 dark:text-darkTextPrimary">Mapped PLOs:</div>
                                        {peo.ploMapping.map((map, mIdx) => (
                                            <div key={mIdx} className="flex flex-col sm:flex-row gap-2 items-end">
                                                <div className="w-full sm:flex-1">
                                                    <SelectInput
                                                        label="PLO"
                                                        name={`plo-${idx}-${mIdx}`}
                                                        value={map.plo.id ?? ""}
                                                        onChange={(e) => handleMappingChange(idx, mIdx, "plo", e.target.value)}
                                                        options={plos.map((plo) => ({
                                                            label: `${plo.code} – ${plo.title}`,
                                                            value: plo.id ?? "",
                                                        }))}
                                                    />
                                                </div>
                                                <div className="w-full sm:w-40">
                                                    <SelectInput
                                                        label="Strength"
                                                        name={`strength-${idx}-${mIdx}`}
                                                        value={map.strength}
                                                        onChange={(e) => handleMappingChange(idx, mIdx, "strength", e.target.value)}
                                                        options={Object.values(StrengthEnum)}
                                                    />
                                                </div>
                                                {peo.ploMapping.length > 1 && (
                                                    <button
                                                        onClick={() => handleRemoveMapping(idx, mIdx)}
                                                        className="text-red-600 hover:text-red-800 text-xs border border-red-300 px-2 py-1 rounded"
                                                    >
                                                        <FiTrash2 className="inline-block mr-2" />
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => handleAddMapping(idx)}
                                            className="text-sm text-blue-600 hover:underline dark:text-darkBlurple dark:hover:text-darkBlurpleHover"
                                        >
                                            + Add PLO Mapping
                                        </button>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-between items-center pt-4">
                                        <button
                                            onClick={() => handleDeletePEO(idx)}
                                            className="text-sm text-red-600 border border-red-300 hover:bg-red-100 dark:hover:bg-opacity-10 px-4 py-2 rounded flex items-center gap-2"
                                        >
                                            <FiTrash2 />
                                            Delete PEO
                                        </button>
                                        <button
                                            onClick={() => handleSave(idx)}
                                            disabled={savingIndex === idx}
                                            className={`text-sm px-4 py-2 rounded font-medium ${savingIndex === idx
                                                ? "bg-gray-400 text-white cursor-not-allowed"
                                                : "bg-primary text-white hover:bg-white hover:text-primary border border-gray-200 dark:bg-darkBlurple dark:text-white dark:hover:bg-darkBlurpleHover dark:hover:text-white dark:border-darkBorderLight"
                                                }`}
                                        >
                                            {savingIndex === idx ? "Saving..." : "Save PEO"}
                                        </button>
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

export default EditPEOList;

