import React, { useState } from "react";
import { FiEye } from "react-icons/fi";
import { Helmet } from "react-helmet-async";
import { FetchPendingFinalizedResultsResponse, FinalizedResultWithRelations } from "../../../constants/core/interfaces";
import { GLOBAL_TITLE, MAX_PAGE_LIMIT } from "../../../constants";
import { fetchPendingFinalizedResults } from "../../../api/core/teacher/result-api";
import { useQuery } from "@tanstack/react-query";
import Breadcrumbs, { generateBreadcrumbs } from "../../../components/ui/Breadcrumbs";
import PageHeading from "../../../components/ui/PageHeading";
import TopCenterLoader from "../../../components/ui/TopCenterLoader";
import { Pagination } from "../../../components/ui/Pagination";
import Modal from "../../../components/ui/Modal";
import FinalizedResultReview from "./FinalizedResultReview";

const PendingFinalizedResultsList: React.FC = () => {
    const [page, setPage] = useState(1);
    const [selectedResult, setSelectedResult] = useState<FinalizedResultWithRelations | null>(null);
    const [showModal, setShowModal] = useState(false);

    const {
        data,
        isPending,
        isError,
        refetch,
    } = useQuery<FetchPendingFinalizedResultsResponse>({
        queryKey: ["pending-finalized-results", { page, limit: MAX_PAGE_LIMIT }],
        queryFn: () => fetchPendingFinalizedResults(page, MAX_PAGE_LIMIT),
        staleTime: 60 * 1000, // cache for 1 min
    });

    const results = data?.results || [];
    const totalPages = data?.totalPages || 1;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <Helmet>
                <title>{GLOBAL_TITLE} - Session Management - Review Pending Finalized Results</title>
            </Helmet>

            <div className="mb-4">
                <Breadcrumbs items={generateBreadcrumbs("/faculty/pending-results")} />

                <div className="mt-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <PageHeading title="Review Pending Finalized Results" />
                </div>
            </div>

            <div className="overflow-x-auto border border-gray-300 rounded-sm shadow-sm bg-white dark:bg-darkSurface dark:border-darkBorderLight">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-700 dark:bg-darkMuted dark:text-darkTextMuted uppercase text-xs tracking-wide border-b border-gray-300">
                        <tr>
                            <th className="px-4 py-2">Course Code</th>
                            <th className="px-4 py-2">Title</th>
                            <th className="px-4 py-2">Credit Hours</th>
                            <th className="px-4 py-2">Section</th>
                            <th className="px-4 py-2">Program</th>
                            <th className="px-4 py-2">Session Batch</th>
                            <th className="px-4 py-2">Submitted By</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isPending ? (
                            <tr>
                                <td colSpan={9} className="text-center px-4 py-6">
                                    <TopCenterLoader />
                                </td>
                            </tr>
                        ) : isError ? (
                            <tr>
                                <td colSpan={9} className="text-center px-4 py-6 text-red-500">
                                    Failed to load results.
                                </td>
                            </tr>
                        ) : results.length > 0 ? (
                            results.map((result) => (
                                <tr
                                    key={result.id}
                                    className="border-b last:border-0 border-gray-300 hover:bg-gray-50 dark:hover:bg-darkMuted transition dark:border-darkBorderLight"
                                >
                                    <td className="px-4 py-2 font-medium text-gray-800 dark:text-white whitespace-nowrap">
                                        {result.courseOffering.course.code}
                                    </td>
                                    <td className="px-4 py-2 text-gray-700 dark:text-darkTextMuted whitespace-nowrap">
                                        {result.courseOffering.course.title}
                                    </td>
                                    <td className="px-4 py-2 text-gray-700 dark:text-darkTextMuted">
                                        {result.courseOffering.course.creditHours}
                                    </td>
                                    <td className="px-4 py-2 text-gray-700 dark:text-darkTextMuted">{result.section}</td>
                                    <td className="px-4 py-2 text-gray-700 dark:text-darkTextMuted">
                                        {result.courseOffering.programBatch.program.title}
                                    </td>
                                    <td className="px-4 py-2 text-gray-700 dark:text-darkTextMuted">
                                        {result.courseOffering.programBatch.sessionYear}
                                    </td>
                                    <td className="px-4 py-2 text-gray-700 dark:text-darkTextMuted whitespace-nowrap">
                                        {result.submittedByUser.firstName} {result.submittedByUser.lastName}
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className="inline-flex items-center gap-1 text-yellow-700 dark:text-yellow-300 font-medium text-xs bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 px-2 py-1 rounded-full">
                                            {result.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <button
                                            onClick={() => {
                                                setSelectedResult(result);
                                                setShowModal(true);
                                            }}
                                            className="inline-flex items-center justify-center p-2 rounded hover:bg-gray-100 dark:hover:bg-darkMuted transition"
                                            title="Review result"
                                        >
                                            <FiEye className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={9} className="text-center px-4 py-6 text-gray-500 dark:text-darkTextMuted">
                                    No pending results found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end">
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>

            {showModal && selectedResult && (
                <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
                    <FinalizedResultReview
                        result={selectedResult}
                        onClose={() => setShowModal(false)}
                        onFinalized={() => {
                            refetch(); // invalidate query after finalize
                            setShowModal(false);
                        }}
                    />
                </Modal>
            )}
        </div>
    );
};

export default PendingFinalizedResultsList;
