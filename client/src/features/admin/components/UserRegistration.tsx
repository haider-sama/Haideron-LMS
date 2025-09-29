import { AudienceEnum, DepartmentEnum } from "../../../../../server/src/shared/enums";
import { BulkUser } from "../../../shared/constants/core/interfaces";
import PageHeading from "../../../components/ui/PageHeading";
import { FiTrash2 } from "react-icons/fi";
import { usePermissions } from "../../auth/hooks/usePermissions";
import { useUserManagement } from "../../../hooks/admin/useUserManagement";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { AnimatePresence } from "framer-motion";
import { DropdownEditor } from "../../../components/ui/DropdownEditor";
import { SelectInput } from "../../../components/ui/Input";
import { CSVUpload } from "./CSVUpload";

const UserRegistration = () => {
    const { user } = usePermissions();
    const { usersFormData, handleCSVUpload, isSubmitting, handleSubmit,
        handleChangeForm, handleRemoveUser, availableRoles, validateUser, handleAddUser,

    } =
        useUserManagement((user?.role ?? AudienceEnum.Guest) as AudienceEnum);

    const [editableCell, setEditableCell] = useState<{ rowIndex: number; field: string } | null>(null);
    const [tempValue, setTempValue] = useState<string>("");
    const [isCSVOpen, setIsCSVOpen] = useState(false);

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
        <div className="max-w-6xl mx-auto">
            <PageHeading title="User Registration" />

            <div className="space-y-6">
                <div className="flex items-center space-x-3">
                    <Button onClick={handleAddUser}
                        disabled={isSubmitting}
                        size="sm" fullWidth={false} variant="blue"
                    >
                        Add User
                    </Button>

                    {/* Actions Dropdown */}
                    <div className="w-44">
                        <SelectInput
                            name="user-actions"
                            placeholder="Actions"
                            options={[
                                { label: "Upload CSV", value: "upload", action: () => setIsCSVOpen(true) },
                                { label: "Download Template", value: "template", action: () => (window.location.href = "/files/list.csv") },
                            ]} />
                    </div>
                </div>

                <CSVUpload
                    isOpen={isCSVOpen}
                    onClose={() => setIsCSVOpen(false)}
                    handleCSVUpload={handleCSVUpload}
                    isSubmitting={isSubmitting}
                    modalTitle="Upload User CSV"
                    modalDescription="Add users in bulk by uploading a properly formatted CSV file."
                    infoList={[
                        <>Format: <code>email,password,role,department,firstName,lastName,fatherName,city,country,address</code></>,
                        <>All fields required except <code>role</code> and <code>department</code> (defaults apply)</>,
                        <>First row must contain headers</>,
                        <>Delimiter: comma (,)</>,
                        <>No empty rows</>,
                    ]}
                    onConfirm={() => { handleCSVUpload }}
                />

            </div>

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
                                    // Editing cell - show dropdown editor
                                    return (
                                        <td key={field} className={cellClass} style={{ position: "relative" }}>
                                            {/* Render current value faded */}
                                            <div className="opacity-30">{value}</div>

                                            <AnimatePresence>
                                                {isEditing && (
                                                    <DropdownEditor
                                                        tempValue={tempValue}
                                                        setTempValue={setTempValue}
                                                        onCancel={onCancel}
                                                        onSave={onSave}
                                                        type={
                                                            field === "email"
                                                                ? "email"
                                                                : field === "password"
                                                                    ? "password"
                                                                    : "text"
                                                        }
                                                    >
                                                        {/* Children passed into DropdownEditor */}
                                                        {field === "address" || field === "notes" ? (
                                                            <textarea
                                                                value={tempValue}
                                                                onChange={(e) => setTempValue(e.target.value)}
                                                                rows={4}
                                                                autoFocus
                                                                className="w-full h-full p-2 text-xs bg-transparent text-gray-800 dark:text-darkTextPrimary border-0 focus:outline-none focus:ring-0 align-bottom"
                                                            />
                                                        ) : field === "role" ? (
                                                            <select
                                                                value={tempValue}
                                                                onChange={(e) => setTempValue(e.target.value)}
                                                                disabled={isSubmitting}
                                                                autoFocus
                                                                className="w-full p-2 text-sm border rounded-md dark:bg-darkPrimary dark:text-darkTextPrimary"
                                                            >
                                                                {availableRoles.map((role) => (
                                                                    <option key={role.value} value={role.value}>
                                                                        {role.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : field === "department" ? (
                                                            <select
                                                                value={tempValue}
                                                                onChange={(e) => setTempValue(e.target.value)}
                                                                disabled={isSubmitting}
                                                                autoFocus
                                                                className="w-full p-2 text-sm border rounded-md dark:bg-darkPrimary dark:text-darkTextPrimary"
                                                            >
                                                                {Object.values(DepartmentEnum).map((d) => (
                                                                    <option key={d} value={d}>
                                                                        {d}
                                                                    </option>
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
                                                    </DropdownEditor>
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
