import { useRef, useState } from "react";
import { bulkRegisterUsers } from "../../../api/admin/admin-api";
import { AudienceEnum, DepartmentEnum } from "../../../../../server/src/shared/enums";
import UserAddForm from "../../../components/pages/core/admin/UserAddForm";
import Papa from "papaparse";
import { getButtonClass } from "../../../components/ui/ButtonClass";
import { getAvailableRoles, GLOBAL_TITLE, restrictedRoles } from "../../../constants";
import { useToast } from "../../../context/ToastContext";
import { BulkUser } from "../../../constants/core/interfaces";
import PageHeading from "../../../components/ui/PageHeading";
import Breadcrumbs, { generateBreadcrumbs } from "../../../components/ui/Breadcrumbs";
import { FiTrash2 } from "react-icons/fi";
import { Input, SelectInput } from "../../../components/ui/Input";
import { Helmet } from "react-helmet-async";
import { usePermissions } from "../../../hooks/usePermissions";


const UserRegistration = () => {
    const { user } = usePermissions();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentUserRole = (user?.role ?? AudienceEnum.Guest) as AudienceEnum;
    const availableRoles = getAvailableRoles(currentUserRole);
    const toast = useToast();
    const [viewMode, setViewMode] = useState<"form" | "table">("table");

    const initialUser: BulkUser = {
        email: "",
        password: "",
        role: AudienceEnum.Guest,
        department: DepartmentEnum.NA,
        firstName: "",
        lastName: "",
        fatherName: "",
        city: "",
        country: "",
        address: "",
    };

    const [users, setUsers] = useState([initialUser]);

    const formRefs = useRef<(HTMLDivElement | null)[]>([]); // Refs to scroll to specific forms

    const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isSubmitting) return;
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const parsedUsers = results.data.map((row: any) => {
                    let role = row.role && Object.values(AudienceEnum).includes(row.role) ? row.role : AudienceEnum.Guest;

                    if (currentUserRole !== AudienceEnum.Admin && restrictedRoles.includes(role)) {
                        role = AudienceEnum.Guest;
                    }

                    let department = Object.values(DepartmentEnum).includes(row.department) ? row.department : DepartmentEnum.NA;

                    return {
                        email: (row.email || "").trim(),
                        password: row.password || "",
                        role,
                        department,
                        firstName: (row.firstName || "").trim(),
                        lastName: (row.lastName || "").trim(),
                        fatherName: (row.fatherName || "").trim(),
                        city: (row.city || "").trim(),
                        country: (row.country || "").trim(),
                        address: (row.address || "").trim(),
                    };
                });

                setUsers((prevUsers) => [...prevUsers, ...parsedUsers]);
            },
            error: (error) => {
                alert("Error parsing CSV: " + error.message);
            },
        });

        e.target.value = ""; // reset input
    };

    const handleChange = <K extends keyof BulkUser>(index: number, field: K, value: BulkUser[K]) => {
        if (isSubmitting) return;
        const updatedUsers = [...users];
        updatedUsers[index] = {
            ...updatedUsers[index],
            [field]: value,
        };
        setUsers(updatedUsers);
    };

    const handleAddUser = () => {
        if (isSubmitting) return;
        setUsers([...users, { ...initialUser }]);
    };

    const handleRemoveUser = (index: number) => {
        if (isSubmitting) return;
        const updated = users.filter((_, i) => i !== index);
        setUsers(updated);
    };

    const handleSubmit = async () => {
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const requiredFields = [
                "email", "password", "role", "department",
                "firstName", "lastName", "fatherName", "city", "country", "address"
            ];

            const missing = requiredFields.filter((field) => !user[field as keyof typeof user]);
            if (missing.length > 0) {
                toast.error(`Please fill all fields for user ${i + 1}`);
                formRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const { results } = await bulkRegisterUsers(users);

            const failed = results.filter(r => !r.success);
            const success = results.filter(r => r.success);

            if (failed.length > 0) {
                failed.forEach(fail => {
                    toast.error(`${fail.email}: ${fail.message}`);
                });

                // Scroll to first failed one (if you want):
                const firstFailIndex = failed.findIndex(f => f.email);
                if (firstFailIndex >= 0) {
                    const refIndex = users.findIndex(u => u.email === failed[firstFailIndex].email);
                    formRefs.current[refIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }

            if (success.length > 0) {
                toast.success(`${success.length} user(s) registered successfully`);
                setUsers([{ ...initialUser }]);
            }

        } catch (err: any) {
            if (err.errors && typeof err.errors === "object") {
                let shownError = false;

                Object.entries(err.errors).forEach(([_, messages]) => {
                    if (Array.isArray(messages)) {
                        messages
                            .filter(msg => msg && typeof msg === "string")
                            .forEach(msg => {
                                shownError = true;
                                toast.error(msg);
                            });
                    }
                });

                if (!shownError) {
                    toast.error("Some input fields are invalid.");
                }
            } else {
                toast.error(err.message || "Unexpected error occurred");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const validateUser = (user: BulkUser) => {
        const requiredFields: (keyof BulkUser)[] = [
            "email", "password", "firstName", "lastName",
            "fatherName", "city", "country", "address",
        ];
        return requiredFields.every((field) => Boolean(user[field]));
    };

    return (
        <div className="max-w-6xl mx-auto p-8">
            <Helmet>
                <title>{GLOBAL_TITLE} - Admin Panel - User Registration</title>
            </Helmet>
            <Breadcrumbs items={generateBreadcrumbs('/admin/user-registration')} />
            <PageHeading title="User Registration" />

            <div className="flex justify-end mb-4">
                <button
                    onClick={() => setViewMode(viewMode === "form" ? "table" : "form")}
                    className={getButtonClass({
                        bg: "bg-indigo-400",
                        hoverBg: "hover:bg-white dark:hover:bg-darkSurface",
                        text: "text-white dark:text-indigo-100",
                        hoverText: "hover:text-indigo-700 dark:hover:text-indigo-300",
                        focusRing: "focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-500/30",
                        extra:
                            "w-full sm:w-fit px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 border border-gray-200 dark:border-darkBorderLight transition-all duration-200",
                    })}
                >
                    Switch to {viewMode === "form" ? "Table" : "Form"} View
                </button>
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
                    {users.map((user, index) => (
                        <UserAddForm
                            key={index}
                            user={user}
                            index={index}
                            onChange={handleChange}
                            onRemove={handleRemoveUser}
                            canRemove={true}
                            disabled={isSubmitting}
                            availableRoles={availableRoles}
                        />
                    ))}
                </>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm mt-6 border rounded-lg shadow-sm bg-white dark:bg-darkSurface dark:border-darkBorderLight">
                        <thead className="bg-gray-100 text-left dark:bg-darkMuted dark:text-darkTextSecondary">
                            <tr>
                                {[
                                    "Email", "Password", "Role", "Dept",
                                    "First Name", "Last Name", "Father's Name", "City", "Country", "Address", "Action"
                                ].map((header) => (
                                    <th key={header} className="p-2 border dark:border-darkBorderLight">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <tr
                                    key={index}
                                    className={`even:bg-gray-50 dark:even:bg-darkSurface
                                    ${!validateUser(user)
                                            ? "bg-gray-100 dark:bg-darkMuted/50"
                                            : "bg-white dark:bg-darkPrimary"
                                        }`}
                                >
                                    {Object.entries(user).map(([field, value]) => (
                                        <td key={field} className="p-2 border dark:border-darkBorderLight">
                                            {field === "role" ? (
                                                <SelectInput
                                                    name={`role-${index}`}
                                                    value={value}
                                                    onChange={(e) =>
                                                        handleChange(index, "role", e.target.value as AudienceEnum)
                                                    }
                                                    options={availableRoles}
                                                    disabled={isSubmitting}
                                                />
                                            ) : field === "department" ? (
                                                <SelectInput
                                                    name={`department-${index}`}
                                                    value={value}
                                                    onChange={(e) =>
                                                        handleChange(
                                                            index,
                                                            "department",
                                                            e.target.value as DepartmentEnum
                                                        )
                                                    }
                                                    options={Object.values(DepartmentEnum).map((d) => ({
                                                        label: d,
                                                        value: d,
                                                    }))}
                                                    disabled={isSubmitting}
                                                />
                                            ) : (
                                                <Input
                                                    type="text"
                                                    value={value}
                                                    onChange={(e) =>
                                                        handleChange(index, field as keyof BulkUser, e.target.value)
                                                    }
                                                    className="text-xs bg-white text-gray-800 dark:bg-darkSurface dark:text-darkTextPrimary"
                                                />
                                            )}
                                        </td>
                                    ))}
                                    <td className="p-2 border text-center dark:border-darkBorderLight">
                                        <button
                                            onClick={() => handleRemoveUser(index)}
                                            className="text-red-400 hover:underline hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-xs"
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
                <button
                    onClick={handleAddUser}
                    disabled={isSubmitting}
                    className={getButtonClass({
                        bg: "bg-blue-400",
                        hoverBg: "hover:bg-white dark:hover:bg-darkSurface",
                        text: "text-white dark:text-blue-100",
                        hoverText: "hover:text-blue-800 dark:hover:text-blue-300",
                        focusRing: "focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-500/30",
                        extra:
                            "px-6 py-2 text-sm border border-gray-200 dark:border-darkBorderLight font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed",
                    })}
                >
                    Add Another User
                </button>

                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={getButtonClass({
                        bg: "bg-primary dark:bg-darkBlurpleHover",
                        hoverBg: "hover:bg-white dark:hover:bg-darkSurface",
                        text: "text-white dark:text-blue-100",
                        hoverText: "hover:text-darkBlurpleHover dark:hover:text-darkBlurpleHover",
                        focusRing: "focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-500/30",
                        extra:
                            "px-6 py-2 text-sm border border-gray-200 dark:border-darkBorderLight font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed",
                    })}
                >
                    {isSubmitting ? "Submitting..." : "Submit"}
                </button>

            </div>
        </div>
    );
};

export default UserRegistration;
