import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { FiEye, FiInfo } from "react-icons/fi";
import Breadcrumbs, { generateBreadcrumbs } from "../../components/ui/Breadcrumbs";
import PageHeading from "../../components/ui/PageHeading";
import TopCenterLoader from "../../components/ui/TopCenterLoader";
import { Pagination } from "../../components/ui/Pagination";
import SearchBar from "../../components/ui/SearchBar";
import { GLOBAL_TITLE } from "../../constants";
import { AuditLog, FetchAuditLogsFilters } from "../../constants/core/interfaces";
import { fetchPaginatedAuditLogs } from "../../api/admin/audit-log-api";
import { useQuery } from "@tanstack/react-query";
import ErrorStatus from "../../components/ui/ErrorStatus";
import { truncateName } from "../../utils/truncate-name";
import { Button } from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";

const AuditLogPage: React.FC = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [filters] = useState<FetchAuditLogsFilters>({}); // extend later if needed
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMetadata, setSelectedMetadata] = useState<any>(null);

    const handleOpenModal = (metadata: any) => {
        setSelectedMetadata(metadata);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedMetadata(null);
        setIsModalOpen(false);
    };

    const {
        data,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ["auditLogs", page, search, JSON.stringify(filters)],
        queryFn: () => fetchPaginatedAuditLogs(page, 20, search, filters),
        staleTime: 1000 * 60 * 1,
    });

    const handleSearch = (query: string) => {
        setPage(1); // reset to first page
        setSearch(query);
    };

    const logs: AuditLog[] = data?.data ?? [];
    const totalPages = data?.totalPages ?? 1;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <Helmet>
                <title>{GLOBAL_TITLE} - Admin Panel - Audit Logs</title>
            </Helmet>

            <div className="mb-4">
                <Breadcrumbs items={generateBreadcrumbs("/admin/audit-logs")} />

                {/* Header + Search */}
                <div className="mt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <PageHeading title="Audit Logs" />

                    <SearchBar
                        value={search}
                        onSearch={handleSearch}
                        showAdvanced={false}
                    />
                </div>
            </div>

            {/* Error State */}
            {isError && (
                <ErrorStatus message={error instanceof Error ? error.message : "Failed to fetch audit logs"} />
            )}

            {/* Table */}
            {!isError && (
                <div className="mt-4 overflow-x-auto border rounded-sm border-gray-300 bg-white dark:bg-darkSurface dark:border-darkBorderLight">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-100 text-gray-700 uppercase text-xs tracking-wide dark:bg-darkMuted dark:text-darkTextSecondary">
                            <tr className="border-b border-gray-300 dark:border-darkBorderLight">
                                <th className="px-4 py-2">Actor</th>
                                <th className="px-4 py-2">Action</th>
                                <th className="px-4 py-2">Target</th>
                                <th className="px-4 py-2">Details</th>
                                <th className="px-4 py-2">Timestamp</th>
                                <th className="px-4 py-2">Actions</th> {/* New Actions column */}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-4 py-6">
                                        <div className="flex flex-col items-center justify-center w-full h-full gap-2">
                                            <TopCenterLoader />
                                            <span className="text-gray-600 dark:text-darkTextMuted text-sm">
                                                Loading logs...
                                            </span>
                                        </div>
                                    </td></tr>) : logs.length > 0 ? ( logs.map((log) => (
                                    <tr key={log.id} className="border-b last:border-b-0 hover:bg-gray-50 dark:border-darkBorderLight dark:hover:bg-darkMuted transition">
                                        <td className="px-4 py-2 font-medium text-gray-800 dark:text-darkTextPrimary">
                                            {truncateName(log.actorId)}
                                        </td>
                                        <td className="px-4 py-2 text-gray-700 dark:text-darkTextSecondary">
                                            {truncateName(log.action)}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-darkTextMuted">
                                            {truncateName(`${log.entityType} / ${log.entityId}`)}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-darkTextMuted">
                                            {truncateName(JSON.stringify(log.metadata) || "-")}
                                        </td>
                                        <td className="px-4 py-2 text-gray-500 dark:text-darkTextMuted whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2 text-blue-600 dark:text-darkTextSecondary">
                                            <button
                                                onClick={() => handleOpenModal(log)}
                                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-darkBorderLight"
                                                title="View Details"
                                            >
                                                <FiEye className="w-4 h-4" />
                                            </button>
                                        </td>

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center px-4 py-6 text-gray-500 dark:text-darkTextMuted">
                                        <div className="flex items-center justify-center gap-2">
                                            <FiInfo className="w-4 h-4" />
                                            No logs found.
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            >
                {selectedMetadata && (
                    <div className="flex flex-col items-center justify-center p-6 min-h-[200px] max-w-lg w-full mx-auto my-auto">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FiInfo className="text-blue-500" />
                            Log Details
                        </h2>

                        <pre className="bg-gray-100 dark:bg-darkMuted p-4 rounded w-full overflow-x-auto text-sm text-gray-800 dark:text-darkTextPrimary">
                            {JSON.stringify(selectedMetadata, null, 2)} {/* now shows full log */}
                        </pre>

                        <div className="flex justify-center mt-4 w-full">
                            <Button
                                variant="gray"
                                size="md"
                                onClick={handleCloseModal}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Pagination */}
            {!isError && (
                <div className="flex justify-end mt-4">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </div>
            )}
        </div>
    );
};

export default AuditLogPage;