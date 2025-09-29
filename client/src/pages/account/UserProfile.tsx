import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '../../../../server/src/shared/interfaces';
import AvatarUpload from '../../features/auth/components/account/AvatarUpload';
import { AudienceEnum, DepartmentEnum } from '../../../../server/src/shared/enums';
import { getButtonClass } from '../../components/ui/ButtonClass';
import InternalError from '../forbidden/InternalError';
import { useToast } from '../../shared/context/ToastContext';
import { Input, ReadOnlyInput, SelectInput } from '../../components/ui/Input';
import TopCenterLoader from '../../components/ui/TopCenterLoader';
import { PublicUser } from '../../shared/constants/core/interfaces';

interface UserProfileProps {
    userId: string;
    fetchUser: (id: string) => Promise<PublicUser>;
    updateUser: (id: string, data: Partial<User>) => Promise<any>;
}

const UserProfile = ({ userId, fetchUser, updateUser }: UserProfileProps) => {
    const queryClient = useQueryClient();
    const [user, setUser] = useState<Partial<User> | null>(null);
    const toast = useToast();
    const [editFields, setEditFields] = useState<Partial<User>>({
        firstName: '',
        lastName: '',
        fatherName: '',
        email: '',
        department: undefined,
        role: undefined,
        address: '',
        city: '',
        country: '',
    });

    const query = useQuery<Partial<User>, Error>({
        queryKey: ['userProfile', userId],
        queryFn: () => fetchUser(userId),
        enabled: !!userId,
        retry: false,
    });

    const { data, isSuccess, isError, error, isLoading } = query;

    useEffect(() => {
        if (isSuccess && data) {
            setUser(data);
            setEditFields({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                fatherName: data.fatherName || '',
                email: data.email || '',
                department: data.department || DepartmentEnum.NA,
                role: data.role || AudienceEnum.Guest,
                address: data.address || '',
                city: data.city || '',
                country: data.country || '',
            });
        }
    }, [isSuccess, data]);

    useEffect(() => {
        if (isError && error instanceof Error) {
            toast.error(error.message || 'Failed to fetch user profile.');
        }
    }, [isError, error]);


    const mutation = useMutation({
        mutationFn: (updatedData: Partial<User>) => updateUser(userId, updatedData),
        onSuccess: () => {
            toast.success('User Profile updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
        },
        onError: async (error: any) => {
            try {
                const res = error.body ?? (await error.response?.json?.());

                if (res?.errors) {
                    for (const [, messages] of Object.entries(res.errors)) {
                        (messages as string[]).forEach((msg) => {
                            toast.error(msg);
                        });
                    }
                } else {
                    toast.error(res?.message || 'Failed to update profile.');
                }
            } catch {
                toast.error(error.message || 'Failed to update profile.');
            }
        },
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditFields((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        mutation.mutate(editFields);
    };

    const isFormChanged =
        user &&
        Object.keys(editFields).some(
            (key) => editFields[key as keyof User] !== (user as any)[key]
        );

    if (isLoading) return <TopCenterLoader />;
    if (isError) return <InternalError />;

    return (
        <div className="flex justify-center px-4">
            <div className="w-full max-w-4xl bg-white dark:bg-darkSurface rounded-md shadow-sm">
                <h1 className="text-2xl font-bold mb-8 text-center text-gray-900 dark:text-darkTextPrimary">
                    Edit User Details
                </h1>

                {user ? (
                    <>
                        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
                            <div className="w-full max-w-[160px] flex justify-center">
                                <AvatarUpload 
                                    avatarURL={user.avatarURL}
                                    targetUserId={userId}
                                />
                            </div>

                            {/* Inputs */}
                            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* First Name */}
                                <Input
                                    label="First Name"
                                    name="firstName"
                                    value={editFields.firstName || ""}
                                    onChange={handleChange}
                                />
                                <Input
                                    label="Last Name"
                                    name="lastName"
                                    value={editFields.lastName || ""}
                                    onChange={handleChange}
                                />
                                <Input
                                    label="Father Name"
                                    name="fatherName"
                                    value={editFields.fatherName || ""}
                                    onChange={handleChange}
                                />
                                <Input
                                    label="City"
                                    name="city"
                                    value={editFields.city || ""}
                                    onChange={handleChange}
                                />
                                <Input
                                    label="Country"
                                    name="country"
                                    value={editFields.country || ""}
                                    onChange={handleChange}
                                />

                                <ReadOnlyInput
                                    label="Email"
                                    value={user.email || ""}
                                    className="sm:col-span-2"
                                />

                                <SelectInput
                                    label="Department"
                                    name="department"
                                    value={editFields.department ?? ""}
                                    onChange={(e) =>
                                        setEditFields((prev) => ({
                                            ...prev,
                                            department: e.target.value as User["department"],
                                        }))
                                    }
                                    options={Object.values(DepartmentEnum)}
                                    placeholder="Select Department"
                                />

                                <SelectInput
                                    label="Role"
                                    name="role"
                                    value={editFields.role ?? ""}
                                    onChange={(e) =>
                                        setEditFields((prev) => ({
                                            ...prev,
                                            role: e.target.value as User["role"],
                                        }))
                                    }
                                    options={Object.values(AudienceEnum).map((role) => ({
                                        value: role,
                                        label: role.charAt(0).toUpperCase() + role.slice(1),
                                    }))}
                                    placeholder="Select Role"
                                />

                                <Input
                                    label="Address"
                                    name="address"
                                    value={editFields.address || ""}
                                    onChange={handleChange}
                                    className="sm:col-span-2"
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                            {/* Save Button */}
                            <div className="w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={!isFormChanged || mutation.isPending}
                                    className={getButtonClass({
                                        bg: isFormChanged || mutation.isPending
                                            ? "bg-primary dark:bg-darkBlurple"
                                            : "bg-gray-400 dark:bg-darkMuted cursor-not-allowed",
                                        hoverBg: isFormChanged || mutation.isPending
                                            ? "hover:bg-white dark:hover:bg-darkSurface"
                                            : "",
                                        text: "text-white",
                                        hoverText: isFormChanged || mutation.isPending
                                            ? "hover:text-gray-800 dark:hover:text-white"
                                            : "",
                                        extra:
                                            "w-full text-sm px-4 py-2 transition-all duration-200 font-medium rounded border border-gray-200 dark:border-darkBorderLight",
                                    })}
                                >
                                    {mutation.isPending ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="text-center text-gray-500">No user data available.</p>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
