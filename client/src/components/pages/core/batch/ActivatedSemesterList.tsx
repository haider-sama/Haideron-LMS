import { FiEdit3, FiTrash2, FiChevronUp, FiCheckCircle } from "react-icons/fi";
import DatePicker from "react-datepicker";
import React from "react";
import { useSemesterManagement } from "../../../../hooks/core/useActivatedSemesterManagement";
import TopCenterLoader from "../../../ui/TopCenterLoader";
import { MultiSelectInput, SelectInput } from "../../../ui/Input";
import { TermEnum } from "../../../../../../server/src/shared/enums";
import { SemesterCourseOfferings } from "./SemesterCourseOfferings";
import { Button } from "../../../ui/Button";

interface ActivatedSemesterListProps {
    batchId: string;
}

const SEMESTER_NUMBERS = Array.from({ length: 8 }, (_, i) => i + 1);

const ActivatedSemesterList: React.FC<ActivatedSemesterListProps> = ({ batchId }) => {
    const {
        semesters,
        isLoading,
        expandedId,
        editValues,
        courseOptions,
        selectedCourses,
        semesterOfferings,
        editingOfferingId,
        offeringEditValues,
        setEditValues,
        setSelectedCourses,
        setEditingOfferingId,
        setOfferingEditValues,
        handleToggle,
        handleUpdate,
        handleComplete,
        handleDelete,
        handleCreateCourseOfferings,
        handleScheduleChange,
        handleAddSlot,
        handleRemoveSlot,
        courseOfferingMutation,
        updateMutation,
        deleteOfferingMutation,
        updateOfferingMutation
    } = useSemesterManagement(batchId);

    return (
        <div className="pt-16 space-y-6">
            <h3 className="text-xl font-semibold text-center">Activated Semesters</h3>

            {isLoading ? (
                <TopCenterLoader />
            ) : (
                <div className="overflow-x-auto border border-gray-300 rounded-sm shadow-sm bg-white dark:bg-darkSurface dark:border-darkBorderLight">
                    <table className="min-w-full text-left">
                        <thead className="bg-gray-100 border-b border-gray-300 text-gray-700 dark:bg-darkMuted dark:border-darkBorderLight dark:text-darkTextMuted uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-4 py-2">Semester</th>
                                <th className="px-4 py-2 text-center">Status</th>
                                <th className="px-4 py-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {semesters.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="text-center py-6 text-gray-500 dark:text-darkTextMuted">
                                        No semesters found.
                                    </td>
                                </tr>
                            ) : (
                                semesters.map((sem) => {
                                    const isExpanded = expandedId === sem.id;
                                    return (
                                        <React.Fragment key={sem.id}>
                                            <tr className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-darkMuted transition border-gray-200 dark:border-darkBorderLight">
                                                <td className="px-4 py-2 font-medium text-gray-900 dark:text-darkTextPrimary">
                                                    Semester {sem.semesterNo} - {sem.term}
                                                </td>
                                                <td className="px-4 py-2 text-center text-sm">
                                                    {sem.isActive ? (
                                                        <span className="text-green-600 font-medium">Active</span>
                                                    ) : (
                                                        <span className="text-gray-500">Inactive</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button
                                                            title="Edit semester"
                                                            onClick={() => handleToggle(sem)}
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                            {isExpanded ? <FiChevronUp /> : <FiEdit3 />}
                                                        </button>
                                                        <button
                                                            title="Delete semester"
                                                            onClick={() => handleDelete(sem.id)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                        <button
                                                            title="Mark semester complete"
                                                            onClick={() => handleComplete(sem.id)}
                                                            className="text-green-600 hover:text-green-800"
                                                        >
                                                            <FiCheckCircle />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {isExpanded && editValues && (
                                                <tr className="bg-gray-50 dark:bg-darkSurface">
                                                    <td colSpan={3} className="p-6">
                                                        <div className="space-y-4">
                                                            <SelectInput
                                                                label="Term"
                                                                name="term"
                                                                value={editValues.term || TermEnum.Fall}
                                                                onChange={(e) =>
                                                                    setEditValues((prev) => ({
                                                                        ...prev!,
                                                                        term: e.target.value as TermEnum,
                                                                    }))
                                                                }
                                                                options={Object.values(TermEnum)}
                                                            />

                                                            <SelectInput
                                                                label="Semester No"
                                                                name="semesterNo"
                                                                value={String(editValues.semesterNo || 1)}
                                                                onChange={(e) =>
                                                                    setEditValues((prev) => ({
                                                                        ...prev!,
                                                                        semesterNo: Number(e.target.value),
                                                                    }))
                                                                }
                                                                options={SEMESTER_NUMBERS.map((n) => ({
                                                                    label: `Semester ${n}`,
                                                                    value: String(n),
                                                                }))}
                                                            />

                                                            <div>
                                                                <label className="block text-sm font-medium mb-1">Start Date</label>
                                                                <DatePicker
                                                                    selected={editValues.startedAt ? new Date(editValues.startedAt) : null}
                                                                    onChange={(date) =>
                                                                        setEditValues((prev) => ({
                                                                            ...prev!,
                                                                            startedAt: date?.toISOString(),
                                                                        }))
                                                                    }
                                                                    className="border px-3 py-2 rounded w-full bg-white dark:bg-darkMuted text-gray-900 dark:text-white border-gray-300 dark:border-darkBorderLight placeholder-gray-400 dark:placeholder-darkTextMuted"
                                                                    dateFormat="yyyy-MM-dd"
                                                                    placeholderText="Select start date"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium mb-1">End Date</label>
                                                                <DatePicker
                                                                    selected={editValues.endedAt ? new Date(editValues.endedAt) : null}
                                                                    onChange={(date) =>
                                                                        setEditValues((prev) => ({
                                                                            ...prev!,
                                                                            endedAt: date?.toISOString(),
                                                                        }))
                                                                    }
                                                                    className="border px-3 py-2 rounded w-full bg-white dark:bg-darkMuted text-gray-900 dark:text-white border-gray-300 dark:border-darkBorderLight placeholder-gray-400 dark:placeholder-darkTextMuted"
                                                                    dateFormat="yyyy-MM-dd"
                                                                    placeholderText="Select end date"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium mb-1">Enrollment Deadline</label>
                                                                <DatePicker
                                                                    selected={editValues.enrollmentDeadline ? new Date(editValues.enrollmentDeadline) : null}
                                                                    onChange={(date) =>
                                                                        setEditValues((prev) => ({
                                                                            ...prev!,
                                                                            enrollmentDeadline: date?.toISOString(),
                                                                        }))
                                                                    }
                                                                    className="border px-3 py-2 rounded w-full bg-white dark:bg-darkMuted text-gray-900 dark:text-white border-gray-300 dark:border-darkBorderLight placeholder-gray-400 dark:placeholder-darkTextMuted"
                                                                    dateFormat="yyyy-MM-dd"
                                                                    placeholderText="Select enrollment deadline"
                                                                />
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={editValues.isActive || false}
                                                                    onChange={(e) =>
                                                                        setEditValues((prev) => ({
                                                                            ...prev!,
                                                                            isActive: e.target.checked,
                                                                        }))
                                                                    }
                                                                    id={`isActive-${sem.id}`}
                                                                />
                                                                <label htmlFor={`isActive-${sem.id}`}>Is Active</label>
                                                            </div>

                                                            <SemesterCourseOfferings
                                                                semesterId={sem.id}
                                                                offerings={semesterOfferings[sem.id]}
                                                                editingOfferingId={editingOfferingId}
                                                                offeringEditValues={offeringEditValues}
                                                                setEditingOfferingId={setEditingOfferingId}
                                                                setOfferingEditValues={setOfferingEditValues}
                                                                handleScheduleChange={handleScheduleChange}
                                                                handleAddSlot={handleAddSlot}
                                                                handleRemoveSlot={handleRemoveSlot}
                                                                updateOfferingMutation={updateOfferingMutation}
                                                                deleteOfferingMutation={deleteOfferingMutation}
                                                            />

                                                            <div>
                                                                <label className="block text-sm font-medium mb-1">Offer Courses</label>
                                                                <MultiSelectInput
                                                                    label="Select Courses to Offer"
                                                                    options={
                                                                        (courseOptions[sem.id] || []).filter(
                                                                            (option) =>
                                                                                !semesterOfferings[sem.id]?.some(
                                                                                    (offering) => offering.course?.id === option.value
                                                                                )
                                                                        )
                                                                    }
                                                                    value={selectedCourses[sem.id] || []}
                                                                    onChange={(selected) =>
                                                                        setSelectedCourses((prev) => ({
                                                                            ...prev,
                                                                            [sem.id]: selected,
                                                                        }))
                                                                    }
                                                                />
                                                            </div>

                                                            <div className="flex items-center justify-between mt-6">
                                                                <Button
                                                                    onClick={handleUpdate}
                                                                    isLoading={updateMutation.isPending}
                                                                    loadingText="Saving..."
                                                                    disabled={updateMutation.isPending}
                                                                    fullWidth={false}
                                                                    variant="gray"
                                                                >
                                                                    Save Changes
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleCreateCourseOfferings(sem.id)}
                                                                    isLoading={courseOfferingMutation.isPending}
                                                                    loadingText="Creating..."
                                                                    disabled={courseOfferingMutation.isPending}
                                                                    fullWidth={false}
                                                                    variant="green"
                                                                >
                                                                    Create Offerings
                                                                </Button>
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
            )}
        </div>

    );
};

export default ActivatedSemesterList;
