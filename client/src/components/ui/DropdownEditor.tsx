import { motion } from "framer-motion";
import { Button } from "./Button";
import React from "react";

interface DropdownEditorProps {
    tempValue: string | number;
    setTempValue: (value: string) => void;
    onCancel: () => void;
    onSave: () => void;
    type?: "text" | "number" | "email" | "password";
    children?: React.ReactNode; // allows overriding default <input>
}

export const DropdownEditor: React.FC<DropdownEditorProps> = ({
    tempValue,
    setTempValue,
    onCancel,
    onSave,
    type = "text",
    children,
}) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            onSave();
        }
        if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 mt-1 w-48 p-3 bg-white
                 border border-gray-300 shadow-sm"
        >
            {children ? (
                React.cloneElement(children as React.ReactElement<any>, {
                    onKeyDown: handleKeyDown,
                })
            ) : (
                <input
                    type={type}
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="w-full p-2 text-sm border rounded-md"
                />
            )}

            <div className="mt-2 flex justify-end space-x-2">
                <Button onClick={onCancel} size="sm" variant="light">
                    Cancel
                </Button>
                <Button onClick={onSave} size="sm" variant="green">
                    Save
                </Button>
            </div>
        </motion.div>
    );
};

