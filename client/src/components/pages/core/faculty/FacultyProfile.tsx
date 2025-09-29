import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FacultyUpdatePayload, FacultyUser, TeacherQualificationInput } from "../../../../shared/constants/core/interfaces";
import { usePermissions } from "../../../../features/auth/hooks/usePermissions";
import { useEffect, useState } from "react";
import { useToast } from "../../../../shared/context/ToastContext";
import { AudienceEnum, DegreeEnum, DepartmentEnum, FacultyTypeEnum, TeacherDesignationEnum } from "../../../../../../server/src/shared/enums";
import { TeacherInfoWithQualifications, TeacherQualification } from "../../../../../../server/src/shared/interfaces";
import TopCenterLoader from "../../../ui/TopCenterLoader";
import InternalError from "../../../../pages/forbidden/InternalError";
import { Helmet } from "react-helmet-async";
import { GLOBAL_TITLE } from "../../../../shared/constants";
import AvatarUpload from "../../../../features/auth/components/account/AvatarUpload";
import { Input, ReadOnlyInput, SelectInput } from "../../../ui/Input";
import { FiTrash2 } from "react-icons/fi";
import { deleteFacultyMember } from "../../../../api/core/faculty-api";
import { Button } from "../../../ui/Button";


interface FacultyProfileProps {
    facultyId: string;
    fetchFaculty: (id: string) => Promise<FacultyUser>;
    updateUser: (id: string, data: FacultyUpdatePayload) => Promise<any>;
    onSuccess?: () => void;
    onDelete?: () => void;
}

interface EditableTeacherInfo {
    id?: string;
    userId?: string;
    designation: TeacherDesignationEnum;
    joiningDate: Date | null;
    facultyType: FacultyTypeEnum;
    subjectOwner: boolean;
}


const FacultyProfile =
    ({ facultyId, fetchFaculty, updateUser, onDelete }: FacultyProfileProps) => {
        const { user } = usePermissions();
        const queryClient = useQueryClient();
        const [faculty, setFaculty] = useState<FacultyUser | null>(null);
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [majorSubjectsBuffer, setMajorSubjectsBuffer] = useState<string[]>([]);
        const toast = useToast();

        const [qualifications, setQualifications] = useState<TeacherQualification[]>([]);

        const [editFields, setEditFields] = useState<{
            firstName?: string;
            lastName?: string;
            email?: string;
            department?: DepartmentEnum;
            role?: AudienceEnum;
            address?: string;
            city?: string;
            country?: string;
            teacherInfo: EditableTeacherInfo; // Use Partial here to allow missing id, userId initially
        }>({
            firstName: '',
            lastName: '',
            email: '',
            department: DepartmentEnum.CSE,
            role: AudienceEnum.DepartmentTeacher,
            address: '',
            city: '',
            country: '',
            teacherInfo: {
                designation: TeacherDesignationEnum.Lecturer,
                joiningDate: null,
                facultyType: FacultyTypeEnum.Permanent,
                subjectOwner: false,
            },
        });


        const { data, isLoading, isError } = useQuery({
            queryKey: ['facultyProfile', facultyId],
            queryFn: () => fetchFaculty(facultyId),
            enabled: !!facultyId,
            staleTime: 1000 * 60 * 5, // 5 min cache
        });

        // On data load success: set faculty, editFields, qualifications, majorSubjectsBuffer
        useEffect(() => {
            if (data) {
                setFaculty(data);
                setEditFields({
                    firstName: data.firstName || "",
                    lastName: data.lastName || "",
                    email: data.email || "",
                    department: data.department || undefined,
                    role: data.role,
                    address: data.address || "",
                    city: data.city || "",
                    country: data.country || "",
                    teacherInfo: {
                        designation: data.teacherInfo?.designation || TeacherDesignationEnum.Lecturer,
                        facultyType: data.teacherInfo?.facultyType || FacultyTypeEnum.Permanent,
                        joiningDate: data.teacherInfo?.joiningDate || null,
                        subjectOwner: data.teacherInfo?.subjectOwner || false,
                    },
                });

                const teacherInfoWithQual = data.teacherInfo as TeacherInfoWithQualifications | undefined;
                const loadedQualifications = teacherInfoWithQual?.qualifications || [];
                setQualifications(loadedQualifications);
                setMajorSubjectsBuffer(
                    loadedQualifications.map((q) => q.majorSubjects.join(", "))
                );
            }
        }, [data]);

        // On error
        useEffect(() => {
            if (isError) {
                toast.error("Failed to fetch faculty profile");
            }
        }, [isError]);

        const mutation = useMutation({
            mutationFn: (updatedData: FacultyUpdatePayload) => updateUser(facultyId, updatedData),
            onSuccess: () => {
                toast.success("Faculty profile updated");
                queryClient.invalidateQueries({
                    queryKey: ['facultyProfile', facultyId],
                });
            },
            onError: (err: any) => {
                if (err.errors && typeof err.errors === 'object') {
                    Object.values(err.errors).forEach((messages) => {
                        if (Array.isArray(messages)) {
                            messages.forEach((msg: string) => toast.error(msg));
                        }
                    });
                } else {
                    toast.error(err.message || "Failed to update");
                }
            },
        });

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            setEditFields((prev) => ({
                ...prev,
                [name]: value,
            }));
        };

        const handleTeacherInfoChange = (
            e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
        ) => {
            const { name, value } = e.target;
            setEditFields((prev) => ({
                ...prev,
                teacherInfo: {
                    ...prev.teacherInfo,
                    [name]: name === "subjectOwner" ? (e.target as HTMLInputElement).checked : value,
                },
            }));
        };

        // Save handler uses separate qualifications state + majorSubjectsBuffer
        const handleSave = () => {
            if (!editFields.teacherInfo) {
                toast.error("Teacher info is required");
                return;
            }

            const parsedQualifications: TeacherQualificationInput[] = qualifications.map((q, index) => {
                const base = {
                    teacherInfoId: q.teacherInfoId,
                    degree: q.degree,
                    passingYear: q.passingYear,
                    institutionName: q.institutionName,
                    majorSubjects: (majorSubjectsBuffer[index] || "")
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                };
                return q.id ? { id: q.id, ...base } : base;  // preserve id if present
            });

            const payload: FacultyUpdatePayload = {
                firstName: editFields.firstName || undefined,
                lastName: editFields.lastName || undefined,
                department: editFields.department,
                role: editFields.role,
                address: editFields.address || undefined,
                city: editFields.city || undefined,
                country: editFields.country || undefined,
                teacherInfo: {
                    ...editFields.teacherInfo,
                    qualifications: parsedQualifications,
                },
            };

            mutation.mutate(payload);
        };


        // Qualification handlers update qualifications state (no longer inside editFields.teacherInfo)
        const updateQualification = (index: number, updated: TeacherQualification) => {
            setQualifications((prev) => {
                const updatedList = [...prev];
                updatedList[index] = updated;
                return updatedList;
            });
        };

        const removeQualification = (index: number) => {
            setQualifications((prev) => {
                const updatedList = [...prev];
                updatedList.splice(index, 1);
                return updatedList;
            });

            setMajorSubjectsBuffer((prev) => {
                const updated = [...prev];
                updated.splice(index, 1);
                return updated;
            });
        };

        const addQualification = () => {
            setQualifications((prev) => [
                ...prev,
                {
                    id: "",  // new qualification has no id yet
                    teacherInfoId: faculty?.teacherInfo?.id || "",
                    degree: DegreeEnum.BS, // use a valid enum default here
                    passingYear: new Date().getFullYear(),
                    institutionName: "",
                    majorSubjects: [],
                },
            ]);
            setMajorSubjectsBuffer((prev) => [...prev, ""]);
        };

        const handleDelete = async () => {
            if (!confirm("Are you sure you want to delete this faculty member?")) return;

            setIsSubmitting(true);
            try {
                const res = await deleteFacultyMember(facultyId);
                toast.success(res.message || "Faculty member deleted");
                queryClient.invalidateQueries({
                    queryKey: ['faculty'],
                });
                onDelete?.();
            } catch (err: any) {
                toast.error(err.message || "Failed to delete faculty member");
            } finally {
                setIsSubmitting(false);
            }
        };

        if (isLoading) return <TopCenterLoader />;
        if (isError || !faculty) return <InternalError />;

        return (
            <div className="px-4 max-w-4xl mx-auto">
                <Helmet>
                    <title>{GLOBAL_TITLE} - Faculty Management - Edit Faculty Profile</title>
                </Helmet>
                <h1 className="text-2xl font-semibold text-center mb-6">Faculty Profile</h1>

                {/* Avatar at top if admin */}
                {user?.role === AudienceEnum.Admin && (
                    <div className="flex justify-center mb-6">
                        <AvatarUpload 
                            avatarURL={faculty.avatarURL} 
                            targetUserId={facultyId} 
                        />
                    </div>
                )}

                {/* Form Fields centered */}
                <div className="flex justify-center">
                    <div className="w-full md:w-4/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="First Name"
                            name="firstName"
                            value={editFields.firstName || ""}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />

                        <Input
                            label="Last Name"
                            name="lastName"
                            value={editFields.lastName || ""}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />

                        <Input
                            label="City"
                            name="city"
                            value={editFields.city || ""}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />

                        <Input
                            label="Country"
                            name="country"
                            value={editFields.country || ""}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />

                        <SelectInput
                            label="Department"
                            name="department"
                            value={editFields.department || ""}
                            onChange={handleChange}
                            options={Object.values(DepartmentEnum).map((d) => ({
                                label: d,
                                value: d,
                            }))}
                            disabled={isSubmitting}
                        />

                        <SelectInput
                            label="Designation"
                            name="designation"
                            value={editFields.teacherInfo?.designation || ""}
                            onChange={handleTeacherInfoChange}
                            options={Object.values(TeacherDesignationEnum).map((d) => ({
                                label: d,
                                value: d,
                            }))}
                            disabled={isSubmitting}
                        />

                        <SelectInput
                            label="Faculty Type"
                            name="facultyType"
                            value={editFields.teacherInfo?.facultyType || ""}
                            onChange={handleTeacherInfoChange}
                            options={Object.values(FacultyTypeEnum).map((f) => ({
                                label: f,
                                value: f,
                            }))}
                            disabled={isSubmitting}
                        />

                        <ReadOnlyInput
                            label="Email"
                            value={faculty.email}

                        />

                        <div className="col-span-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-darkTextSecondary">
                                <input
                                    type="checkbox"
                                    name="subjectOwner"
                                    checked={editFields.teacherInfo?.subjectOwner || false}
                                    onChange={handleTeacherInfoChange}
                                    disabled={isSubmitting}
                                />
                                Subject Owner
                            </label>
                        </div>

                        <Input
                            label="Address"
                            name="address"
                            value={editFields.address || ""}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            className="col-span-2"
                        />

                    </div>
                </div>

                {/* Qualifications Section (unchanged layout) */}
                <div className="col-span-2 mt-8 border-t border-gray-200 dark:border-darkBorderLight pt-4">
                    <h2 className="text-lg font-semibold mb-2">Qualifications</h2>
                    {qualifications.map((q, index) => (
                        <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <SelectInput
                                label="Degree"
                                name={`degree-${index}`}
                                value={q.degree}
                                onChange={(e) =>
                                    updateQualification(index, { ...q, degree: e.target.value as DegreeEnum })
                                }
                                disabled={isSubmitting}
                                options={Object.values(DegreeEnum)}
                            />
                            <Input
                                label="Passing Year"
                                name={`passingYear-${index}`}
                                type="number"
                                value={q.passingYear.toString()}
                                onChange={(e) =>
                                    updateQualification(index, { ...q, passingYear: parseInt(e.target.value) || 0 })
                                }
                                disabled={isSubmitting}
                            />
                            <Input
                                label="Institution Name"
                                name={`institution-${index}`}
                                value={q.institutionName}
                                onChange={(e) =>
                                    updateQualification(index, { ...q, institutionName: e.target.value })
                                }
                                disabled={isSubmitting}
                            />
                            <Input
                                label="Major Subjects (comma-separated)"
                                name={`majors-${index}`}
                                value={majorSubjectsBuffer[index] || ""}
                                onChange={(e) => {
                                    const updated = [...majorSubjectsBuffer];
                                    updated[index] = e.target.value;
                                    setMajorSubjectsBuffer(updated);
                                }}
                                disabled={isSubmitting}
                            />
                            <div>
                                <button
                                    type="button"
                                    onClick={() => removeQualification(index)}
                                    className="w-full sm:w-auto text-red-500 hover:text-red-700 text-sm flex items-center justify-center border border-red-300 rounded px-2 py-1 mt-1 sm:mt-0"
                                    title="Remove qualification"
                                >
                                    <FiTrash2 className="mr-1" />
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addQualification}
                        className="text-blue-600 text-sm mt-2"
                    >
                        + Add Qualification
                    </button>
                </div>

                {/* Buttons */}
                <div className="mt-6 flex justify-center gap-4">
                    <Button disabled={mutation.isPending} size="md" variant="gray"
                        fullWidth={false}
                        onClick={handleSave}
                        loadingText="Saving..." isLoading={mutation.isPending}>
                        Save Changes
                    </Button>

                    <Button disabled={isSubmitting} size="md" variant="red"
                        fullWidth={false}
                        onClick={handleDelete}
                        loadingText="Deleting..." isLoading={isSubmitting}>
                        Delete Faculty
                    </Button>

                </div>
            </div>
        );
    };

export default FacultyProfile;
