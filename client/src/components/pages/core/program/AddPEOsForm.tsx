import React, { useEffect, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { StrengthEnum } from "../../../../../../server/src/shared/enums";
import { useToast } from "../../../../shared/context/ToastContext";
import { addPEOsToProgram, getPLOsForProgram } from "../../../../api/core/program-api";
import { SelectInput, TextAreaInput } from "../../../ui/Input";
import { PEOFrontend, PEOUpdatePayload, PLOFrontend } from "../../../../shared/constants/core/interfaces";
import { Button } from "../../../ui/Button";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const strengthOptions = Object.values(StrengthEnum);
const peoCodeOptions = Array.from({ length: 10 }, (_, i) => `PEO${i + 1}`);

const AddPEOsForm = ({ programId }: { programId: string | null }) => {
    const [peos, setPeos] = useState<PEOFrontend[]>([]);
    const [availablePLOs, setAvailablePLOs] = useState<PLOFrontend[]>([]);
    const toast = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (programId) {
            getPLOsForProgram(programId)
                .then((res) => setAvailablePLOs(res.plos || []))
                .catch((err) => toast.error(err.message || "Failed to load PLOs"));
        }
    }, [programId]);

    const handlePEOChange = (
        index: number,
        field: "title" | "description",
        value: string
    ) => {
        const updated = [...peos];
        updated[index][field] = value;
        setPeos(updated);
    };

    const handleAddMapping = (peoIndex: number) => {
        const updated = [...peos];
        updated[peoIndex].ploMapping.push({
            plo: { id: "", code: "", title: "", description: "" },
            strength: StrengthEnum.Medium,
        });
        setPeos(updated);
    };

    const handleRemoveMapping = (peoIndex: number, mapIndex: number) => {
        setPeos((prev) =>
            prev.map((peo, idx) =>
                idx === peoIndex
                    ? { ...peo, ploMapping: peo.ploMapping.filter((_, i) => i !== mapIndex) }
                    : peo
            )
        );
    };

    const handleMappingChange = (
        peoIndex: number,
        mapIndex: number,
        field: "plo" | "strength",
        value: string
    ) => {
        const updated = [...peos];
        if (field === "strength") {
            updated[peoIndex].ploMapping[mapIndex].strength = value as StrengthEnum;
        } else {
            const selectedPLO = availablePLOs.find((p) => p.id === value);
            if (selectedPLO) updated[peoIndex].ploMapping[mapIndex].plo = selectedPLO;
        }
        setPeos(updated);
    };

    const addPEOField = () =>
        setPeos([...peos, { title: "", description: "", ploMapping: [] }]);

    const handleRemovePEO = (index: number) =>
        setPeos((prev) => prev.filter((_, i) => i !== index));

    const mutation = useMutation({
        mutationFn: async (payload: PEOUpdatePayload[]) => {
            if (!programId) throw new Error("Program ID not found.");
            return addPEOsToProgram(programId, payload);
        },
        onSuccess: () => {
            toast.success("PEOs added successfully.");
            setPeos([]);
            queryClient.invalidateQueries({ queryKey: ["peos", programId] });
            queryClient.invalidateQueries({ queryKey: ["plos", programId] });
        },
        onError: (err: any) => {
            if (err?.zodErrors) {
                const zodErrors = err.zodErrors as Record<string, string[]>;
                Object.values(zodErrors).forEach((messages) =>
                    messages.forEach((msg) => toast.error(msg))
                );
            } else {
                toast.error(err.message || "Failed to add PEOs");
            }
        },
    });

    // Submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!programId) return toast.error("Program ID not found.");

        const sanitizedPeos: PEOUpdatePayload[] = peos.map(({ title, description, ploMapping }) => ({
            title,
            description,
            ploMapping: ploMapping.map(({ plo, strength }) => ({ plo: plo.id, strength })),
        }));

        await mutation.mutateAsync(sanitizedPeos);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 p-6 mx-auto">
            <h2 className="text-xl font-bold">Add PEOs</h2>

            {peos.map((peo, idx) => (
                <div key={idx} className="border p-4 rounded space-y-4 border-gray-200 dark:border-darkBorderLight">
                    {/* Code + Description row */}
                    <div className="flex flex-col gap-4">
                        <div className="w-full">
                            <SelectInput
                                label="Title"
                                name="title"
                                value={peo.title}
                                onChange={(e) => handlePEOChange(idx, "title", e.target.value)}
                                options={peoCodeOptions}
                            />
                        </div>

                        <div className="w-full">
                            <TextAreaInput
                                label="Description"
                                name="description"
                                placeholder="Description"
                                value={peo.description}
                                onChange={(e) => handlePEOChange(idx, "description", e.target.value)}
                            />
                        </div>
                    </div>


                    {/* PLO Mapping Section */}
                    <div className="space-y-2">
                        <p className="font-semibold">PLO Mapping</p>
                        {peo.ploMapping.map((map, mapIdx) => (
                            <div
                                key={mapIdx}
                                className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end"
                            >

                                <SelectInput
                                    label="PLO"
                                    name={`plo-${idx}-${mapIdx}`}
                                    value={map.plo?.id || ""}
                                    onChange={(e) => handleMappingChange(idx, mapIdx, "plo", e.target.value)}
                                    options={availablePLOs.map((plo) => ({
                                        label: `${plo.code} - ${plo.title}`,
                                        value: plo.id ?? "",
                                    }))}
                                    placeholder="Select PLO"
                                />

                                <SelectInput
                                    label="Strength"
                                    name={`strength-${idx}-${mapIdx}`}
                                    value={map.strength}
                                    onChange={(e) => handleMappingChange(idx, mapIdx, "strength", e.target.value)}
                                    options={strengthOptions}
                                    placeholder="Select strength"
                                />

                                {peo.ploMapping.length && (
                                    <div className="flex items-end justify-end pb-1">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMapping(idx, mapIdx)}
                                            className="text-red-500 hover:text-red-700 text-xl"
                                            title="Remove PLO Mapping"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() => handleAddMapping(idx)}
                            className="text-blue-500 text-sm"
                        >
                            + Add Mapping
                        </button>

                        <div className="pt-2 flex justify-center">
                            <button
                                type="button"
                                onClick={() => handleRemovePEO(idx)}
                                className="flex items-center justify-center gap-2 w-full sm:w-auto text-red-500 hover:text-red-700 text-sm border border-red-300 rounded px-2 py-2"
                            >
                                <FiTrash2 />
                                <span>Delete PEO</span>
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            <button type="button" onClick={addPEOField} className="text-sm text-blue-600">
                + Add PEO
            </button>

            <div className="flex justify-center">
                <Button isLoading={mutation.isPending} loadingText="Submitting..."
                    disabled={mutation.isPending || peos.length === 0} fullWidth={false}>
                    Submit PEOs
                </Button>
            </div>
        </form >

    );
};

export default AddPEOsForm;
