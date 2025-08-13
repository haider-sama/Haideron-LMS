// import React from "react";
// import { FiEye } from "react-icons/fi";
// import { Course } from "../../../../../constants/lms/interfaces";

// interface Props {
//     course: Course;
//     onView: () => void;
//     onViewOutcomes?: () => void;
// }

// const CourseCard: React.FC<Props> = ({ 
//     course, 
//     onView,
//     // onViewOutcomes 
// }) => {
//     return (
//         <div className="bg-white dark:bg-darkSurface rounded-xl border border-gray-200 dark:border-darkBorderLight p-5 flex flex-col justify-between transition hover:shadow-md">
//             <div>
//                 {/* Title + Code */}
//                 <h3 className="text-base font-semibold text-gray-900 dark:text-darkTextPrimary mb-1">
//                     {course.code} – {course.title}
//                 </h3>
//                 <p className="text-xs text-gray-500 dark:text-darkTextMuted mb-3">{course.codePrefix}</p>

//                 {/* Badge Section */}
//                 <div className="flex flex-wrap gap-2 text-xs mb-3">
//                     <span className="bg-gray-100 dark:bg-darkMuted text-gray-800 dark:text-darkTextPrimary px-2 py-0.5 rounded-full">
//                         Level: {course.subjectLevel}
//                     </span>
//                     <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
//                         Type: {course.subjectType}
//                     </span>
//                     <span className="bg-green-100 dark:bg-emerald-900 text-green-700 dark:text-darkOnlineGreen px-2 py-0.5 rounded-full">
//                         Credits: {course.creditHours}
//                     </span>
//                     <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
//                         Contact: {course.contactHours} hrs
//                     </span>
//                     <span className="bg-purple-100 dark:bg-darkBlurple text-purple-700 dark:text-white px-2 py-0.5 rounded-full">
//                         {course.knowledgeArea}
//                     </span>
//                     <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full">
//                         Domain: {course.domain}
//                     </span>
//                 </div>

//                 {/* Prereq / Coreq */}
//                 <div className="text-sm text-gray-700 dark:text-darkTextSecondary space-y-1">
//                     {course.preRequisites.length > 0 && (
//                         <div>
//                             <span className="font-medium text-gray-800 dark:text-darkTextPrimary">Prerequisites:</span>{" "}
//                             {course.preRequisites.map((p: any) => `${p.code} - ${p.title}`).join(", ")}
//                         </div>
//                     )}
//                     {course.coRequisites.length > 0 && (
//                         <div>
//                             <span className="font-medium text-gray-800 dark:text-darkTextPrimary">Corequisites:</span>{" "}
//                             {course.coRequisites.map((c: any) => `${c.code} - ${c.title}`).join(", ")}
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {/* View Button */}
//             <div className="flex justify-end mt-4 gap-3">
//                 <button
//                     onClick={onView}
//                     className="flex items-center gap-1 text-sm text-blue-600 hover:text-white hover:bg-blue-400 dark:hover:bg-opacity-10 border border-gray-200 dark:border-darkBorderLight px-2 py-1 rounded-md transition"
//                     title="Edit Course"
//                 >
//                     <FiEye className="w-4 h-4" />
//                     Edit
//                 </button>

//                 {/* TODO: Add course outcomes view button */}
//                 {/* <button
//                     onClick={onViewOutcomes}
//                     className="flex items-center gap-1 text-sm text-purple-600 dark:text-darkBlurple hover:text-white hover:bg-purple-400 dark:hover:bg-opacity-10 border border-purple-600 dark:border-darkBlurple px-2 py-1 rounded-md transition"
//                     title="View Outcomes"
//                 >
//                     <FiEye className="w-4 h-4" />
//                     View Outcomes
//                 </button> */}
//             </div>
//         </div>

//     );
// };

// export default CourseCard;
