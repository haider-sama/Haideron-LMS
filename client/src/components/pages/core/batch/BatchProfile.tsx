import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useToast } from "../../../../context/ToastContext";
import { ProgramBatch } from "../../../../constants/core/interfaces";
import { Program } from "../../../../../../server/src/shared/interfaces";
import TopCenterLoader from "../../../ui/TopCenterLoader";
import InternalError from "../../../../pages/forbidden/InternalError";
import { ReadOnlyInput, SelectInput } from "../../../ui/Input";
import { Button } from "../../../ui/Button";
import Modal from "../../../ui/Modal";
import ActivateSemesterForm from "./ActivateSemesterForm";
import ActivatedSemesterList from "./ActivatedSemesterList";

interface BatchProfileProps {
    batchId: string;
    fetchBatch: (batchId: string) => Promise<{ batch: ProgramBatch }>;
    updateBatch: (
        batchId: string,
        updates: Partial<Pick<ProgramBatch, "sessionYear" | "isActive">>
    ) => Promise<{ message: string; updatedBatch: ProgramBatch }>;
    programs: Program[];
}

const SESSION_YEARS = Array.from({ length: 6 }, (_, i) => {
    const year = new Date().getFullYear();
    return (year + i).toString();
});

const BatchProfile: React.FC<BatchProfileProps> = ({
    batchId,
    fetchBatch,
    updateBatch,
    programs,
}) => {
    const queryClient = useQueryClient();
    const toast = useToast();

    const [batch, setBatch] = useState<ProgramBatch | null>(null);
    const [editYear, setEditYear] = useState("");
    const [selectedProgramId, setSelectedProgramId] = useState("");
    const [isActive, setIsActive] = useState(false);
    const [showActivateSemester, setShowActivateSemester] = useState(false);

    // Load batch data
    const { data, isLoading, isError } = useQuery({
        queryKey: ["batch", batchId],
        queryFn: () => fetchBatch(batchId),
        enabled: !!batchId,
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    useEffect(() => {
        if (data) {
            const batchData = data.batch;
            setBatch(batchData);
            setEditYear(batchData.sessionYear?.toString() || "");
            setSelectedProgramId(batchData.programId); // use programId
            setIsActive(batchData.isActive ?? false);
        }
    }, [data]);

    // Mutation to update batch
    const updateMutation = useMutation({
        mutationFn: (data: { sessionYear: number; isActive: boolean }) =>
            updateBatch(batchId, data),
        onSuccess: () => {
            toast.success("Batch updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["batch", batchId] });
        },
        onError: (err: any) => {
            if (err.fieldErrors) {
                const fieldErrors = err.fieldErrors as Record<string, string[]>;
                Object.values(fieldErrors).forEach((messages) =>
                    messages.forEach((msg) => toast.error(msg))
                );
            } else {
                toast.error(err.message || "Failed to update batch.");
            }
        },
    });

    const handleSave = () => {
        const parsedYear = parseInt(editYear, 10);
        if (isNaN(parsedYear)) return toast.error("Invalid year.");
        updateMutation.mutate({ sessionYear: parsedYear, isActive });
    };

    if (isLoading || !batch) return <TopCenterLoader />;
    if (isError) return <InternalError />;

    return (
        <div className="max-w-2xl mx-auto">

            <div className="max-w-sm mx-auto space-y-6">
                <h2 className="text-2xl font-semibold text-center">Edit Program Batch</h2>

                <div className="space-y-6">
                    <div>
                        <SelectInput
                            label="Program"
                            name="program"
                            value={selectedProgramId}
                            onChange={(e) => setSelectedProgramId(e.target.value)}
                            disabled
                            options={programs.map((p) => ({
                                label: p.title,
                                value: p.id,
                            }))}
                        />
                    </div>

                    <ReadOnlyInput
                        label="Department"
                        value={batch?.programDepartment || "Not available"}
                    />

                    <div>
                        <SelectInput
                            label="Session Year"
                            name="sessionYear"
                            value={editYear}
                            onChange={(e) => setEditYear(e.target.value)}
                            options={SESSION_YEARS.map((y) => ({ label: y, value: y }))}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="h-4 w-4"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium">
                            Is Active
                        </label>
                    </div>

                    <div className="flex justify-center gap-4 pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                            loadingText="Saving..."
                            isLoading={updateMutation.isPending}
                            fullWidth={false}
                            variant="gray"
                        >
                            Save Changes
                        </Button>
                        <Button onClick={() => setShowActivateSemester(true)} fullWidth={false}>
                            Activate Semester
                        </Button>
                    </div>
                </div>
            </div>

            <ActivatedSemesterList batchId={batchId} />


            {showActivateSemester && (
                <Modal isOpen={showActivateSemester} onClose={() => setShowActivateSemester(false)}>
                    <ActivateSemesterForm batchId={batchId} onClose={() => setShowActivateSemester(false)} />
                </Modal>
            )}

        </div>
    );
};

export default BatchProfile;
