import React from "react";
import { Button } from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";

export interface CSVUploadProps {
    isOpen: boolean;
    onClose: () => void;
    handleCSVUpload: (file: File) => void;
    isSubmitting: boolean;
    modalTitle?: string;
    modalDescription?: string;
    infoList?: React.ReactNode[];
    onConfirm?: () => void;
}

export const CSVUpload: React.FC<CSVUploadProps> = ({
    isOpen,
    onClose,
    handleCSVUpload,
    isSubmitting,
    modalTitle = "Upload CSV",
    modalDescription = "Upload a properly formatted CSV file.",
    infoList = [],
    onConfirm,
}) => {
    const [file, setFile] = React.useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleConfirm = () => {
        if (file) {
            handleCSVUpload(file); // pass file to parent
        }
        if (onConfirm) onConfirm();
        onClose();
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose}>
                <div className="space-y-6">
                    {/* Title */}
                    <h2 className="text-lg font-semibold text-gray-800">
                        {modalTitle}
                    </h2>

                    {/* Description */}
                    {modalDescription && (
                        <p className="text-sm text-gray-500">
                            {modalDescription}
                        </p>
                    )}

                    {/* File Input */}
                    <div>
                        <label
                            htmlFor="csv-upload"
                            className="block mb-2 text-sm font-medium text-gray-700"
                        >
                            CSV File
                        </label>
                        <input
                            type="file"
                            id="csv-upload"
                            accept=".csv,text/csv"
                            onChange={handleFileChange}
                            disabled={isSubmitting}
                            className="w-full px-4 py-2 border rounded-md text-sm 
                         border-gray-300 bg-white"
                        />
                    </div>

                    {/* Info List */}
                    {infoList.length > 0 && (
                        <ul className="text-gray-500 text-sm space-y-1 list-disc list-inside">
                            {infoList.map((item, idx) => (
                                <li key={idx}>{item}</li>
                            ))}
                        </ul>
                    )}

                    {/* Footer */}
                    <div className="flex justify-center space-x-2 pt-4">
                        <Button onClick={onClose} variant="light" size="md" fullWidth={false}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            variant="green"
                            size="md"
                            fullWidth={false}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Uploading..." : "Upload"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
