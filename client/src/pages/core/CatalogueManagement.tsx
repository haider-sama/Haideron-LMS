import React, { useEffect, useState } from "react";
import { usePermissions } from "../../hooks/usePermissions";
import { useDashboards } from "../../hooks/auth/useDashboards";
import { useToast } from "../../context/ToastContext";
import { useQuery } from "@tanstack/react-query";
import { getCatalogueById, getCataloguesByProgram, updateCatalogueById } from "../../api/core/catalogue-api";
import { getPrograms } from "../../api/core/program-api";
import { Helmet } from "react-helmet-async";
import { GLOBAL_TITLE, MAX_PAGE_LIMIT } from "../../constants";
import Breadcrumbs, { generateBreadcrumbs } from "../../components/ui/Breadcrumbs";
import PageHeading from "../../components/ui/PageHeading";
import { SelectInput } from "../../components/ui/Input";
import TopCenterLoader from "../../components/ui/TopCenterLoader";
import { FiEdit } from "react-icons/fi";
import { Pagination } from "../../components/ui/Pagination";
import { Program, ProgramCatalogue } from "../../../../server/src/shared/interfaces";
import Modal from "../../components/ui/Modal";
import CreateCatalogueForm from "../../components/pages/core/catalogue/CreateCatalogueForm";
import CatalogueProfile from "../../components/pages/core/catalogue/CatalogueProfile";
import { truncateName } from "../../utils/truncate-name";
import { AudienceEnum } from "../../../../server/src/shared/enums";
import { useUserManagement } from "../../hooks/admin/useUserManagement";
import { Button } from "../../components/ui/Button";


const CatalogueManagement: React.FC = () => {
    const { user, isLoggedIn, isAdmin, isDepartmentHead } = usePermissions();
    const { head: departmentHeadDashboard } = useDashboards(user?.role, isLoggedIn);
    const program = departmentHeadDashboard.data?.program;

    const { page, setPage, search, setSearch, debouncedSearch } =
        useUserManagement(user?.role as AudienceEnum);

    const [selectedCatalogueId, setSelectedCatalogueId] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const toast = useToast();

    // Programs Query
    const { data: programData, error: programsError, isPending: programsLoading } = useQuery({
        queryKey: ["programs"],
        queryFn: () => getPrograms({ page: 1, limit: MAX_PAGE_LIMIT }),
        enabled: isAdmin || isDepartmentHead,
        retry: false,
        staleTime: 5 * 60 * 1000,
    });

    if (programsError) toast.error("Error fetching programs");

    // Programs array (either all programs for admin, or department head program)
    const programs: Program[] = programData?.programs?.length
        ? programData.programs
        : program
            ? [program]
            : [];

    // Selected program ID (first program by default)
    const [selectedProgramId, setSelectedProgramId] = useState<string>(
        programs.length ? programs[0].id : ""
    );

    // Update whenever programs change (optional)
    useEffect(() => {
        if (programs.length && !selectedProgramId) {
            setSelectedProgramId(programs[0].id);
        }
    }, [programs]);

    // Catalogues Query (always runs when selectedProgramId exists)
    const { data: catalogueData, error: cataloguesError, isPending: cataloguesLoading } = useQuery({
        queryKey: ["catalogues", selectedProgramId, page, debouncedSearch],
        queryFn: () =>
            getCataloguesByProgram({
                programId: selectedProgramId,
                page,
                limit: MAX_PAGE_LIMIT,
                search: debouncedSearch,
            }),
        enabled: !!selectedProgramId,
        placeholderData: (prev) => prev,
    });

    if (cataloguesError) toast.error("Error fetching catalogues");

    const catalogues = catalogueData?.data || [];
    const totalPages = catalogueData?.totalPages || 1;
    const loading = programsLoading || cataloguesLoading;

    const handleViewCatalogue = (catalogueId: string) => {
        setSelectedCatalogueId(catalogueId);
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

    return (
        <div className="p-8 max-w-6xl mx-auto overflow-x-auto">
            <Helmet>
                <title>{GLOBAL_TITLE} - Catalogue Management</title>
            </Helmet>
            <Breadcrumbs items={generateBreadcrumbs('/faculty/catalogues')} />

            <div className="mt-2 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                {/* Left: Heading */}
                <PageHeading title="Catalogue Management" />

                {/* Right: Search + Button grouped together */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:ml-auto">
                    <input
                        type="text"
                        placeholder="Search catalogues..."
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
                            Add Catalogue
                        </Button>
                    )}
                </div>
            </div>

            {isAdmin && (
                <div className="mb-8">
                    <SelectInput
                        label="Select Program"
                        name="program"
                        value={selectedProgramId}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            setSelectedProgramId(e.target.value);
                            setPage(1); // reset page
                        }}
                        options={programs.map((p) => ({ label: p.title, value: p.id }))}
                    />
                </div>
            )}

            <div className="relative">
                {loading && <TopCenterLoader />}

                <div className={`overflow-x-auto border border-gray-300 rounded-sm shadow-sm bg-white dark:bg-darkSurface dark:border-darkBorderLight`}>
                    <table className="min-w-full text-left">
                        <thead className="bg-gray-100 border-b border-gray-300 dark:border-darkBorderLight text-gray-700 dark:bg-darkMuted dark:text-darkTextMuted uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-4 py-2">Program Title</th>
                                <th className="px-4 py-2">Catalogue Year</th>
                                <th className="px-4 py-2">Department</th>
                                <th className="px-4 py-2">Created By</th>
                                <th className="px-4 py-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-darkTextMuted">
                                        Loading catalogues...
                                    </td>
                                </tr>
                            ) : catalogues.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-6 text-gray-500 dark:text-darkTextMuted">
                                        No catalogues found.
                                    </td>
                                </tr>
                            ) : (
                                catalogues.map((catalogue: ProgramCatalogue) => (
                                    <tr
                                        key={catalogue.id}
                                        className="border-b last:border-0 text-sm hover:bg-gray-50 dark:hover:bg-darkMuted transition border-gray-200 dark:border-darkBorderLight"
                                    >
                                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-darkTextPrimary">
                                            {catalogue.program?.title ?? "N/A"}
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="inline-block bg-gray-100 text-gray-700 dark:bg-darkSurface dark:text-darkTextSecondary text-xs font-medium px-2 py-1 rounded">
                                                {catalogue.catalogueYear}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            {catalogue.program?.departmentTitle ? (
                                                <span className="inline-block bg-gray-100 text-gray-700 dark:bg-darkSurface dark:text-darkTextSecondary text-xs font-medium px-2 py-1 rounded">
                                                    {catalogue.program.departmentTitle}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 dark:text-darkTextMuted italic">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-darkTextSecondary">
                                            <span className="font-medium">
                                                {truncateName(`${catalogue.createdBy?.firstName} ${catalogue.createdBy?.lastName} ` || "-", 20)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <button
                                                onClick={() => handleViewCatalogue(catalogue.id)}
                                                className="inline-flex items-center justify-center text-sm text-blue-500 dark:text-darkBlurple hover:text-blue-700 dark:hover:text-darkBlurpleHover"
                                                title="View Catalogue"
                                            >
                                                <FiEdit className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && selectedCatalogueId && (
                <Modal isOpen={showModal} onClose={closeModal}>
                    <CatalogueProfile
                        catalogueId={selectedCatalogueId}
                        fetchCatalogue={getCatalogueById}
                        updateProgram={updateCatalogueById}
                        programs={programs}
                        onSuccess={() => setShowModal(false)}
                    />
                </Modal>
            )}

            {showRegisterModal && (
                <Modal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)}>
                    <CreateCatalogueForm onSuccess={() => setShowRegisterModal(false)}
                        programs={programs} />
                </Modal>
            )}

            <div className="flex justify-end">
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            </div>

        </div>
    );
};

export default CatalogueManagement;
