import { useState } from "react";
import { FiEdit3, FiPlus } from "react-icons/fi";
import AddPLOsForm from "./AddPLOsForm";
import AddPEOsForm from "./AddPEOsForm";
import Modal from "../../../ui/Modal";
import { ProgramById } from "../../../../constants/core/interfaces";
import { useToast } from "../../../../context/ToastContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../../ui/Button";
import EditPLOList from "./EditPLOList";
import EditPEOList from "./EditPEOList";

interface OutcomeManagementProps {
    programId: string | null;
    fetchProgram: (id: string) => Promise<{ program: ProgramById }>
}

const OutcomeManagement: React.FC<OutcomeManagementProps> = ({ programId, fetchProgram }) => {
    const [showAddPLOModal, setShowAddPLOModal] = useState(false);
    const [showAddPEOModal, setShowAddPEOModal] = useState(false);
    const [showEditPEOModal, setShowEditPEOModal] = useState(false);
    const [showEditPLOModal, setShowEditPLOModal] = useState(false);
    const toast = useToast();

    // Fetch single program
    const { data, isLoading, isError } = useQuery({
        queryKey: ['program', programId],
        enabled: !!programId,
        queryFn: async () => {
            if (!programId) throw new Error('Program ID is required');

            try {
                const data = await fetchProgram(programId); // use prop function
                return data;
            } catch (err: any) {
                toast.error(err.message || 'Failed to fetch program.');
                throw err; // re-throw so react-query knows the query failed
            }
        },
        retry: false,
    });

    return (
        <>
            {data?.program?.peos && data?.program.peos.length > 0 && (
                <div className="w-full max-w-4xl mx-auto mt-8 space-y-6">
                    <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-darkTextPrimary">
                        Program Educational Objectives (PEOs)
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-300 dark:border-darkBorderLight table-auto text-sm text-left">
                            <thead className="border-b border-gray-300 bg-gray-100 dark:bg-darkMuted text-gray-700 dark:text-darkTextMuted uppercase text-xs tracking-wide">
                                <tr>
                                    <th className="px-4 py-4">#</th>
                                    <th className="px-4 py-4">PEO Title</th>
                                    <th className="px-4 py-4">Description</th>
                                    <th className="px-4 py-4">Mapped PLOs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.program.peos.map((peo, index) => (
                                    <tr
                                        key={peo.id}
                                        className="border-b last:border-0 border-gray-200 dark:border-darkBorderLight hover:bg-gray-50 dark:hover:bg-darkMuted transition"
                                    >
                                        <td className="px-4 py-4 text-center font-semibold text-gray-700 dark:text-darkTextPrimary">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-4 font-medium text-gray-800 dark:text-darkTextPrimary">
                                            {peo.title}
                                        </td>
                                        <td className="px-4 py-4 text-gray-600 dark:text-darkTextMuted">
                                            {peo.description}
                                        </td>
                                        <td className="px-4 py-4">
                                            {peo.plos && peo.plos.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {peo.plos.map((plo) => (
                                                        <li key={plo.id} className="flex flex-wrap items-center gap-2 text-sm">
                                                            <span className="font-medium text-gray-800 dark:text-darkTextPrimary">
                                                                {plo.code}
                                                            </span>
                                                            <span className="text-gray-500 dark:text-darkTextMuted">– {plo.title}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="italic text-gray-500 dark:text-darkTextMuted">
                                                    No PLOs mapped
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="flex justify-center gap-4 mt-6">
                <div className="flex flex-wrap justify-center gap-2 mt-8">
                    <Button variant="gray" fullWidth={false}
                        onClick={() => setShowEditPEOModal(true)}>
                        Edit PEOs
                    </Button>
                    <Button variant="gray" fullWidth={false}
                        onClick={() => setShowEditPLOModal(true)}>
                        Edit PLOs
                    </Button>
                    <Button fullWidth={false}
                        onClick={() => setShowAddPLOModal(true)}>
                        Add PLO
                    </Button>
                    <Button fullWidth={false}
                        onClick={() => setShowAddPEOModal(true)}>
                        Add PEO
                    </Button>
                </div>
            </div>

            {showAddPLOModal && (
                <Modal isOpen={showAddPLOModal} onClose={() => setShowAddPLOModal(false)}>
                    <AddPLOsForm programId={programId} />
                </Modal>
            )}

            {showAddPEOModal && (
                <Modal isOpen={showAddPEOModal} onClose={() => setShowAddPEOModal(false)}>
                    <AddPEOsForm programId={programId} />
                </Modal>
            )}

            {showEditPEOModal && (
                <Modal isOpen={showEditPEOModal} onClose={() => setShowEditPEOModal(false)}>
                    <EditPEOList programId={programId ?? ""} />
                </Modal>
            )}

            {showEditPLOModal && (
                <Modal isOpen={showEditPLOModal} onClose={() => setShowEditPLOModal(false)}>
                    <EditPLOList programId={programId ?? ""} />
                </Modal>
            )}
        </>
    );
};

export default OutcomeManagement;
