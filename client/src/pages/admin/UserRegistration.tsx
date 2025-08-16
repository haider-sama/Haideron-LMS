import { AudienceEnum, DepartmentEnum } from "../../../../server/src/shared/enums";
import UserAddForm from "../../components/pages/core/admin/UserAddForm";
import { GLOBAL_TITLE } from "../../constants";
import { BulkUser } from "../../constants/core/interfaces";
import PageHeading from "../../components/ui/PageHeading";
import Breadcrumbs, { generateBreadcrumbs } from "../../components/ui/Breadcrumbs";
import { FiTrash2 } from "react-icons/fi";
import { Helmet } from "react-helmet-async";
import { usePermissions } from "../../hooks/usePermissions";
import { useUserManagement } from "../../hooks/admin/useUserManagement";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

const UserRegistration = () => {
    const { user } = usePermissions();
    const { usersFormData, viewMode, setViewMode, handleCSVUpload, isSubmitting, handleSubmit,
        handleChangeForm, handleRemoveUser, availableRoles, validateUser, handleAddUser,

    } =
        useUserManagement((user?.role ?? AudienceEnum.Guest) as AudienceEnum);

    const [editableCell, setEditableCell] = useState<{ rowIndex: number; field: string } | null>(null);
    const [tempValue, setTempValue] = useState<string>("");
    
    // Refs for detecting outside clicks
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const onCellDoubleClick = (rowIndex: number, field: string, currentValue: string) => {
        if (isSubmitting) return;
        setEditableCell({ rowIndex, field });
        setTempValue(currentValue);
    };

    const onSave = () => {
        if (editableCell) {
            handleChangeForm(editableCell.rowIndex, editableCell.field as keyof BulkUser, tempValue);
            setEditableCell(null);
        }
    };

    const onCancel = () => {
        setEditableCell(null);
        setTempValue("");
    };

    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onCancel();
            }
        }

        if (editableCell) {
            document.addEventListener("keydown", handleEscape);
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [editableCell]);

    return (
        <div className="max-w-6xl mx-auto p-8">
            <Helmet>
                <title>{GLOBAL_TITLE} - Admin Panel - User Registration</title>
            </Helmet>
            <Breadcrumbs items={generateBreadcrumbs('/admin/user-registration')} />
            <PageHeading title="User Registration" />

            <div className="flex justify-end mb-4">
                <Button onClick={() => setViewMode(viewMode === "form" ? "table" : "form")}
                    size="md" fullWidth={false} variant="green">
                    Switch to {viewMode === "form" ? "Table" : "Form"} View
                </Button>
            </div>

            {/* CSV Upload Input */}
            <div className="mb-8">
                <label className="block mb-2 font-semibold" htmlFor="csv-upload">
                    Upload CSV file
                </label>
                <input
                    type="file"
                    id="csv-upload"
                    accept=".csv,text/csv"
                    onChange={handleCSVUpload}
                    disabled={isSubmitting}
                    className="border p-2 rounded border-gray-200 dark:border-darkBorderLight"
                />
                <ul className="text-gray-500 text-sm mt-1 list-disc list-inside space-y-1">
                    <li>CSV format: <code>email,password,role,department,firstName,lastName,fatherName,city,country,address</code></li>
                    <li>All fields are required except <code>role</code> and <code>department</code> (defaults will apply)</li>
                    <li>Make sure the first row contains headers.</li>
                    <li>Use comma (<code>,</code>) as the delimiter.</li>
                    <li>Ensure no empty rows are present.</li>
                </ul>
                <a
                    href="/files/list.csv"
                    download
                    className="inline-block mt-2 text-blue-600 hover:underline text-sm dark:text-blue-400"
                >
                    Download CSV template (with example users)
                </a>
            </div>

            {/* User Input Section (Form OR Table) */}
            {viewMode === "form" ? (
                <>
                    {usersFormData.map((user, index) => (
                        <UserAddForm
                            key={index}
                            user={user as BulkUser}
                            index={index}
                            onChange={handleChangeForm}
                            onRemove={handleRemoveUser}
                            canRemove={true}
                            disabled={isSubmitting}
                            availableRoles={availableRoles}
                        />
                    ))}
                </>
            ) : (
                <div className="">
                    <table className="w-full text-sm mt-6 border border-gray-300 rounded-lg shadow-sm bg-white dark:bg-darkSurface dark:border-darkBorderLight overflow-x-auto">
                        <thead className="text-left dark:bg-darkMuted dark:text-darkTextSecondary">
                            <tr>
                                {[
                                    "email", "password", "role", "department",
                                    "first Name", "last Name", "father Name", "city", "country", "address", "action"
                                ].map((header) => (
                                    <th
                                        key={header}
                                        className={`p-2 border dark:border-darkBorderLight cursor-pointer select-none 
                                            text-gray-800 uppercase text-xs dark:text-darkTextPrimary
                                            }`}
                                        title="Double click a cell in this column to edit entire column"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>


                        <tbody>
                            {usersFormData.map((user, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    className={`even:bg-gray-50 dark:even:bg-darkSurface ${!validateUser(user as BulkUser)
                                        ? "bg-gray-100 dark:bg-darkMuted/50"
                                        : "bg-white dark:bg-darkPrimary"
                                        }`}
                                >
                                    {Object.entries(user).map(([field, value]) => {
                                        if (field === "action") return null;

                                        const isEditing =
                                            editableCell !== null &&
                                            editableCell.rowIndex === rowIndex &&
                                            editableCell.field === field;

                                        const cellClass = `
                                            p-2
                                            ${isEditing ? "bg-blue-50 dark:bg-blue-800 border-0" : "border dark:border-darkBorderLight"}
                                            cursor-pointer
                                            relative
                                        `;

                                        // Normal cell (non-editing)
                                        if (!isEditing) {
                                            return (
                                                <td
                                                    key={field}
                                                    className={cellClass}
                                                    title="Double click to edit this cell"
                                                    onDoubleClick={() => onCellDoubleClick(rowIndex, field, value as string)}
                                                >
                                                    {value}
                                                </td>
                                            );
                                        }

                                        // Editing cell - show the dropdown overlay with motion animation
                                        return (
                                            <td key={field} className={cellClass} style={{ position: "relative" }}>
                                                {/* Render the current cell value faded/disabled */}
                                                <div className="opacity-30">{value}</div>

                                                {/* Dropdown panel */}
                                                <AnimatePresence>
                                                    {isEditing && (
                                                        <motion.div
                                                            ref={dropdownRef}
                                                            initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                                            transition={{ duration: 0.15 }}
                                                            className="absolute z-50 top-full left-0 mt-1 w-72 p-4 bg-white dark:bg-darkSurface border border-gray-300 dark:border-darkBorderLight"
                                                        >
                                                            {/* Use textarea for address or multiline fields */}
                                                            {(field === "address" || field === "notes") ? (
                                                                <textarea
                                                                    value={tempValue}
                                                                    onChange={(e) => setTempValue(e.target.value)}
                                                                    rows={4}
                                                                    autoFocus
                                                                    className="w-full h-full p-2 text-xs bg-transparent text-gray-800 dark:text-darkTextPrimary border-0 focus:outline-none focus:ring-0 align-bottom"
                                                                />
                                                            ) : (field === "role") ? (
                                                                <select
                                                                    value={tempValue}
                                                                    onChange={(e) => setTempValue(e.target.value)}
                                                                    disabled={isSubmitting}
                                                                    className="w-full p-2 text-sm border rounded-md dark:bg-darkPrimary dark:text-darkTextPrimary"
                                                                    autoFocus
                                                                >
                                                                    {availableRoles.map(role => (
                                                                        <option key={role.value} value={role.value}>{role.label}</option>
                                                                    ))}
                                                                </select>
                                                            ) : (field === "department") ? (
                                                                <select
                                                                    value={tempValue}
                                                                    onChange={(e) => setTempValue(e.target.value)}
                                                                    disabled={isSubmitting}
                                                                    className="w-full p-2 text-sm border rounded-md dark:bg-darkPrimary dark:text-darkTextPrimary"
                                                                    autoFocus
                                                                >
                                                                    {Object.values(DepartmentEnum).map(d => (
                                                                        <option key={d} value={d}>{d}</option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    value={tempValue}
                                                                    onChange={(e) => setTempValue(e.target.value)}
                                                                    autoFocus
                                                                    className="w-full h-full p-2 text-xs bg-transparent text-gray-800 dark:text-darkTextPrimary border-0 focus:outline-none focus:ring-0 align-bottom"
                                                                />
                                                            )}

                                                            {/* Buttons */}
                                                            <div className="mt-2 flex justify-end space-x-2">
                                                                <Button onClick={onCancel} fullWidth={false}
                                                                    size="sm" variant="light">
                                                                    Cancel
                                                                </Button>
                                                                <Button onClick={onSave} fullWidth={false} disabled={isSubmitting}
                                                                    size="sm" variant="green" loadingText="Saving..."
                                                                    isLoading={isSubmitting}>
                                                                    Save
                                                                </Button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </td>
                                        );
                                    })}

                                    {/* Action cell */}
                                    <td className="border dark:border-darkBorderLight p-2 text-center">
                                        <button
                                            onClick={() => handleRemoveUser(rowIndex)}
                                            className="text-red-400 hover:underline hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-xs"
                                            disabled={isSubmitting}
                                            title="Delete user"
                                        >
                                            <FiTrash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            )}

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                <Button onClick={handleAddUser}
                    disabled={isSubmitting}
                    size="md" fullWidth={false} variant="blue"
                >
                    Add Another User
                </Button>
                <Button onClick={handleSubmit} isLoading={isSubmitting}
                    disabled={isSubmitting} loadingText="Submitting..."
                    size="md" fullWidth={false}
                >
                    Submit
                </Button>
            </div>
        </div>
    );
};

export default UserRegistration;
