import Select, { MultiValue, ActionMeta, StylesConfig } from "react-select";
import { useEffect, useState } from "react";

export const Input = ({
    label,
    name,
    value,
    onChange,
    placeholder,
    className = '',
}: {
    label?: string;
    name?: string;
    value?: string | number;
    required?: boolean;
    placeholder?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    disabled?: boolean;
    type?: string;
}) => (
    <div className={className}>
        <label className="block text-sm font-medium mb-1 text-primary dark:text-darkTextPrimary">
            {label}
        </label>
        <input
            type="text"
            name={name}
            value={value}
            required={false}
            placeholder={placeholder}
            onChange={onChange}
            disabled={false}
            className="w-full rounded-md px-2 py-1.5 text-sm transition-colors
      border border-gray-300 dark:border-darkBorderLight
      bg-white dark:bg-darkSurface
      text-gray-900 dark:text-darkTextPrimary
      placeholder-gray-400 dark:placeholder-darkTextMuted
      focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-darkBlurple"
        />
    </div>
);

export const ReadOnlyInput = ({
    label,
    value,
    type = "text",
    className = '',
}: {
    label?: string;
    value?: string | number | null;
    type?: string;
    className?: string;
}) => (
    <div className={className}>
        <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-darkTextSecondary">
            {label}
        </label>
        <input
            type={type}
            value={value ?? ''} // Handle null/undefined by falling back to ''
            readOnly
            className="w-full text-sm px-2 py-1.5 rounded-md cursor-not-allowed
      bg-gray-100 text-gray-800 border border-gray-300
      dark:bg-darkMuted dark:text-darkTextMuted dark:border-darkBorderLight"
        />
    </div>
);

interface SelectInputProps {
    label?: string;
    name?: string;
    value: string | number | null;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: string[] | { label: string; value: string | number }[];
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}

export const SelectInput: React.FC<SelectInputProps> = ({
    label,
    name,
    value,
    onChange,
    options,
    className = "",
    placeholder = "Select an option",
}) => {
    // Normalize string array to array of { label, value }
    const renderedOptions =
        typeof options[0] === "string"
            ? (options as string[]).map((val) => ({ label: val, value: val }))
            : (options as { label: string; value: string | number }[]);

    return (
        <div className={className}>
            <label className="block mb-1 text-sm font-medium text-gray-800 dark:text-darkTextSecondary">
                {label}
            </label>
            <select
                name={name}
                value={value ?? ""}
                onChange={onChange}
                disabled={false}
                className="w-full px-2 py-1.5 rounded-md
      bg-white text-gray-800 border border-gray-300
      dark:bg-darkMuted dark:text-darkTextSecondary dark:border-darkBorderLight"
            >
                <option value="" disabled>
                    {placeholder}
                </option>
                {renderedOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

interface TextAreaInputProps {
    name: string;
    label?: string;
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    disabled?: boolean;
    className?: string;
    rows?: number;
    cols?: number;
}

export const TextAreaInput: React.FC<TextAreaInputProps> = ({
    name,
    label,
    placeholder,
    value,
    onChange,
    disabled = false,
    className = "",
    rows,
    cols
}) => {
    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={name}
                    className="block mb-1 text-sm font-medium text-gray-800 dark:text-darkTextSecondary"
                >
                    {label}
                </label>
            )}
            <textarea
                id={name}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
                rows={rows}
                cols={cols}
                className={`w-full text-sm px-2 py-1.5 rounded-md border
      ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-darkSurface dark:text-darkTextMuted" : "bg-white text-gray-800 dark:bg-darkMuted dark:text-darkTextPrimary"}
      border-gray-300 dark:border-darkBorderLight
      ${className}`}
            />
        </div>

    );
};

export interface MultiSelectOption {
    label: string;
    value: string;
}

interface MultiSelectInputProps {
    label: string;
    options: MultiSelectOption[];
    value: MultiSelectOption[];
    onChange: (selected: MultiSelectOption[]) => void;
    onInputChange?: (value: string) => void;
}

export const MultiSelectInput: React.FC<MultiSelectInputProps> = ({
    label,
    options,
    value,
    onChange,
    onInputChange,
}) => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const theme = localStorage.getItem("theme");
            setIsDark(theme === "dark");
        }
    }, []);

    const handleChange = (
        newValue: MultiValue<MultiSelectOption>,
        _: ActionMeta<MultiSelectOption>
    ) => {
        onChange([...newValue]);
    };

    const customStyles: StylesConfig<MultiSelectOption> = {
        control: (styles, state) => ({
            ...styles,
            minHeight: "44px",
            backgroundColor: isDark ? "#313338" : "#ffffff",
            borderColor: isDark
                ? state.isFocused
                    ? "#9B5DE5"
                    : "#3F4248"
                : state.isFocused
                    ? "#7C3ACF"
                    : "#d1d5db",
            color: isDark ? "#FFFFFF" : "#111827",
            boxShadow: "none",
            "&:hover": {
                borderColor: isDark ? "#9B5DE5" : "#7C3ACF",
            },
        }),
        menu: (base) => ({
            ...base,
            zIndex: 9999,
            backgroundColor: isDark ? "#2B2D31" : "#ffffff",
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused
                ? isDark
                    ? "#3A3C41"
                    : "#e5e7eb"
                : isDark
                    ? "#2B2D31"
                    : "#ffffff",
            color: isDark ? "#FFFFFF" : "#111827",
            cursor: "pointer",
            "&:active": {
                backgroundColor: isDark ? "#7C3ACF" : "#d1d5db",
            },
        }),
        multiValue: (base) => ({
            ...base,
            backgroundColor: isDark ? "#3A3C41" : "#e5e7eb",
        }),
        multiValueLabel: (base) => ({
            ...base,
            color: isDark ? "#FFFFFF" : "#111827",
        }),
        multiValueRemove: (base) => ({
            ...base,
            color: isDark ? "#B5BAC1" : "#6B7280",
            ":hover": {
                backgroundColor: isDark ? "#7C3ACF" : "#d1d5db",
                color: isDark ? "#FFFFFF" : "#111827",
            },
        }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    };

    return (
        <div className="relative">
            <label className="block text-sm font-medium mb-1">{label}</label>
            <Select
                options={options}
                isMulti
                value={value}
                onChange={handleChange}
                styles={customStyles}
                className="text-sm"
                classNamePrefix="react-select"
                closeMenuOnSelect={false}
                hideSelectedOptions={false}
                menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                menuPosition="absolute"
                onInputChange={(val) => onInputChange?.(val)}
            />
        </div>
    );
};
