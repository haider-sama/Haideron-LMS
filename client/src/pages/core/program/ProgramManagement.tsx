import React, { useState } from "react";
import { usePermissions } from "../../../hooks/usePermissions";
import { useDashboards } from "../../../hooks/auth/useDashboards";
import { Program, ProgramWithCreator } from "../../../../../server/src/shared/interfaces";
import { Helmet } from "react-helmet-async";
import { GLOBAL_TITLE, MAX_PAGE_LIMIT } from "../../../constants";
import Breadcrumbs, { generateBreadcrumbs } from "../../../components/ui/Breadcrumbs";
import PageHeading from "../../../components/ui/PageHeading";
import TopCenterLoader from "../../../components/ui/TopCenterLoader";
import { FiEdit, FiTarget } from "react-icons/fi";
import Modal from "../../../components/ui/Modal";
import ProgramProfile from "../../../components/pages/core/program/ProgramProfile";
import { getProgramById, getPrograms, updateProgramById } from "../../../api/core/program/program-api";
import RegisterProgramForm from "../../../components/pages/core/program/RegisterProgramForm";
import { Pagination } from "../../../components/ui/Pagination";
import { useQuery } from "@tanstack/react-query";
import { truncateName } from "../../../utils/truncate-name";
import SearchBar from "../../../components/ui/SearchBar";
import { useUserManagement } from "../../../hooks/admin/useUserManagement";
import { AudienceEnum } from "../../../../../server/src/shared/enums";
import OutcomeManagement from "../../../components/pages/core/program/OutcomeManagement";


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

    // Client-side filtering
    const filteredPrograms = programs.filter((program) => {
        const q = debouncedSearch.trim().toLowerCase();
        return (
            program.title?.toLowerCase().includes(q) ||
            program.vision?.toLowerCase().includes(q) ||
            program.mission?.toLowerCase().includes(q) ||
            program.maxDurationYears.toString().includes(q) ||
            program.requirements?.toLowerCase().includes(q) ||
            program.programLevel?.toLowerCase().includes(q) ||
            program.departmentTitle?.toLowerCase().includes(q) ||
            `${program.createdByFirstName} ${program.createdByLastName}`.toLowerCase().includes(q)
        );
    });

    return (
        <div className="p-8 max-w-6xl mx-auto bg-white dark:bg-darkSurface">
            <Helmet>
                <title>{GLOBAL_TITLE} - Program Management</title>
            </Helmet>

            <Breadcrumbs items={generateBreadcrumbs('/faculty/programs')} />

            <div className="mt-2 mb-6">
                {/* Top row: Heading left, Search right */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex justify-start">
                        <PageHeading title="Program Management" />
                    </div>

                    {/* On mobile: full width and aligned left; on md+: auto width and aligned right */}
                    <div className="w-full md:w-auto flex md:justify-end justify-start gap-2">
                        <SearchBar
                            value={search}
                            onSearch={setSearch}
                            showAdvanced={false}
                        />
                        {(isAdmin || isDepartmentHead) && (
                            <button
                                onClick={() => setShowRegisterModal(true)}
                                className="relative w-32 rounded-md border border-gray-200 bg-green-500 text-white text-sm py-1 px-4
                                hover:bg-white hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-200 transition cursor-pointer"
                                type="button"
                            >
                                Add Program
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto border border-gray-300 rounded-sm shadow-sm bg-white dark:bg-darkSurface dark:border-darkBorderLight">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-100 border-b border-gray-300 text-gray-600 uppercase text-xs tracking-wide dark:bg-darkMuted dark:text-darkTextMuted">
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
                                </td>
                            </tr>
                        ) : filteredPrograms.length > 0 ? (
                            filteredPrograms.map((program) => (
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
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {truncateName(`${program.createdByFirstName} ${program.createdByLastName} ` || "-", 20)}
                                            </span>
                                            <span className="text-sm text-gray-400 dark:text-darkTextSecondary/70">
                                                {program.createdByEmail || "-"}
                                            </span>
                                        </div>
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
                                            <FiTarget className="w-4 h-4 text-purple-500 dark:text-darkBlurple" />
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
                    <OutcomeManagement programId={selectedProgramId} fetchProgram={getProgramById} />
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
