import Select, { MultiValue, ActionMeta, StylesConfig } from "react-select";
import { useEffect, useRef, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { BsChevronDown } from "react-icons/bs";

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

interface SelectInputOption {
    label: string;
    value: string | number;
    action?: () => void; // optional action for each option
}

interface SelectInputProps {
    label?: string;
    name?: string;
    value: string | number | null;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: string[] | SelectInputOption[];
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
    disabled = false,
}) => {
    const renderedOptions: SelectInputOption[] =
        typeof options[0] === "string"
            ? (options as string[]).map((val) => ({ label: val, value: val }))
            : (options as SelectInputOption[]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(e); // still pass to parent
        const selected = renderedOptions.find(
            (opt) => opt.value.toString() === e.target.value
        );
        if (selected?.action) {
            selected.action();
        }
    };

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block mb-1 text-sm font-medium text-gray-800">
                    {label}
                </label>
            )}

            <div className="relative">
                <select
                    name={name}
                    value={value ?? ""}
                    onChange={handleChange}
                    disabled={disabled}
                    className="
                        w-full appearance-none px-4 py-2 pr-8 rounded-md
                        bg-white text-gray-800 border border-gray-300
                        focus:outline-none focus:ring-1 focus:ring-gray-200
                        disabled:bg-gray-100 disabled:text-gray-400" 
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

                {/* Chevron */}
                <span className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <BsChevronDown className="h-4 w-4 text-gray-400" />
                </span>
            </div>
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
