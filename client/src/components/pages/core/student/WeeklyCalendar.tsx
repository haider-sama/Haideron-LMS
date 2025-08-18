// import React from "react";
// import clsx from "clsx";
// import { ActivatedSemester, EnrolledCourse } from "../../../../constants/core/interfaces";
// import { SelectInput } from "../../../ui/Input";

// const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
// const hours = Array.from({ length: 11 }, (_, i) => i + 7); // 7am to 5pm (7 to 17)

// const dayToIndex: Record<string, number> = {
//     Monday: 0,
//     Tuesday: 1,
//     Wednesday: 2,
//     Thursday: 3,
//     Friday: 4,
//     Saturday: 5,
//     Sunday: 6,
// };

// interface WeeklyCalendarProps {
//     enrolledCourses: EnrolledCourse[];
//     activatedSemesters: ActivatedSemester[];
//     selectedSemester: ActivatedSemester | null;
//     setSelectedSemester: (semester: ActivatedSemester) => void;
// }

// export function WeeklyCalendar({
//     enrolledCourses,
//     activatedSemesters,
//     selectedSemester,
//     setSelectedSemester,
// }: WeeklyCalendarProps) {
//     const filteredCourses = enrolledCourses.filter(
//         (enr) => enr.courseOffering.activatedSemester === selectedSemester?.id
//     );

//     const schedule = filteredCourses.flatMap((enr) => {
//         const course = enr.courseOffering.course;
//         const section = enr.section;
//         const title = `${course.title} (${course.code})`;

//         const slots = Array.isArray(enr.courseOffering.sectionSchedules)
//             ? enr.courseOffering.sectionSchedules
//             : enr.courseOffering.sectionSchedules?.[section] || [];

//         return slots.map((slot, idx) => ({
//             id: `${enr.id}-${idx}`,
//             title,
//             location: `Sec ${section}`,
//             day: dayToIndex[slot.day],
//             start: slot.startTime,
//             end: slot.endTime,
//         }));
//     });

//     return (
//         <div>
//             <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-lg font-semibold text-gray-700 dark:text-darkTextPrimary">Weekly Schedule</h2>

//                 <div className="flex items-center gap-4">
//                     <div className="w-64">
//                         <SelectInput
//                             name="semester"
//                             value={selectedSemester?.id || ""}
//                             onChange={(e) => {
//                                 const found = activatedSemesters.find((s) => s.id === e.target.value);
//                                 if (found) setSelectedSemester(found);
//                             }}
//                             options={activatedSemesters
//                                 .filter((s) => s.isActive)
//                                 .map((sem) => ({
//                                     value: sem.id,
//                                     label: `Semester ${sem.semesterNo} - ${sem.term}`,
//                                 }))
//                             }
//                         />
//                     </div>

//                     <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-darkTextSecondary">
//                         <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                         </svg>
//                         <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
//                     </div>
//                 </div>
//             </div>

//             <div className="overflow-x-auto">
//                 <div className="grid grid-cols-[80px_repeat(7,1fr)] border border-gray-300 dark:border-darkBorderLight rounded-xl shadow-md bg-white dark:bg-darkSurface overflow-hidden">
//                     {/* Time cell */}
//                     <div className="bg-gray-100 dark:bg-darkMuted p-2 text-sm font-semibold text-center border-r border-b border-t-0 border-gray-300 dark:border-darkBorderLight text-gray-700 dark:text-darkTextSecondary">
//                         Time
//                     </div>

//                     {days.map((day, dayIdx) => (
//                         <div
//                             key={day}
//                             className={clsx(
//                                 "bg-gray-100 dark:bg-darkMuted p-2 text-sm font-semibold text-center border-r border-b border-t-0 border-gray-300 dark:border-darkBorderLight text-gray-700 dark:text-darkTextPrimary",
//                                 dayIdx === days.length - 1 && "border-r-0"
//                             )}
//                         >
//                             {day}
//                         </div>
//                     ))}

//                     {/* Grid */}
//                     {hours.map((hour, hourIdx) => (
//                         <React.Fragment key={hour}>
//                             <div
//                                 className={clsx(
//                                     "text-xs text-gray-600 dark:text-darkTextMuted text-right pr-2 border-r border-b border-gray-200 dark:border-darkBorderLight h-20 pt-2",
//                                     hourIdx === hours.length - 1 && "border-b-0"
//                                 )}
//                             >
//                                 {`${hour}:00`}
//                             </div>

//                             {days.map((_, dayIdx) => (
//                                 <div
//                                     key={dayIdx + "-" + hour}
//                                     className={clsx(
//                                         "relative border-r border-b border-gray-200 dark:border-darkBorderLight h-20",
//                                         dayIdx === days.length - 1 && "border-r-0",
//                                         hourIdx === hours.length - 1 && "border-b-0"
//                                     )}
//                                 >
//                                     {schedule
//                                         .filter((s) => s.day === dayIdx)
//                                         .map((s) => {
//                                             const [sh, sm] = s.start.split(":").map(Number);
//                                             const [eh, em] = s.end.split(":").map(Number);
//                                             const startHour = sh + sm / 60;
//                                             const endHour = eh + em / 60;

//                                             if (startHour >= hour && startHour < hour + 1) {
//                                                 const topPercent = ((startHour - hour) * 100).toFixed(2) + "%";
//                                                 const heightPercent = ((endHour - startHour) * 100).toFixed(2) + "%";

//                                                 return (
//                                                     <div
//                                                         key={s.id}
//                                                         className={clsx(
//                                                             "absolute left-1 right-1 rounded-lg text-gray-600 dark:text-white text-xs px-2 py-1 shadow-md",
//                                                             "bg-gray-200 hover:bg-gray-300 dark:bg-darkBlurple dark:hover:bg-darkBlurpleHover transition-colors",
//                                                             "group"
//                                                         )}
//                                                         style={{
//                                                             top: topPercent,
//                                                             height: heightPercent,
//                                                         }}
//                                                     >
//                                                         <div className="font-medium truncate">{s.title}</div>
//                                                         {s.location && <div className="text-[10px]">{s.location}</div>}
//                                                         <div className="text-[10px]">{s.start} - {s.end}</div>

//                                                         {/* Tooltip */}
//                                                         <div className="absolute z-50 bottom-full mb-1 left-1/2 -translate-x-1/2 w-max max-w-xs px-3 py-2 bg-gray-600 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-pre-line">
//                                                             <div className="font-semibold">{s.title}</div>
//                                                             {s.location && <div className="text-gray-300">{s.location}</div>}
//                                                             <div className="text-gray-400">{s.start} - {s.end}</div>
//                                                         </div>
//                                                     </div>
//                                                 );
//                                             }
//                                             return null;
//                                         })}
//                                 </div>
//                             ))}
//                         </React.Fragment>
//                     ))}

//                 </div>
//             </div>
//         </div>
//     );
// }
