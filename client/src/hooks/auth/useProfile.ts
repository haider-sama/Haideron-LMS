import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../usePermissions';
import { updateUserProfile } from '../../api/auth/user-api';
import { UserType } from '../../../../server/src/shared/types';
import { DegreeEnum } from '../../../../server/src/shared/enums';
import { TeacherQualification } from '../../constants/core/interfaces';

export const useProfile = () => {
    const { user, isAdmin, isDepartmentHead, isDepartmentTeacher } = usePermissions();
    const queryClient = useQueryClient();
    const toast = useToast();

    const canEditProfile = isAdmin || isDepartmentHead || isDepartmentTeacher;
    const canEditBasicFields = isAdmin || isDepartmentHead;
    const canEditTeacherInfo = isDepartmentTeacher;

    const [editFields, setEditFields] = useState(() => ({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        fatherName: user?.fatherName || '',
        city: user?.city || '',
        country: user?.country || '',
        address: user?.address || '',
        teacherInfo: isDepartmentTeacher
            ? {
                qualifications: user?.teacherInfo?.qualifications || [],
            }
            : undefined,
    }));

    const [majorSubjectsBuffer, setMajorSubjectsBuffer] = useState<string[]>(
        user?.teacherInfo?.qualifications?.map(q => q.majorSubjects.join(', ')) || []
    );

    useEffect(() => {
        if (!user) return;

        setEditFields({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            fatherName: user.fatherName || '',
            city: user.city || '',
            country: user.country || '',
            address: user.address || '',
            teacherInfo: user.teacherInfo
                ? { qualifications: user.teacherInfo.qualifications || [] }
                : undefined,
        });

        setMajorSubjectsBuffer(
            user.teacherInfo?.qualifications?.map(q => q.majorSubjects.join(', ')) || []
        );
    }, [user]);

    const handleChange = (field: keyof typeof editFields, value: string) => {
        setEditFields(prev => ({ ...prev, [field]: value }));
    };

    const mutation = useMutation({
        mutationFn: (updatedData: Partial<UserType>) => updateUserProfile(updatedData),
        onSuccess: () => {
            toast.success('Profile updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['validateToken'] });
        },
        onError: (error: any) => {
            const firstField = Object.keys(error?.errors || {})[0];
            const firstMsg = error?.errors?.[firstField]?.[0];

            if (firstMsg) toast.error(firstMsg);
            else toast.error(error?.message || 'Failed to update profile.');
        },
    });

    const updateQualification = (index: number, updated: TeacherQualification) => {
        setEditFields(prev => {
            const list = [...(prev.teacherInfo?.qualifications || [])];
            list[index] = updated;

            return {
                ...prev,
                teacherInfo: {
                    ...prev.teacherInfo!,
                    qualifications: list,
                },
            };
        });
    };

    const removeQualification = (index: number) => {
        setEditFields(prev => {
            const list = [...(prev.teacherInfo?.qualifications || [])];
            list.splice(index, 1);

            return {
                ...prev,
                teacherInfo: {
                    ...prev.teacherInfo!,
                    qualifications: list,
                },
            };
        });

        setMajorSubjectsBuffer(prev => {
            const list = [...prev];
            list.splice(index, 1);
            return list;
        });
    };

    const addQualification = () => {
        setEditFields(prev => ({
            ...prev,
            teacherInfo: {
                ...prev.teacherInfo!,
                qualifications: [
                    ...(prev.teacherInfo?.qualifications || []),
                    {
                        degree: DegreeEnum.BS,
                        institutionName: '',
                        passingYear: new Date().getFullYear(),
                        majorSubjects: [],
                    },
                ],
            },
        }));

        setMajorSubjectsBuffer(prev => [...prev, '']);
    };

    const handleSave = () => {
        if (!user?._id) {
            toast.error('User ID is not available.');
            return;
        }

        const payload: Partial<UserType> = {};

        // Only include basic profile fields if the user has permission
        if (canEditBasicFields) {
            payload.firstName = editFields.firstName;
            payload.lastName = editFields.lastName;
            payload.fatherName = editFields.fatherName;
            payload.city = editFields.city;
            payload.country = editFields.country;
            payload.address = editFields.address;
        }

        // Only include teacherInfo if allowed
        if (canEditTeacherInfo && editFields.teacherInfo) {
            const parsedQualifications = editFields.teacherInfo.qualifications.map((q, index) => ({
                ...q,
                majorSubjects: (majorSubjectsBuffer[index] || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
            }));

            payload.teacherInfo = {
                qualifications: parsedQualifications,
            } as any;
        }

        mutation.mutate(payload);
    };

    const isFormChanged = useMemo(() => {
        if (!user) return false;

        const personalChanged =
            user.firstName !== editFields.firstName ||
            user.lastName !== editFields.lastName ||
            user.fatherName !== editFields.fatherName ||
            user.city !== editFields.city ||
            user.country !== editFields.country ||
            user.address !== editFields.address;

        const qualificationsChanged =
            JSON.stringify(user.teacherInfo?.qualifications || []) !==
            JSON.stringify(editFields.teacherInfo?.qualifications || []);

        return personalChanged || qualificationsChanged;
    }, [user, editFields]);

    return {
        user,
        editFields,
        setEditFields,
        majorSubjectsBuffer,
        setMajorSubjectsBuffer,
        handleChange,
        handleSave,
        isFormChanged,
        isSaving: mutation.isPending,
        canEditProfile,
        canEditBasicFields,
        canEditTeacherInfo,
        updateQualification,
        removeQualification,
        addQualification,
    };
};
