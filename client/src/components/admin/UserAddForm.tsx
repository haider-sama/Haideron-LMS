import React from "react";
import { AudienceEnum, DepartmentEnum } from "../../../../server/src/shared/enums";
import { FiTrash2 } from "react-icons/fi";
import { Input, SelectInput } from "../ui/Input";
import { BulkUser } from "../../constants/core/interfaces";
import { RoleOption } from "../../constants";


type UserAddFormProps = {
    user: BulkUser;
    index: number;
    onChange: (index: number, field: keyof BulkUser, value: string) => void;
    onRemove: (index: number) => void;
    canRemove: boolean;
    disabled?: boolean;  // <-- NEW
    availableRoles?: RoleOption[];
};

const UserAddForm: React.FC<UserAddFormProps> = ({
    user,
    index,
    onChange,
    onRemove,
    canRemove,
    disabled = false, // default to false
    availableRoles = Object.values(AudienceEnum), // default to all roles if not passed
}) => {
    return (
        <div
            className={`grid grid-cols-1 md:grid-cols-4 gap-2 mb-6 p-4
      bg-gray-100 dark:bg-darkMuted/40
      border border-gray-200 dark:border-darkBorderLight
      rounded-lg shadow-sm
      ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        >
            {/* Email & Password */}
            <Input
                label="Email"
                name="email"
                value={user.email}
                placeholder="Email"
                onChange={(e) => onChange(index, "email", e.target.value)}
                className=""
                disabled={disabled}
            />
            <Input
                label="Password"
                name="password"
                value={user.password}
                placeholder="Password"
                onChange={(e) => onChange(index, "password", e.target.value)}
                type="password"
                className=""
                disabled={disabled}
            />

            {/* Name Fields */}
            <Input
                label="First Name"
                name="firstName"
                value={user.firstName}
                placeholder="First Name"
                onChange={(e) => onChange(index, "firstName", e.target.value)}
                className=""
                disabled={disabled}
            />
            <Input
                label="Last Name"
                name="lastName"
                value={user.lastName}
                placeholder="Last Name"
                onChange={(e) => onChange(index, "lastName", e.target.value)}
                className=""
                disabled={disabled}
            />
            <Input
                label="Father's Name"
                name="fatherName"
                value={user.fatherName}
                placeholder="Father's Name"
                onChange={(e) => onChange(index, "fatherName", e.target.value)}
                className=""
                disabled={disabled}
            />

            {/* Address Fields */}
            <Input
                label="City"
                name="city"
                value={user.city}
                placeholder="City"
                onChange={(e) => onChange(index, "city", e.target.value)}
                className=""
                disabled={disabled}
            />
            <Input
                label="Country"
                name="country"
                value={user.country}
                placeholder="Country"
                onChange={(e) => onChange(index, "country", e.target.value)}
                className=""
                disabled={disabled}
            />

            {/* Role & Department */}
            <SelectInput
                label="Role"
                name="role"
                value={user.role}
                onChange={(e) => onChange(index, "role", e.target.value)}
                options={availableRoles}
                disabled={disabled}
            />
            <SelectInput
                label="Department"
                name="department"
                value={user.department}
                onChange={(e) => onChange(index, "department", e.target.value)}
                options={Object.values(DepartmentEnum)}
                disabled={disabled}
            />

            <Input
                label="Address"
                name="address"
                value={user.address}
                placeholder="Full Address"
                onChange={(e) => onChange(index, "address", e.target.value)}
                className="md:col-span-2"
                disabled={disabled}
            />

            {/* Remove Button */}
            {canRemove && (
                <button
                    onClick={() => onRemove(index)}
                    className="text-red-400 hover:text-red-600 transition-colors col-span-full flex items-center gap-2 text-sm"
                    aria-label="Remove user"
                    title="Remove user"
                    disabled={disabled}
                >
                    <FiTrash2 size={16} />
                    Remove User
                </button>
            )}
        </div>
    );
};

export default UserAddForm;
