import { useEffect, useState } from "react";
import { Program, ProgramCatalogue } from "../../../../../../server/src/shared/interfaces";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "../../../../hooks/usePermissions";
import { useDashboards } from "../../../../hooks/auth/useDashboards";
import { useToast } from "../../../../context/ToastContext";
import { AudienceEnum } from "../../../../../../server/src/shared/enums";
import { deleteCatalogueById } from "../../../../api/core/catalogue-api";
import TopCenterLoader from "../../../ui/TopCenterLoader";
import InternalError from "../../../../pages/forbidden/InternalError";
import { ReadOnlyInput, SelectInput } from "../../../ui/Input";
import Modal from "../../../ui/Modal";
import { Button } from "../../../ui/Button";
import AddSemesterForm from "./AddSemesterForm";
import SemesterCourseTable from "./SemesterCourseTable";

interface CatalogueProfileProps {
    catalogueId: string;
    fetchCatalogue: (id: string) => Promise<ProgramCatalogue>;
    updateProgram: (id: string, data: Partial<ProgramCatalogue>) => Promise<any>;
    programs: Program[];
    onSuccess?: () => void;
}

const CATALOGUE_YEARS = Array.from({ length: 6 }, (_, i) => {
    const year = new Date().getFullYear();
    return (year + i).toString();
});

const CatalogueProfile: React.FC<CatalogueProfileProps> = ({
    catalogueId,
    fetchCatalogue,
    updateProgram,
    programs,
    onSuccess,
}) => {
    const queryClient = useQueryClient();
    const { user, isLoggedIn, isAdmin } = usePermissions();
    const { head: departmentHeadDashboard } = useDashboards(user?.role, isLoggedIn);

    const departmentHeadProgram = departmentHeadDashboard.data?.program;

    const [editYear, setEditYear] = useState("");
    const [selectedProgramId, setSelectedProgramId] = useState(
        isAdmin ? "" : departmentHeadProgram?.id ?? ""
    );

    const toast = useToast();
    const [showSemesterModal, setShowSemesterModal] = useState(false);

    const openSemesterModal = () => setShowSemesterModal(true);
    const closeSemesterModal = () => setShowSemesterModal(false);

    // Fetch the catalogue
    const { data: catalogue, isLoading: catalogueLoading, isError: catalogueError } = useQuery({
        queryKey: ["catalogue", catalogueId],
        queryFn: () => fetchCatalogue(catalogueId!), // assume catalogueId is valid
        enabled: !!catalogueId,
        retry: false, // prevent auto retries that would spam toasts
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    // Show toast only after render, not inside queryFn
    useEffect(() => {
        if (catalogueError) {
            toast.error("Failed to fetch catalogue");
        }
    }, [catalogueError, toast]);

    // Update local state when data arrives
    useEffect(() => {
        if (catalogue) {
            setEditYear(catalogue.catalogueYear?.toString() || "");
            const programId = (catalogue.program as any)?.id || (catalogue.program as any)?._id || "";
            setSelectedProgramId(programId);
        }
    }, [catalogue]);

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (updatedData: Partial<Pick<ProgramCatalogue, "program" | "catalogueYear">>) =>
            updateProgram(catalogueId, updatedData),
        onSuccess: () => {
            toast.success("Catalogue updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["catalogues"], exact: false }); // refresh all catalogue lists
            queryClient.invalidateQueries({ queryKey: ["catalogue", catalogueId] }); // refresh the single catalogue
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to update catalogue.");
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: () => deleteCatalogueById(catalogueId),
        onSuccess: () => {
            toast.success("Catalogue deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["catalogues"], exact: false });
            queryClient.removeQueries({ queryKey: ["catalogue", catalogueId] });
            onSuccess?.();
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to delete catalogue.");
        },
    });

    // Save handler
    const handleSave = () => {
        const parsedYear = parseInt(editYear, 10);
        if (isNaN(parsedYear)) return toast.error("Invalid year.");
        if (!selectedProgramId) return toast.error("Program must be selected.");

        let selectedProgram = programs.find((p) => p.id === selectedProgramId);

        // If no match and user is DepartmentHead, use the known program
        if (!selectedProgram && user?.role === "DepartmentHead" && departmentHeadProgram) {
            selectedProgram = departmentHeadProgram;
        }

        if (!selectedProgram) {
            return toast.error("Selected program not found.");
        }

        updateMutation.mutate({
            catalogueYear: parsedYear,
            program: selectedProgramId as unknown as ProgramCatalogue["program"],
        });
    };

    // Delete handler
    const handleDelete = () => {
        if (!window.confirm("Are you sure you want to delete this catalogue?")) return;
        if (!window.confirm("This action is irreversible. Proceed?")) return;
        deleteMutation.mutate();
    };

    if (catalogueLoading) return <TopCenterLoader />;
    if (catalogueError) return <InternalError />;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <h2 className="text-2xl font-semibold text-center">Edit Program Catalogue</h2>

            <div className="max-w-md mx-auto space-y-6">
                {user?.role === AudienceEnum.Admin && (
                    <SelectInput
                        label="Program"
                        name="program"
                        value={selectedProgramId}
                        onChange={(e) => setSelectedProgramId(e.target.value)}
                        options={programs.map((p) => ({ label: p.title, value: p.id }))}
                    />
                )}

                <ReadOnlyInput
                    label="Program Title"
                    value={
                        (user?.role === "Admin"
                            ? programs.find((p) => p.id === selectedProgramId)?.title
                            : departmentHeadProgram?.title) || "Not available"
                    }
                />

                <ReadOnlyInput
                    label="Department"
                    value={
                        (user?.role === "Admin"
                            ? programs.find((p) => p.id === selectedProgramId)?.departmentTitle
                            : departmentHeadProgram?.departmentTitle) || "Not available"
                    }
                />

                <div>
                    <SelectInput
                        label="Catalogue Year"
                        name="catalogueYear"
                        value={editYear}
                        onChange={(e) => setEditYear(e.target.value)}
                        options={CATALOGUE_YEARS.map((y) => ({ label: y, value: y }))}
                    />
                </div>

                {/* Buttons */}
                <div className="flex justify-center gap-4 pt-4">
                    <Button isLoading={updateMutation.isPending} loadingText="Saving..."
                        disabled={updateMutation.isPending} onClick={handleSave} variant="gray"
                        fullWidth={false} >
                        Save Changes
                    </Button>
                    <Button isLoading={deleteMutation.isPending} loadingText="Deleting..."
                        disabled={deleteMutation.isPending} onClick={handleDelete} variant="red"
                        fullWidth={false} >
                        Delete
                    </Button>
                </div>
            </div>

            <div className="w-full max-w-5xl py-4">
                <SemesterCourseTable catalogueId={catalogueId} />
            </div>

            <div className="flex justify-center gap-4 pt-8">
                <Button
                    onClick={openSemesterModal}
                    fullWidth={false}
                >
                    Add Semesters
                </Button>
            </div>


            {showSemesterModal && (
                <Modal isOpen={showSemesterModal} onClose={closeSemesterModal}>
                    <AddSemesterForm
                        catalogueId={catalogueId}
                        onSuccess={closeSemesterModal}
                    />
                </Modal>
            )}

        </div >
    );
};

export default CatalogueProfile;