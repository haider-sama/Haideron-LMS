// import React from "react";
// import { CourseGrade } from "../../../../../constants/lms/intelligence-inter-types";

// interface CourseGradesTableProps {
//     courseGrades: CourseGrade[];
// }

// const gradeColors: Record<string, string> = {
//     "A+": "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
//     "A": "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
//     "A-": "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",

//     "B+": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
//     "B": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
//     "B-": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",

//     "C+": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
//     "C": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
//     "C-": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",

//     "D+": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
//     "D": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",

//     "F": "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",

//     "I": "bg-gray-200 text-gray-800 dark:bg-darkMuted dark:text-darkTextSecondary", // Custom colors
// };

// export const CourseGradesTable: React.FC<CourseGradesTableProps> = ({ courseGrades }) => {
//     return (
//         <div className="rounded-xl shadow-md border border-gray-200 dark:border-darkBorderLight overflow-y-auto">
//             <div className="overflow-x-auto max-h-96 overflow-y-auto">
//                 <table className="w-full table-auto text-sm text-left text-gray-800 dark:text-darkTextSecondary">
//                     <thead className="text-gray-700 dark:text-darkTextMuted border-b border-gray-200 dark:border-darkBorderLight uppercase text-xs tracking-wide sticky top-0 z-10">
//                         <tr className="bg-gray-100 dark:bg-darkMuted">
//                             <th className="px-4 py-2 font-semibold">Course</th>
//                             <th className="px-4 py-2 text-center font-semibold">Section</th>
//                             <th className="px-4 py-2 text-center font-semibold">Percentage</th>
//                             <th className="px-4 py-2 text-center font-semibold">GPA</th>
//                             <th className="px-4 py-2 text-center font-semibold">Grade</th>
//                         </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-200 dark:divide-darkBorderLight">
//                         {courseGrades.map((course, idx) => (
//                             <tr
//                                 key={`${course.courseCode}-${course.section}-${idx}`}
//                                 className="border-b hover:bg-gray-50 transition dark:border-darkBorderLight dark:hover:bg-darkMuted"
//                             >
//                                 <td className="px-4 py-2 whitespace-nowrap">
//                                     <div className="font-medium text-gray-600 dark:text-darkTextSecondary">
//                                         {course.courseCode} - {course.courseTitle}
//                                     </div>
//                                 </td>
//                                 <td className="px-4 py-2 text-center dark:text-darkTextSecondary">
//                                     {course.section}
//                                 </td>
//                                 <td className="px-4 py-2 text-center dark:text-darkTextSecondary">
//                                     {course.percentage !== undefined ? `${course.percentage.toFixed(1)}%` : "—"}
//                                 </td>
//                                 <td className="px-4 py-2 text-center dark:text-darkTextSecondary">
//                                     {course.gpa !== undefined ? course.gpa.toFixed(2) : "—"}
//                                 </td>
//                                 <td className="px-4 py-2 text-center">
//                                     <span
//                                         className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${gradeColors[course.grade] ||
//                                             "bg-gray-200 text-gray-800 dark:bg-darkMuted dark:text-darkTextSecondary"
//                                             }`}
//                                     >
//                                         {course.grade}
//                                     </span>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>
//         </div>

//     );
// };
