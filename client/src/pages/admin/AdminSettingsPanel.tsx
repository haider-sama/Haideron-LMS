import React, { useEffect, useMemo, useState } from 'react';
import { AdminSettings } from '../../constants/admin/interfaces';
// import { Button } from '../../components/ui/Button';
import TopCenterLoader from '../../components/ui/TopCenterLoader';
import { useSettings } from '../../hooks/admin/useSettings';
import ErrorStatus from '../../components/ui/ErrorStatus';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Helmet } from 'react-helmet-async';
import { GLOBAL_TITLE } from '../../constants';
import Breadcrumbs, { generateBreadcrumbs } from '../../components/ui/Breadcrumbs';
import PageHeading from '../../components/ui/PageHeading';

const ITEMS_PER_PAGE = 5;

const AdminSettingsPanel: React.FC = () => {
    const {
        adminSettings,
        handleAdminChange,
        isLoading,
    } = useSettings(true); // adminMode = true

    const [currentPage, setCurrentPage] = useState(1);

    // Convert settings object to entries array for pagination
    const settingsEntries = useMemo(
        () => (adminSettings ? Object.entries(adminSettings) as [keyof AdminSettings, any][] : []),
        [adminSettings]
    );

    const totalPages = Math.max(1, Math.ceil(settingsEntries.length / ITEMS_PER_PAGE));

    const paginatedEntries = useMemo(
        () =>
            settingsEntries.slice(
                (currentPage - 1) * ITEMS_PER_PAGE,
                currentPage * ITEMS_PER_PAGE
            ),
        [settingsEntries, currentPage]
    );

    // Render input based on type (boolean = checkbox, number = number input)
    const renderSettingInput = ([key, value]: [keyof AdminSettings, any]) => {
        if (typeof value === 'boolean') {
            return (
                <div
                    key={key as string}
                    className="flex justify-between items-center mb-4 p-2 bg-gray-50 dark:bg-darkSurface rounded-lg shadow-sm"
                >
                    <span className="text-gray-800 dark:text-gray-200 font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>

                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => handleAdminChange(key, e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-600 peer-checked:bg-blue-600 transition-all"></div>
                        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform peer-checked:translate-x-full"></div>
                    </label>
                </div>
            );
        }

        return null;
    };

    const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
        if (currentPage < 1) {
            setCurrentPage(1);
        }
    }, [currentPage, totalPages]);

    if (!settingsEntries.length && !isLoading) return <ErrorStatus message="No settings found." />

    return (
        <div className="min-h-screen flex flex-col">
            <div className="p-8 max-w-6xl mx-auto w-full">
                <Helmet>
                    <title>{GLOBAL_TITLE} - Admin Panel - Settings</title>
                </Helmet>

                <div className="mb-4">
                    <Breadcrumbs items={generateBreadcrumbs("/admin/settings")} />
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-4">
                <div className="w-full max-w-3xl flex justify-between items-center mb-4">
                    <PageHeading title="Settings" />
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-darkBorderLight disabled:opacity-50"
                        >
                            <FiChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-darkBorderLight disabled:opacity-50"
                        >
                            <FiChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Container */}
                <div className="w-full max-w-3xl bg-white dark:bg-darkSurface border border-gray-300 dark:border-darkBorderLight rounded-sm shadow-sm p-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center p-8">
                            <TopCenterLoader />
                        </div>
                    ) : !adminSettings ? (
                        <ErrorStatus message="Failed to load settings." />
                    ) : (
                        <form>
                            {paginatedEntries.map(renderSettingInput)}
                        </form>
                    )}
                </div>

                {/* <div className="mt-4">
                    <Button
                        variant="gray"
                        size="md"
                        onClick={saveAdminSettings}
                        disabled={isUpdating || isLoading || !adminSettings}
                    >
                        {isUpdating ? 'Saving...' : 'Save All'}
                    </Button>
                </div> */}
            </div>
        </div>
    );
};

export default AdminSettingsPanel;
