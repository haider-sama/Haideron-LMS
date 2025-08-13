import React, { useEffect, useState } from "react";
import { usePermissions } from "../../../../hooks/usePermissions";
import { useToast } from "../../../../context/ToastContext";
import { DepartmentEnum, FacultyTypeEnum, TeacherDesignationEnum } from "../../../../../../server/src/shared/enums";
import { registerFacultyMember } from "../../../../api/core/faculty/faculty-api";
import { Helmet } from "react-helmet-async";
import { GLOBAL_TITLE } from "../../../../constants";
import { Input, ReadOnlyInput, SelectInput } from "../../../ui/Input";

import DatePicker from "react-datepicker";
import { Button } from "../../../ui/Button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FacultyRegisterPayload } from "../../../../constants/core/interfaces";

type RegisterFacultyFormProps = {
    onSuccess?: () => void;
};

const RegisterFacultyForm: React.FC<RegisterFacultyFormProps> = ({ onSuccess }) => {
    const { user, isLoggedIn, isAdmin, isDepartmentHead } = usePermissions();
    const [_, setErrors] = useState<{ [key: string]: string[] }>({});
    const toast = useToast();
    const queryClient = useQueryClient();

    const [form, setForm] = useState({
        email: "",
        password: "",
        department: DepartmentEnum.CSE,
        teacherInfo: {
            designation: TeacherDesignationEnum.Lecturer,
            joiningDate: null as Date | null,
            facultyType: FacultyTypeEnum.Permanent,
            subjectOwner: false,
        },
    });

    useEffect(() => {
        if (isDepartmentHead && user?.department) {
            setForm(prev => ({
                ...prev,
                department: user.department as DepartmentEnum,
            }));
        }
    }, [isDepartmentHead, user?.department]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const target = e.target;
        const { name, value, type } = target;

        if (name in form.teacherInfo) {
            if (type === "checkbox" && target instanceof HTMLInputElement) {
                setForm({
                    ...form,
                    teacherInfo: {
                        ...form.teacherInfo,
                        [name]: target.checked,
                    },
                });
            } else {
                setForm({
                    ...form,
                    teacherInfo: {
                        ...form.teacherInfo,
                        [name]: value,
                    },
                });
            }
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const mutation = useMutation({
        mutationFn: (payload: FacultyRegisterPayload) => registerFacultyMember(payload),
        onSuccess: () => {
            toast.success("Faculty member registered successfully.");
            onSuccess?.();
            setForm({
                email: "",
                password: "",
                department: DepartmentEnum.CSE,
                teacherInfo: {
                    designation: TeacherDesignationEnum.Lecturer,
                    joiningDate: null,
                    facultyType: FacultyTypeEnum.Permanent,
                    subjectOwner: false,
                },
            });
            setErrors({});


            // Invalidate all faculty queries to refetch updated list
            queryClient.invalidateQueries({
                queryKey: ['faculty'],
            });
        },
        onError: (err: any) => {
            if (err.errors && typeof err.errors === "object") {
                Object.values(err.errors).forEach((messages) => {
                    if (Array.isArray(messages)) {
                        messages.forEach((msg: string) => toast.error(msg));
                    }
                });
            } else {
                toast.error(err.message || "Registration failed.");
            }
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!isLoggedIn) {
            toast.error("You must be logged in.");
            return;
        }

        if (!form.teacherInfo.joiningDate) {
            toast.error("Please select a joining date.");
            return;
        }

        setErrors({});
        mutation.mutate(form);
    };

    return (
        <div className="flex justify-center items-center px-4">
            <Helmet>
                <title>{GLOBAL_TITLE} - Faculty Management - Add Faculty</title>
            </Helmet>
            <div className="w-full max-w-md p-6 space-y-6">
                <h2 className="text-2xl font-semibold text-center text-primary">Register Faculty Member</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        disabled={mutation.isPending}
                    />

                    <Input
                        label="Password"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        disabled={mutation.isPending}
                    />

                    {isAdmin ? (
                        <SelectInput
                            label="Department"
                            name="department"
                            value={form.department}
                            onChange={handleChange}
                            options={Object.values(DepartmentEnum)}
                            disabled={mutation.isPending}
                        />
                    ) : isDepartmentHead ? (
                        <ReadOnlyInput
                            label="Department"
                            value={user?.department ?? "N/A"}
                        />
                    ) : null}

                    <SelectInput
                        label="Designation"
                        name="designation"
                        value={form.teacherInfo.designation}
                        onChange={handleChange}
                        options={Object.values(TeacherDesignationEnum)}
                        disabled={mutation.isPending}
                    />

                    <SelectInput
                        label="Faculty Type"
                        name="facultyType"
                        value={form.teacherInfo.facultyType}
                        onChange={handleChange}
                        options={Object.values(FacultyTypeEnum)}
                        disabled={mutation.isPending}
                    />

                    <div className="w-full max-w-xl">
                        <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-darkTextSecondary">
                            Joining Date
                        </label>
                        <DatePicker
                            selected={form.teacherInfo.joiningDate}
                            onChange={(date: Date | null) =>
                                setForm((prev) => ({
                                    ...prev,
                                    teacherInfo: {
                                        ...prev.teacherInfo,
                                        joiningDate: date,
                                    },
                                }))
                            }
                            dateFormat="yyyy-MM-dd"
                            placeholderText="Select joining date"
                            disabled={mutation.isPending}
                            className="w-full p-2 rounded border border-gray-300 dark:border-darkBorderLight bg-white dark:bg-darkSurface text-gray-900 dark:text-darkTextPrimary focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-darkBlurple transition"
                            wrapperClassName="w-full"
                            maxDate={new Date()}
                        />
                    </div>

                    <div className="flex items-center space-x-2 dark:text-darkTextSecondary">
                        <input
                            type="checkbox"
                            name="subjectOwner"
                            checked={form.teacherInfo.subjectOwner}
                            onChange={handleChange}
                            disabled={mutation.isPending}
                        />
                        <label htmlFor="subjectOwner" className="text-sm">
                            Is Subject Owner?
                        </label>
                    </div>

                    <Button disabled={mutation.isPending} size="md" variant="green"
                        loadingText="Registering..." isLoading={mutation.isPending}>
                        Register Faculty
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default RegisterFacultyForm;
