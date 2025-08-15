import React, { useEffect, useState } from "react";
import { FiEye } from "react-icons/fi";
import { useToast } from "../../context/ToastContext";
import { useQuery } from "@tanstack/react-query";
import { getFacultyMemberById, getFacultyMembers, updateFacultyMember } from "../../api/core/faculty-api";
import { GLOBAL_TITLE, MAX_PAGE_LIMIT } from "../../constants";
import { Helmet } from "react-helmet-async";
import Breadcrumbs, { generateBreadcrumbs } from "../../components/ui/Breadcrumbs";
import PageHeading from "../../components/ui/PageHeading";
import TopCenterLoader from "../../components/ui/TopCenterLoader";
import { truncateName } from "../../utils/truncate-name";
import { Pagination } from "../../components/ui/Pagination";
import Modal from "../../components/ui/Modal";
import FacultyProfile from "../../components/pages/core/faculty/FacultyProfile";
import RegisterFacultyForm from "../../components/pages/core/faculty/RegisterFacultyForm";
import { PaginatedFacultyResponse } from "../../constants/core/interfaces";
import { AudienceEnum, FacultyTypeEnum, TeacherDesignationEnum } from "../../../../server/src/shared/enums";
import { useUserManagement } from "../../hooks/admin/useUserManagement";
import { usePermissions } from "../../hooks/usePermissions";
import { SelectInput } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";


const FacultyManagement: React.FC = () => {
    const { user } = usePermissions();
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const toast = useToast();

    const [designationFilter, setDesignationFilter] = useState<string | null>(null);
    const [facultyTypeFilter, setFacultyTypeFilter] = useState<string | null>(null);
    const [subjectOwnerFilter, setSubjectOwnerFilter] = useState<string | null>(null); // "true" or "false"
    const [joiningDateFromFilter, setJoiningDateFromFilter] = useState<string | null>(null);
    const [joiningDateToFilter, setJoiningDateToFilter] = useState<string | null>(null);

    const {
        departmentOptions,
        departmentFilter, setDepartmentFilter, page, setPage,
        search, setSearch, debouncedSearch,
    } =
        useUserManagement(user?.role as AudienceEnum);

    const handleViewFaculty = (facultyId: string) => {
        setSelectedFacultyId(facultyId);
        setShowEditModal(true);
    };

    const {
        data: facultyData,
        isLoading,
        isError,
        error
    } = useQuery<PaginatedFacultyResponse, Error>({
        queryKey: [
            'faculty',
            page,
            search,
            departmentFilter,
            designationFilter,
            facultyTypeFilter,
            subjectOwnerFilter,
            joiningDateFromFilter,
            joiningDateToFilter
        ],
        queryFn: () => getFacultyMembers({
            page,
            limit: MAX_PAGE_LIMIT,
            search: search || undefined,
            department: departmentFilter || undefined,
            designation: designationFilter || undefined,
            facultyType: facultyTypeFilter || undefined,
            subjectOwner: subjectOwnerFilter || undefined,
            joiningDateFrom: joiningDateFromFilter || undefined,
            joiningDateTo: joiningDateToFilter || undefined,
        }),
    });

    useEffect(() => {
        if (isError) {
            toast.error("Error fetching faculty members: " + error?.message);
        }
    }, [isError, error]);

    const faculty = facultyData?.data || [];
    const totalPages = facultyData?.totalPages || 1;

    const filteredFaculty = faculty.filter((member) => {
        const query = debouncedSearch.trim().toLowerCase();
        return (
            (member.email?.toLowerCase() || "").includes(query) ||
            (member.firstName?.toLowerCase() || "").includes(query) ||
            (member.lastName?.toLowerCase() || "").includes(query) ||
            (member.city?.toLowerCase() || "").includes(query) ||
            (member.country?.toLowerCase() || "").includes(query) ||
            (member.department?.toLowerCase() || "").includes(query)
        );
    });

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <Helmet>
                <title>{GLOBAL_TITLE} - Faculty Management</title>
            </Helmet>
            <Breadcrumbs items={generateBreadcrumbs('/faculty/members')} />

            <div className="mt-2 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                {/* Left: Heading */}
                <PageHeading title="Faculty Management" />

                {/* Right: Search + Button grouped together */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:ml-auto">
                    <input
                        type="text"
                        placeholder="Search faculty..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border border-gray-300 rounded px-4 py-2 w-full sm:w-auto md:max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm
                        dark:bg-darkSurface dark:border-darkBorderLight dark:text-darkTextPrimary dark:placeholder-darkTextMuted"
                    />

                    <Button
                        onClick={() => setShowRegisterModal(true)}
                        fullWidth={false}
                        variant="green"
                        size="md"
                    >
                        Add Faculty
                    </Button>

                </div>
            </div>


            <div className="flex justify-end mt-8">
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <div className="flex flex-col">
                        <label className="mb-1 text-xs font-semibold text-gray-800 dark:text-gray-300">
                            Department
                        </label>
                        <SelectInput
                            value={departmentFilter || ""}
                            onChange={e => setDepartmentFilter(e.target.value || null)}
                            options={departmentOptions}
                            placeholder="Filter by Department"
                            className="max-w-xs text-xs w-full"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-1 text-xs font-semibold text-gray-800 dark:text-gray-300">
                            Designation
                        </label>
                        <SelectInput
                            value={designationFilter || ""}
                            onChange={e => setDesignationFilter(e.target.value || null)}
                            options={[
                                { label: "All", value: "" },
                                ...Object.values(TeacherDesignationEnum).map(des => ({ label: des, value: des })),
                            ]}
                            placeholder="Filter by Designation"
                            className="max-w-xs text-xs w-full"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-1 text-xs font-semibold text-gray-800 dark:text-gray-300">
                            Faculty Type
                        </label>
                        <SelectInput
                            value={facultyTypeFilter || ""}
                            onChange={e => setFacultyTypeFilter(e.target.value || null)}
                            options={[
                                { label: "All", value: "" },
                                ...Object.values(FacultyTypeEnum).map(type => ({ label: type, value: type })),
                            ]}
                            placeholder="Filter by Faculty Type"
                            className="max-w-xs text-xs w-full"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-1 text-xs font-semibold text-gray-800 dark:text-gray-300">
                            Subject Owner
                        </label>
                        <SelectInput
                            value={subjectOwnerFilter || ""}
                            onChange={e => setSubjectOwnerFilter(e.target.value || null)}
                            options={[
                                { label: "All", value: "" },
                                { label: "Yes", value: "true" },
                                { label: "No", value: "false" },
                            ]}
                            placeholder="Subject Owner?"
                            className="max-w-xs text-xs w-full"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-1 text-xs font-semibold text-gray-800 dark:text-gray-300">
                            Joining Date From
                        </label>
                        <input
                            type="date"
                            value={joiningDateFromFilter || ""}
                            onChange={e => setJoiningDateFromFilter(e.target.value || null)}
                            placeholder="Joining Date From"
                            className="border border-gray-300 rounded px-2 py-1 text-xs max-w-xs w-full"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-1 text-xs font-semibold text-gray-800 dark:text-gray-300">
                            Joining Date To
                        </label>
                        <input
                            type="date"
                            value={joiningDateToFilter || ""}
                            onChange={e => setJoiningDateToFilter(e.target.value || null)}
                            placeholder="Joining Date To"
                            className="border border-gray-300 rounded px-2 py-1 text-xs max-w-xs w-full"
                        />
                    </div>
                </div>
            </div>



                {isLoading && <TopCenterLoader />}

                <div className={`overflow-x-auto mt-4 rounded-sm border border-gray-300 dark:border-darkBorderLight shadow-sm bg-white dark:bg-darkSurface `}>
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-darkMuted text-gray-600 dark:text-darkTextMuted uppercase text-xs tracking-wider border-b border-gray-300 dark:border-darkBorderLight">
                            <tr>
                                <th className="px-4 py-2">Avatar</th>
                                <th className="px-4 py-2">First Name</th>
                                <th className="px-4 py-2">Last Name</th>
                                <th className="px-4 py-2">Email</th>
                                <th className="px-4 py-2">City</th>
                                <th className="px-4 py-2">Department</th>
                                <th className="px-4 py-2">Designation</th>
                                <th className="px-4 py-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFaculty.length > 0 ? (
                                filteredFaculty.map((member: any) => (
                                    <tr
                                        key={member.id}
                                        className="border-b dark:border-darkBorderLight last:border-b-0 hover:bg-gray-50 dark:hover:bg-darkMuted transition"
                                    >
                                        <td className="px-4 py-2">
                                            {member.avatarURL ? (
                                                <img
                                                    src={member.avatarURL}
                                                    alt="avatar"
                                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 dark:ring-darkBorderLight"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 text-gray-400 dark:bg-darkMuted font-semibold">
                                                    {(member.firstName?.[0] || "").toUpperCase()}
                                                    {(member.lastName?.[0] || "").toUpperCase()}
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-4 py-2 text-gray-800 dark:text-darkTextPrimary font-medium">{truncateName(member.firstName || "-")}</td>
                                        <td className="px-4 py-2 text-gray-800 dark:text-darkTextPrimary font-medium">{truncateName(member.lastName || "-")}</td>
                                        <td className="px-4 py-2 text-gray-800 dark:text-darkTextSecondary">{truncateName(member.email || "-")}</td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-darkTextMuted">{member.city || "-"}</td>
                                        <td className="px-4 py-2 text-gray-800 dark:text-darkTextSecondary">
                                            {truncateName(member.department ?? "-")}
                                        </td>
                                        <td className="px-4 py-2 text-gray-800 dark:text-darkTextSecondary">
                                            {member.teacherInfo?.designation || "-"}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <button
                                                onClick={() => handleViewFaculty(member.id)}
                                                className="inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-darkMuted transition"
                                                title="View faculty details"
                                            >
                                                <FiEye className="w-4 h-4 text-blue-500" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center px-4 py-6 text-gray-500 dark:text-darkTextMuted">
                                        No faculty members found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>


            <div className="flex justify-end">
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            </div>

            {showEditModal && selectedFacultyId && (
                <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
                    <FacultyProfile
                        facultyId={selectedFacultyId}
                        fetchFaculty={getFacultyMemberById}
                        updateUser={updateFacultyMember}
                        onSuccess={() => {
                            setShowEditModal(false);
                        }}
                        onDelete={() => {
                            setShowEditModal(false);
                        }}
                    />
                </Modal>
            )}

            {showRegisterModal && (
                <Modal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)}>
                    <RegisterFacultyForm onSuccess={() => setShowRegisterModal(false)} />
                </Modal>
            )}
        </div>
    );
};

export default FacultyManagement;
