import { FiEdit3, FiTrash2 } from "react-icons/fi";
import React from "react";
import { CourseOffering, ScheduleSlot } from "../../../../shared/constants/core/interfaces";

interface SemesterCourseOfferingsProps {
    semesterId: string;
    offerings: CourseOffering[];
    editingOfferingId: string | null;
    offeringEditValues: Record<string, any>;
    setEditingOfferingId: React.Dispatch<React.SetStateAction<string | null>>;
    setOfferingEditValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    handleScheduleChange: (
        offeringId: string,
        section: string,
        index: number,
        field: keyof ScheduleSlot,
        value: string
    ) => void;
    handleAddSlot: (offeringId: string, section: string) => void;
    handleRemoveSlot: (offeringId: string, section: string, index: number) => void;
    updateOfferingMutation: any;
    deleteOfferingMutation: any;
}

const SemesterCourseSectionArray = ["A", "B", "C", "D", "E"];
const WeekDayArray = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const SemesterCourseOfferings: React.FC<SemesterCourseOfferingsProps> = ({
    semesterId,
    offerings,
    editingOfferingId,
    offeringEditValues,
    setEditingOfferingId,
    setOfferingEditValues,
    handleScheduleChange,
    handleAddSlot,
    handleRemoveSlot,
    updateOfferingMutation,
    deleteOfferingMutation,
}) => {
    return (
        <div className="border p-3 rounded bg-white dark:bg-darkSurface shadow-sm dark:border-darkBorderLight">
            <h4 className="font-medium mb-2 text-gray-800 dark:text-white">Offered Courses</h4>

            {!offerings ? (
                <p className="text-sm text-gray-500 dark:text-darkTextMuted">Loading courses...</p>
            ) : offerings.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-darkTextMuted">No courses offered yet.</p>
            ) : (
                <ul className="space-y-2">
                    {offerings.map((offering) => {
                        const course = offering.course;
                        if (!course || typeof course !== "object") return null;

                        const isEditing = editingOfferingId === offering.id;
                        const values = offeringEditValues[offering.id] || {};

                        return (
                            <li
                                key={offering.id}
                                className="text-sm flex items-start justify-between gap-2"
                            >
                                <div className="flex-1">
                                    <strong className="text-gray-900 dark:text-white">{course.code ?? "No Code"}</strong>{" "}
                                    <span className="text-gray-700 dark:text-gray-300">— {course.title ?? "No Title"}</span>

                                    {isEditing ? (
                                        <div className="mt-2 space-y-3 text-sm">
                                            {/* Capacity Inputs */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-gray-700 dark:text-gray-200">Capacity Per Section</label>
                                                {(values?.activeSections ?? []).map((section: string) => (
                                                    <div key={section} className="flex items-center gap-2">
                                                        <span className="w-6 text-xs font-medium text-gray-700 dark:text-gray-300">
                                                            Sec {section}
                                                        </span>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={
                                                                values?.capacityPerSection?.[section] ??
                                                                offering.capacityPerSection?.[section] ??
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                setOfferingEditValues((prev) => ({
                                                                    ...prev,
                                                                    [offering.id]: {
                                                                        ...prev[offering.id],
                                                                        capacityPerSection: {
                                                                            ...offering.capacityPerSection,
                                                                            ...prev[offering.id]?.capacityPerSection,
                                                                            [section]: Number(e.target.value),
                                                                        },
                                                                    },
                                                                }))
                                                            }
                                                            className="border px-2 py-1 rounded w-24 text-sm bg-white dark:bg-darkMuted text-gray-900 dark:text-white border-gray-300 dark:border-darkBorderLight placeholder-gray-400 dark:placeholder-darkTextMuted"
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Active Toggle */}
                                            <div className="flex items-center gap-2 mt-2">
                                                <input
                                                    type="checkbox"
                                                    id={`isActive-${offering.id}`}
                                                    checked={values?.isActive ?? offering.isActive}
                                                    onChange={(e) =>
                                                        setOfferingEditValues((prev) => ({
                                                            ...prev,
                                                            [offering.id]: {
                                                                ...prev[offering.id],
                                                                isActive: e.target.checked,
                                                            },
                                                        }))
                                                    }
                                                />
                                                <label htmlFor={`isActive-${offering.id}`} className="text-xs text-gray-700 dark:text-gray-300">
                                                    Is Active
                                                </label>
                                            </div>

                                            <div className="mt-2 flex flex-col gap-1 max-w-xs">
                                                <label className="text-xs font-medium text-gray-700 dark:text-gray-200">
                                                    Add Section
                                                </label>
                                                <select
                                                    className="text-xs border px-2 py-1 rounded bg-white dark:bg-darkMuted text-gray-900 dark:text-white border-gray-300 dark:border-darkBorderLight"
                                                    onChange={(e) => {
                                                        const section = e.target.value;
                                                        if (!section) return;
                                                        setOfferingEditValues((prev) => {
                                                            const current = prev[offering.id];
                                                            return {
                                                                ...prev,
                                                                [offering.id]: {
                                                                    ...current,
                                                                    activeSections: [...(current.activeSections ?? []), section],
                                                                    capacityPerSection: {
                                                                        ...current.capacityPerSection,
                                                                        [section]: "",
                                                                    },
                                                                    sectionSchedules: {
                                                                        ...current.sectionSchedules,
                                                                        [section]: [],
                                                                    },
                                                                },
                                                            };
                                                        });
                                                    }}
                                                    value=""
                                                >
                                                    <option value="" disabled>Select Section</option>
                                                    {SemesterCourseSectionArray.filter((s) => !(values?.activeSections ?? []).includes(s))
                                                        .map((section) => (
                                                            <option key={section} value={section}>
                                                                {section}
                                                            </option>
                                                        ))
                                                    }
                                                </select>
                                            </div>

                                            {/* Section Schedules */}
                                            <div className="space-y-2 mt-2">
                                                <label className="text-xs font-medium text-gray-700 dark:text-gray-200">Section Schedules</label>
                                                {(values?.activeSections ?? []).map((section: string) => (
                                                    <div key={section} className="border rounded p-2 dark:border-darkBorderLight dark:bg-darkMuted">
                                                        <div className="font-medium text-xs mb-1 text-gray-800 dark:text-white">
                                                            Section {section}
                                                        </div>

                                                        {(values?.sectionSchedules?.[section] ?? []).map(
                                                            (slot: ScheduleSlot, index: number) => (
                                                                <div key={index} className="flex items-center gap-2 mb-1">
                                                                    <select
                                                                        className="text-xs border px-1 py-0.5 rounded bg-white dark:bg-darkMuted text-gray-900 dark:text-white border-gray-300 dark:border-darkBorderLight"
                                                                        value={slot.day}
                                                                        onChange={(e) =>
                                                                            handleScheduleChange(
                                                                                offering.id,
                                                                                section,
                                                                                index,
                                                                                "day",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                    >
                                                                        {WeekDayArray.map((day) => (
                                                                            <option key={day} value={day}>
                                                                                {day}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <input
                                                                        type="time"
                                                                        className="text-xs border px-1 py-0.5 rounded bg-white dark:bg-darkMuted text-gray-900 dark:text-white border-gray-300 dark:border-darkBorderLight"
                                                                        value={slot.startTime}
                                                                        onChange={(e) =>
                                                                            handleScheduleChange(
                                                                                offering.id,
                                                                                section,
                                                                                index,
                                                                                "startTime",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                    />
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400">to</span>
                                                                    <input
                                                                        type="time"
                                                                        className="text-xs border px-1 py-0.5 rounded bg-white dark:bg-darkMuted text-gray-900 dark:text-white border-gray-300 dark:border-darkBorderLight"
                                                                        value={slot.endTime}
                                                                        onChange={(e) =>
                                                                            handleScheduleChange(
                                                                                offering.id,
                                                                                section,
                                                                                index,
                                                                                "endTime",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                    />
                                                                    <button
                                                                        onClick={() =>
                                                                            handleRemoveSlot(offering.id, section, index)
                                                                        }
                                                                        className="text-xs text-red-500 hover:text-red-700"
                                                                    >
                                                                        <FiTrash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            )
                                                        )}
                                                        <div className="flex gap-4 mt-2">
                                                            <button
                                                                onClick={() => handleAddSlot(offering.id, section)}
                                                                className="text-xs text-blue-500 hover:text-blue-700"
                                                            >
                                                                + Add Slot
                                                            </button>
                                                            <button
                                                                className="text-xs text-red-500 hover:text-red-700"
                                                                onClick={() =>
                                                                    setOfferingEditValues((prev) => {
                                                                        const current = prev[offering.id];
                                                                        const newActive = current.activeSections.filter((s: string) => s !== section);
                                                                        const { [section]: _, ...remainingCap } = current.capacityPerSection ?? {};
                                                                        const { [section]: __, ...remainingSchedules } = current.sectionSchedules ?? {};
                                                                        return {
                                                                            ...prev,
                                                                            [offering.id]: {
                                                                                ...current,
                                                                                activeSections: newActive,
                                                                                capacityPerSection: remainingCap,
                                                                                sectionSchedules: remainingSchedules,
                                                                            },
                                                                        };
                                                                    })
                                                                }
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Save / Cancel */}
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button
                                                    className="text-green-600 hover:text-green-800 text-xs dark:text-green-400 dark:hover:text-green-300"
                                                    onClick={() => {
                                                        const activeSections = values?.activeSections ?? [];
                                                        const capacityPerSection = Object.fromEntries(
                                                            activeSections.map((section: string) => [section, values.capacityPerSection?.[section]])
                                                        );
                                                        const sectionSchedules = Object.fromEntries(
                                                            activeSections.map((section: string) => [section, values.sectionSchedules?.[section] ?? []])
                                                        );

                                                        const payload = {
                                                            capacityPerSection,
                                                            isActive: values?.isActive,
                                                            sectionSchedules,
                                                        };
                                                        updateOfferingMutation.mutate({
                                                            offeringId: offering.id,
                                                            payload,
                                                            semesterId,
                                                        });
                                                    }}
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    className="text-gray-500 hover:text-gray-700 text-xs dark:text-gray-400 dark:hover:text-gray-300"
                                                    onClick={() => setEditingOfferingId(null)}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {offering.capacityPerSection &&
                                                Object.keys(offering.capacityPerSection).length > 0 && (
                                                    <div className="mt-1 text-gray-500 dark:text-gray-400 text-xs">
                                                        Capacity:{" "}
                                                        {Object.entries(offering.capacityPerSection)
                                                            .map(([section, cap]) => `${section}: ${cap}`)
                                                            .join(", ")}
                                                    </div>
                                                )}

                                            <div className="text-xs text-gray-400 dark:text-gray-500">
                                                {offering.isActive ? "Active" : "Inactive"}
                                            </div>

                                            <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                                {SemesterCourseSectionArray.map((section) => {
                                                    const slots = offering.sectionSchedules?.[section];
                                                    if (!slots || slots.length === 0) return null;
                                                    return (
                                                        <div key={section}>
                                                            <strong className="dark:text-gray-200">Section {section}:</strong>{" "}
                                                            {slots.map((slot: ScheduleSlot) => `${slot.day} ${slot.startTime}–${slot.endTime}`).join(", ")}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex gap-1">
                                    <button
                                        onClick={() => {
                                            setOfferingEditValues((prev) => {
                                                const existingSections = Object.keys(offering.capacityPerSection ?? {});
                                                return {
                                                    ...prev,
                                                    [offering.id]: {
                                                        capacityPerSection: offering.capacityPerSection,
                                                        isActive: offering.isActive,
                                                        sectionSchedules: offering.sectionSchedules,
                                                        activeSections: existingSections.length > 0 ? existingSections : ["A"],
                                                    },
                                                };
                                            });
                                            setEditingOfferingId(offering.id);
                                        }}
                                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                        title="Edit offering"
                                    >
                                        <FiEdit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() =>
                                            deleteOfferingMutation.mutate({
                                                offeringId: offering.id,
                                                semesterId,
                                            })
                                        }
                                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                        title="Remove offering"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>

    );
};
