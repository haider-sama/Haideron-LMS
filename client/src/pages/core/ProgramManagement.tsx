import React, { useState } from "react";
import { usePermissions } from "../../hooks/usePermissions";
import { useDashboards } from "../../hooks/auth/useDashboards";
import { Program } from "../../../../server/src/shared/interfaces";
import { Helmet } from "react-helmet-async";
import { GLOBAL_TITLE, MAX_PAGE_LIMIT } from "../../constants";
import Breadcrumbs, { generateBreadcrumbs } from "../../components/ui/Breadcrumbs";
import PageHeading from "../../components/ui/PageHeading";
import TopCenterLoader from "../../components/ui/TopCenterLoader";
import { FiEdit, FiTarget } from "react-icons/fi";
import Modal from "../../components/ui/Modal";
import ProgramProfile from "../../components/pages/core/program/ProgramProfile";
import { getProgramById, getPrograms, updateProgramById } from "../../api/core/program-api";
import RegisterProgramForm from "../../components/pages/core/program/RegisterProgramForm";
import { Pagination } from "../../components/ui/Pagination";
import { useQuery } from "@tanstack/react-query";
import { truncateName } from "../../utils/truncate-name";
import { useUserManagement } from "../../hooks/admin/useUserManagement";
import { AudienceEnum } from "../../../../server/src/shared/enums";
import OutcomeManagement from "../../components/pages/core/program/OutcomeManagement";
import { ProgramWithCreator } from "../../constants/core/interfaces";
import { Button } from "../../components/ui/Button";


const ProgramManagement: React.FC = () => {
    const { user, isLoggedIn, isAdmin, isDepartmentHead } = usePermissions();

    const { head: departmentHeadDashboard } = useDashboards(user?.role, isLoggedIn);
    const deptHeadProgram = departmentHeadDashboard.data?.program;

    const { page, setPage, search, setSearch, debouncedSearch } =
        useUserManagement(user?.role as AudienceEnum);

    const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showOutcomeModal, setShowOutcomeModal] = useState(false);

    const handleEditProgram = (programId: string) => {
        setSelectedProgramId(programId);
        setShowModal(true);
    };

    const handleManageOutcomes = (programId: string) => {
        setSelectedProgramId(programId);
        setShowOutcomeModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedProgramId(null);
    };

    const { data, isLoading } = useQuery({
        queryKey: ['programs', page, debouncedSearch],
        queryFn: () => getPrograms({ page, limit: MAX_PAGE_LIMIT, search: debouncedSearch }),
        enabled: isAdmin || isDepartmentHead,
        placeholderData: (prev) => prev,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const programs: ProgramWithCreator[] = data?.programs ?? (deptHeadProgram ? [deptHeadProgram] : []);
    const totalPages = isAdmin && data && 'totalPages' in data ? data.totalPages : 1;
    const loading = isAdmin || isDepartmentHead ? isLoading : false;

    return (
        <div className="p-8 max-w-6xl mx-auto bg-white dark:bg-darkSurface">
            <Helmet>
                <title>{GLOBAL_TITLE} - Program Management</title>
            </Helmet>

            <Breadcrumbs items={generateBreadcrumbs('/faculty/programs')} />

            <div className="mt-2 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                {/* Left: Heading */}
                <PageHeading title="Program Management" />

                {/* Right: Search + Button grouped together */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:ml-auto">
                    <input
                        type="text"
                        placeholder="Search programs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border border-gray-300 rounded px-4 py-2 w-full sm:w-auto md:max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm
                        dark:bg-darkSurface dark:border-darkBorderLight dark:text-darkTextPrimary dark:placeholder-darkTextMuted"
                    />
                    {(isAdmin || isDepartmentHead) && (
                        <Button
                            onClick={() => setShowRegisterModal(true)}
                            fullWidth={false}
                            variant="green"
                            size="md"
                        >
                            Add Program
                        </Button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto border border-gray-300 rounded-sm shadow-sm bg-white dark:bg-darkSurface dark:border-darkBorderLight">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-100 border-b border-gray-300 dark:border-darkBorderLight text-gray-600 uppercase text-xs tracking-wide dark:bg-darkMuted dark:text-darkTextMuted">
                        <tr>
                            <th className="px-4 py-2">Title</th>
                            <th className="px-4 py-2">Level</th>
                            <th className="px-4 py-2">Department</th>
                            <th className="px-4 py-2">Duration</th>
                            <th className="px-4 py-2">Created By</th>
                            <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center px-4 py-6">
                                    <TopCenterLoader />
                                    Loading programs...
                                </td>
                            </tr>
                        ) : programs.length > 0 ? (
                            programs.map((program) => (
                                <tr
                                    key={program.id}
                                    className="border-b last:border-0 hover:bg-gray-50 transition dark:border-darkBorderLight dark:hover:bg-darkMuted"
                                >
                                    <td className="px-4 py-2 font-medium text-gray-800 dark:text-darkTextPrimary">
                                        {program.title || "-"}
                                    </td>
                                    <td className="px-4 py-2 text-gray-600 dark:text-darkTextSecondary">
                                        {program.programLevel || "-"}
                                    </td>
                                    <td className="px-4 py-2 text-gray-600 dark:text-darkTextSecondary">
                                        {program.departmentTitle || "-"}
                                    </td>
                                    <td className="px-4 py-2 text-gray-600 dark:text-darkTextSecondary">
                                        {program.maxDurationYears || "-"} yrs
                                    </td>
                                    <td className="px-4 py-2 text-gray-600 dark:text-darkTextSecondary">
                                        <span className="font-medium">
                                            {truncateName(`${program.createdByFirstName} ${program.createdByLastName} ` || "-", 20)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-center space-x-2">
                                        <button
                                            onClick={() => handleEditProgram(program.id)}
                                            className="inline-flex items-center justify-center p-2 rounded hover:bg-gray-100 transition dark:hover:bg-darkMuted"
                                            title="Edit program"
                                        >
                                            <FiEdit className="w-4 h-4 text-blue-500 dark:text-darkBlurple" />
                                        </button>
                                        <button
                                            onClick={() => handleManageOutcomes(program.id)}
                                            className="inline-flex items-center justify-center p-2 rounded hover:bg-gray-100 transition dark:hover:bg-darkMuted"
                                            title="Manage outcomes"
                                        >
                                            <FiTarget className="w-4 h-4 text-purple-500 dark:text-blue-600" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="text-center px-4 py-6 text-gray-600 dark:text-darkTextMuted"
                                >
                                    No programs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>


            {showModal && selectedProgramId && (
                <Modal isOpen={showModal} onClose={closeModal}>
                    <ProgramProfile
                        programId={selectedProgramId}
                        fetchProgram={getProgramById}
                        updateProgram={updateProgramById as (id: string, data: Partial<Program>) => Promise<any>}
                    />
                </Modal>
            )}

            {showOutcomeModal && selectedProgramId && (
                <Modal isOpen={showOutcomeModal} onClose={() => setShowOutcomeModal(false)}>
                    <OutcomeManagement programId={selectedProgramId} />
                </Modal>
            )}

            {showRegisterModal && (
                <Modal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)}>
                    <RegisterProgramForm onSuccess={() => setShowRegisterModal(false)} />
                </Modal>
            )}


            <div className="flex justify-end">
                {isAdmin && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                )}
            </div>
        </div>
    );
};

export default ProgramManagement;
