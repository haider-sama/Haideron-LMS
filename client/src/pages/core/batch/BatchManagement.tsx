import React, { useEffect, useState } from "react";
import { FiCheckCircle, FiEdit, FiXCircle } from "react-icons/fi";
import { usePermissions } from "../../../hooks/usePermissions";
import { useDashboards } from "../../../hooks/auth/useDashboards";
import { getBatchById, getBatchesByProgram, updateBatchById } from "../../../api/core/batch/batch-api";
import { getPrograms } from "../../../api/core/program-api";
import { Helmet } from "react-helmet-async";
import Breadcrumbs, { generateBreadcrumbs } from "../../../components/ui/Breadcrumbs";
import PageHeading from "../../../components/ui/PageHeading";
import TopCenterLoader from "../../../components/ui/TopCenterLoader";
import { Pagination } from "../../../components/ui/Pagination";
import Modal from "../../../components/ui/Modal";
import CreateBatchForm from "../../../components/pages/core/batch/CreateBatchForm";
import { GLOBAL_TITLE, MAX_PAGE_LIMIT } from "../../../constants";
import { useQuery } from "@tanstack/react-query";
import { useUserManagement } from "../../../hooks/admin/useUserManagement";
import { AudienceEnum } from "../../../../../server/src/shared/enums";
import { Button } from "../../../components/ui/Button";
import AsyncSelect from "react-select/async";
import BatchProfile from "../../../components/pages/core/batch/BatchProfile";

const BatchManagement: React.FC = () => {
    const { user, isLoggedIn, isDepartmentHead, isAdmin } = usePermissions();
    const { head: departmentHeadDashboard } = useDashboards(user?.role, isLoggedIn);
    const deptProgram = departmentHeadDashboard.data?.program;

    const { page, setPage, debouncedSearch } =
        useUserManagement(user?.role as AudienceEnum);

    const [selectedProgramId, setSelectedProgramId] = useState<string>("");
    const [showModal, setShowModal] = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
    const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);

    const handleEditBatch = (batchId: string) => {
        setSelectedBatchId(batchId);
        setShowModal(true);
    };

    const closeModal = () => {
        setSelectedBatchId(null);
        setShowModal(false);
    };

    // Load programs
    const { data: programData, isLoading: isProgramsLoading } = useQuery({
        queryKey: ["programs"],
        queryFn: () => getPrograms({ page: 1, limit: MAX_PAGE_LIMIT, search: debouncedSearch }),
    });

    useEffect(() => {
        const programs = programData?.programs ?? [];

        if (isDepartmentHead) {
            setSelectedProgramId(deptProgram?.id || "");
        } else if (programs.length === 1) {
            setSelectedProgramId(programs[0].id);
        }
    }, [user, deptProgram, programData]);

    // Load batches for selected program
    const { data: batchData, isLoading: isBatchLoading } = useQuery({
        queryKey: ["batches", { programId: selectedProgramId, page }],
        queryFn: () => getBatchesByProgram(selectedProgramId, page, MAX_PAGE_LIMIT),
        enabled: !!selectedProgramId,
    });

    const programs = programData?.programs ?? [];
    const batches = batchData?.batches ?? [];
    const totalPages = batchData?.totalPages ?? 1;
    const isLoading = isProgramsLoading || isBatchLoading;
    const defaultOptions = programs.map((p) => ({ label: p.title, value: p.id }));

    return (
        <div className="p-8 max-w-6xl mx-auto overflow-x-auto">
            <Helmet>
                <title>{GLOBAL_TITLE} - Session Management - Batch Management</title>
            </Helmet>
            <Breadcrumbs items={generateBreadcrumbs('/batches')} />

            <div className="mt-2 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                {/* Left: Heading */}
                <PageHeading title="Batch Management" />

                {/* Right: Search + Button grouped together */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:ml-auto">
                    {(isAdmin || isDepartmentHead) && (
                        <Button
                            onClick={() => setShowCreateBatchModal(true)}
                            fullWidth={false}
                            variant="green"
                            size="md"
                        >
                            Add Batch
                        </Button>
                    )}
                </div>
            </div>

            {isAdmin && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Program</label>
                    <AsyncSelect
                        cacheOptions
                        defaultOptions={defaultOptions}
                        loadOptions={async (inputValue: string) => {
                            try {
                                const res = await getPrograms({
                                    page: 1,
                                    limit: MAX_PAGE_LIMIT,
                                    search: inputValue, // <-- pass search term to API
                                });
                                return res.programs.map((p) => ({ label: p.title, value: p.id }));
                            } catch (err) {
                                console.error("Failed to fetch programs:", err);
                                return [];
                            }
                        }}
                        onChange={(option: any) => {
                            setSelectedProgramId(option?.value || "");
                            setPage(1);
                        }}
                        value={
                            selectedProgramId
                                ? { label: programs.find((p) => p.id === selectedProgramId)?.title, value: selectedProgramId }
                                : null
                        }
                        placeholder="Search program..."
                        isClearable
                    />
                </div>
            )}

            {isLoading ? (
                <div className="overflow-x-auto border border-gray-200 dark:border-darkBorderLight rounded-lg shadow-sm bg-white dark:bg-darkSurface">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-darkMuted text-gray-700 dark:text-darkTextMuted uppercase text-xs tracking-wide border-b dark:border-darkBorderLight">
                            <tr>
                                <th className="px-4 py-2">Program</th>
                                <th className="px-4 py-2">Session Year</th>
                                <th className="px-4 py-2">Created By</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={5} className="text-center py-6 text-gray-500 dark:text-darkTextSecondary">
                                    <TopCenterLoader />
                                    <p className="mt-2">Loading batches...</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="overflow-x-auto border border-gray-300 dark:border-darkBorderLight rounded-sm shadow-sm bg-white dark:bg-darkSurface">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-100 border-b border-gray-300 dark:bg-darkMuted text-gray-700 dark:text-darkTextMuted uppercase text-xs tracking-wide dark:border-darkBorderLight">
                            <tr>
                                <th className="px-4 py-2">Program</th>
                                <th className="px-4 py-2">Session Year</th>
                                <th className="px-4 py-2">Created By</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.length > 0 ? (
                                batches.map((batch) => (
                                    <tr
                                        key={batch.id}
                                        className="border-b last:border-0 dark:border-darkBorderLight hover:bg-gray-50 dark:hover:bg-darkMuted transition"
                                    >
                                        {/* Program Title */}
                                        <td className="px-4 py-2 text-gray-800 dark:text-darkTextPrimary font-medium whitespace-nowrap">
                                            {batch.programTitle || "N/A"}
                                        </td>

                                        {/* Session Year */}
                                        <td className="px-4 py-2 text-gray-600 dark:text-darkTextSecondary whitespace-nowrap">
                                            <span className="inline-block bg-blue-100 dark:bg-darkBlurple/10 text-blue-700 dark:text-darkBlurple text-xs font-medium px-2 py-1 rounded-full">
                                                {batch.sessionYear}
                                            </span>
                                        </td>

                                        {/* Created By */}
                                        <td className="px-4 py-2 text-gray-700 dark:text-darkTextSecondary whitespace-nowrap">
                                            {batch.createdByFirstName} {batch.createdByLastName}
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-2">
                                            {batch.isActive ? (
                                                <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium text-xs bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 px-2 py-1 rounded-full">
                                                    <FiCheckCircle className="w-4 h-4" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium text-xs bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-2 py-1 rounded-full">
                                                    <FiXCircle className="w-4 h-4" />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-2 text-center">
                                            <button
                                                onClick={() => handleEditBatch(batch.id)}
                                                className="inline-flex items-center justify-center p-2 rounded hover:bg-gray-100 dark:hover:bg-darkMuted transition"
                                                title="Edit batch"
                                            >
                                                <FiEdit className="w-4 h-4 text-green-500 dark:text-darkGreen" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="text-center px-4 py-6 text-gray-500 dark:text-darkTextMuted"
                                    >
                                        No batches found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            )}

            <div className="flex justify-end">
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>

            {showModal && selectedBatchId && (
                <Modal isOpen={showModal} onClose={closeModal}>
                    <BatchProfile
                        batchId={selectedBatchId}
                        fetchBatch={getBatchById}
                        updateBatch={updateBatchById}
                        programs={
                            isAdmin
                                ? selectedProgramId
                                    ? programs.filter((p) => p.id === selectedProgramId)
                                    : []
                                : isDepartmentHead && deptProgram
                                    ? [deptProgram]
                                    : []
                        }
                    />
                </Modal>
            )}

            {showCreateBatchModal && (
                <Modal
                    isOpen={showCreateBatchModal}
                    onClose={() => setShowCreateBatchModal(false)}
                >
                    <CreateBatchForm
                        onClose={() => setShowCreateBatchModal(false)}
                        programs={
                            isDepartmentHead
                                ? deptProgram
                                    ? [{ id: deptProgram.id, title: deptProgram.title }]
                                    : []
                                : programs.map((p) => ({ id: p.id, title: p.title }))
                        }
                    />
                </Modal>
            )}

        </div>
    );
};

export default BatchManagement;
