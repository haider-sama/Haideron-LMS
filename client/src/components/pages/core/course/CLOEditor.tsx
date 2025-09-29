import React from "react";
import { FiChevronUp, FiEdit3, FiTrash2 } from "react-icons/fi";
import { Input, SelectInput, TextAreaInput } from "../../../ui/Input";
import { StrengthEnum } from "../../../../../../server/src/shared/enums";
import { CLO, PLOMapping } from "../../../../shared/constants/core/interfaces";

interface CLOEditorProps {
    clos: CLO[];
    expandedCLOs: number[];
    setExpandedCLOs: (indices: number[]) => void;
    addCLO: () => void;
    removeCLO: (index: number) => void;
    handleCLOChange: (index: number, field: keyof CLO, value: any) => void;
    handlePLOMapChange: (cloIndex: number, mapIndex: number, field: keyof PLOMapping, value: any) => void;
    addPLOMap: (cloIndex: number) => void;
    removePLOMap: (cloIndex: number, mapIndex: number) => void;
    ploOptions: { label: string; value: string }[];
}

const CLOEditor: React.FC<CLOEditorProps> = ({
    clos,
    expandedCLOs,
    setExpandedCLOs,
    addCLO,
    removeCLO,
    handleCLOChange,
    handlePLOMapChange,
    addPLOMap,
    removePLOMap,
    ploOptions,
}) => {
    return (
        <div>
            <h2 className="text-2xl font-semibold text-center pt-8">Edit Course Learning Outcomes (CLOs)</h2>
            <button type="button" onClick={addCLO} className="text-blue-600 hover:underline text-sm">
                + Add CLO
            </button>

            <div className="overflow-x-auto border border-gray-300 rounded-sm shadow-sm bg-white dark:bg-darkSurface dark:border-darkBorderLight mt-4">
                <table className="min-w-full text-left">
                    <thead className="bg-gray-100 border-b border-gray-300 text-gray-700 dark:bg-darkMuted dark:text-darkTextMuted uppercase text-xs tracking-wider">
                        <tr>
                            <th className="px-4 py-2 w-1/5">CLO</th>
                            <th className="px-4 py-2">Title</th>
                            <th className="px-4 py-2 hidden md:table-cell">Description</th>
                            <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clos.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-6 text-gray-500 dark:text-darkTextMuted">
                                    No CLOs defined.
                                </td>
                            </tr>
                        ) : (
                            clos.map((clo, ci) => {
                                const isExpanded = expandedCLOs.includes(ci);
                                return (
                                    <React.Fragment key={ci}>
                                        {/* Display Row */}
                                        <tr className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-darkMuted transition border-gray-200 dark:border-darkBorderLight">
                                            <td className="px-4 py-2 font-medium text-gray-900 dark:text-darkTextPrimary whitespace-nowrap">
                                                {clo.code || `CLO ${ci + 1}`}
                                            </td>
                                            <td className="px-4 py-2 text-gray-700 dark:text-darkTextSecondary">{clo.title || "-"}</td>
                                            <td className="px-4 py-2 hidden md:table-cell text-gray-600 dark:text-darkTextMuted text-sm">
                                                {clo.description ? clo.description.slice(0, 80) + (clo.description.length > 80 ? "..." : "") : "-"}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <div className="flex justify-center items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setExpandedCLOs(
                                                                isExpanded ? expandedCLOs.filter((i) => i !== ci) : [...expandedCLOs, ci]
                                                            )
                                                        }
                                                        className="text-blue-600 hover:text-blue-800 dark:text-darkBlurple dark:hover:text-darkBlurpleHover transition"
                                                        title={isExpanded ? "Collapse" : "Edit CLO"}
                                                    >
                                                        {isExpanded ? <FiChevronUp size={16} /> : <FiEdit3 size={16} />}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeCLO(ci)}
                                                        className="text-red-600 hover:text-red-800 transition"
                                                        title="Delete CLO"
                                                    >
                                                        <FiTrash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Editable Row */}
                                        {isExpanded && (
                                            <tr className="bg-gray-50 dark:bg-darkSurface border-b dark:border-darkBorderLight">
                                                <td colSpan={4} className="p-6">
                                                    <div className="space-y-4">
                                                        <SelectInput
                                                            label="CLO Code"
                                                            value={clo.code}
                                                            onChange={(e) => handleCLOChange(ci, "code", e.target.value)}
                                                            options={Array.from({ length: 10 }, (_, i) => ({ label: `CLO${i + 1}`, value: `CLO${i + 1}` }))}
                                                        />
                                                        <Input label="CLO Title" value={clo.title} onChange={(e) => handleCLOChange(ci, "title", e.target.value)} />
                                                        <TextAreaInput
                                                            label="CLO Description"
                                                            rows={3}
                                                            value={clo.description}
                                                            onChange={(e) => handleCLOChange(ci, "description", e.target.value)}
                                                            name=""
                                                        />

                                                        {/* PLO Mapping */}
                                                        <div className="space-y-2">
                                                            <p className="font-medium text-gray-700 dark:text-darkTextPrimary">PLO Mappings:</p>
                                                            {(clo.ploMappings || []).map((m, mi) => (
                                                                <div key={mi} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                                                                    <SelectInput
                                                                        label="Select PLO"
                                                                        value={m.ploId}
                                                                        onChange={(e) => handlePLOMapChange(ci, mi, "ploId", e.target.value)}
                                                                        options={ploOptions}
                                                                    />
                                                                    <SelectInput
                                                                        label="Strength"
                                                                        value={m.strength}
                                                                        onChange={(e) => handlePLOMapChange(ci, mi, "strength", e.target.value)}
                                                                        options={Object.values(StrengthEnum)}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        className="text-red-600 hover:text-red-800 mt-1 sm:mt-6"
                                                                        onClick={() => removePLOMap(ci, mi)}
                                                                        title="Remove PLO Mapping"
                                                                    >
                                                                        <FiTrash2 className="w-5 h-5" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button type="button" onClick={() => addPLOMap(ci)} className="text-sm text-blue-600 hover:underline mt-2">
                                                                + Add PLO Mapping
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CLOEditor;
