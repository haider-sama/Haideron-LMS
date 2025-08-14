// import { useState } from "react";
// import { useMutation, useQuery, useQueryClient } from "react-query";
// import { FiTrash2, FiPlus } from "react-icons/fi";
// import { MultiSelectInput, MultiSelectOption } from "../../../../account/Input";
// import { getCoursesInSemester, updateSemester } from "../../../../../api/lms/faculty/semesterApi";
// import { Course, Semester } from "../../../../../constants/lms/interfaces";
// import { useToast } from "../../../../../context/ToastContext";
// import TopCenterLoader from "../../../../ui/TopCenterLoader";
// import { getButtonClass } from "../../../../ui/ButtonClass";

// interface Props {
//     semester: Semester;
//     allCourses: Course[];
//     catalogueId: string;
// }

// const CourseList: React.FC<Props> = ({ semester, allCourses, catalogueId }) => {
//     const toast = useToast();
//     const queryClient = useQueryClient();
//     const [selectedCourseIds, setSelectedCourseIds] = useState<MultiSelectOption[]>([]);
//     const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

//     const { data: courses, isLoading } = useQuery(
//         ["courses", semester._id],
//         () => getCoursesInSemester({ semesterId: semester._id }).then(res => res.courses)
//     );

//     const mutation = useMutation<
//         { message: string; semester: Semester },
//         unknown,
//         string[]
//     >(
//         ["updateSemester", semester._id],
//         (updatedCourses) => updateSemester(semester._id, { courses: updatedCourses }),
//         {
//             onSuccess: () => {
//                 toast.success("Semester updated");
//                 queryClient.invalidateQueries(["courses", semester._id]);
//                 queryClient.invalidateQueries(["semesters", catalogueId]);
//             },
//             onError: (err: any) => {
//                 if (err.fieldErrors) {
//                     const fieldErrors = err.fieldErrors as Record<string, string[]>;
//                     for (const messages of Object.values(fieldErrors)) {
//                         messages.forEach(msg => toast.error(msg));
//                     }
//                 } else {
//                     toast.error(err.message || "Failed to update semester");
//                 }
//             },
//         }
//     );

//     const handleAddCourse = () => {
//         const existingIds = semester.courses.map(c =>
//             typeof c === "string" ? c : (c as any)._id
//         );

//         const newIds = selectedCourseIds
//             .map(opt => opt.value)
//             .filter(id => !existingIds.includes(id));

//         if (newIds.length === 0) {
//             toast.error("Please select at least one new course");
//             return;
//         }

//         mutation.mutate([...existingIds, ...newIds]);
//         setSelectedCourseIds([]);
//     };

//     const handleRemove = async (courseId: string) => {
//         setDeletingCourseId(courseId);
//         const updatedCourses = semester.courses
//             .map(c => (typeof c === "string" ? c : (c as any)._id))
//             .filter(id => id !== courseId);
//         await mutation.mutateAsync(updatedCourses);
//         setDeletingCourseId(null);
//     };

//     if (isLoading) return <TopCenterLoader />;

//     return (
//         <div className="space-y-2">
//             {courses && courses.length > 0 ? (
//                 courses.map((course: Course) => (
//                     <div
//                         key={course._id}
//                         className="flex justify-between items-center bg-gray-100 dark:bg-darkMuted border border-gray-200 dark:border-darkBorderLight px-4 py-2 rounded"
//                     >
//                         <p className="text-sm font-medium text-gray-800 dark:text-darkTextPrimary">
//                             {course.code}
//                             {course.subjectType === "Lab" ? "L" : ""} - {course.title}
//                         </p>
//                         <button
//                             onClick={() => handleRemove(course._id)}
//                             disabled={deletingCourseId === course._id}
//                             className={`flex items-center gap-1 px-2 py-1 text-sm rounded ${deletingCourseId === course._id
//                                 ? "bg-red-300 text-white cursor-not-allowed dark:bg-red-500"
//                                 : "text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
//                                 }`}
//                         >
//                             <FiTrash2 className="inline" />
//                             {deletingCourseId === course._id ? "Deleting..." : "Remove"}
//                         </button>
//                     </div>
//                 ))
//             ) : (
//                 <p className="text-sm py-2 text-gray-500 dark:text-darkTextMuted">
//                     No courses found. Add one below.
//                 </p>
//             )}

//             <div className="flex gap-2 mt-4">
//                 <div className="w-80">
//                     <MultiSelectInput
//                         label="Add Courses"
//                         options={allCourses.map(c => ({
//                             label: `${c.code} - ${c.title}`,
//                             value: c._id,
//                         }))}
//                         value={selectedCourseIds}
//                         onChange={setSelectedCourseIds}
//                     />
//                 </div>
//                 <div className="self-end">
//                     <button
//                         onClick={handleAddCourse}
//                         className={getButtonClass({
//                             bg: "bg-blue-400",
//                             hoverBg: "hover:bg-white dark:hover:bg-darkSurface",
//                             text: "text-white",
//                             hoverText: "hover:text-gray-900 dark:hover:text-darkTextPrimary",
//                             focusRing: "focus:ring-4 focus:ring-blue-200 dark:focus:ring-darkBorderLight",
//                             extra: "px-4 py-2 rounded flex items-center gap-2 border border-gray-200 dark:border-darkBorderLight",
//                         })}
//                     >
//                         <FiPlus /> Add
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default CourseList;