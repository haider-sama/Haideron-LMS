// import React, { useState } from "react";
// import { createSemester } from "../../../../../api/lms/faculty/semesterApi";
// import { SelectInput } from "../../../../account/Input";
// import { getButtonClass } from "../../../../ui/ButtonClass";
// import { useToast } from "../../../../../context/ToastContext";
// import { useQueryClient } from "react-query";
// import { usePermissions } from "../../../../../hooks/usePermissions";

// const semesterNumbers = Array.from({ length: 8 }, (_, i) => ({
//     label: `Semester ${i + 1}`,
//     value: `${i + 1}`,
// }));

// const CreateSemesterForm: React.FC<{ catalogueId: string; onSuccess?: () => void }> = ({
//     catalogueId,
//     onSuccess,
// }) => {
//     const { user, isLoggedIn } = usePermissions();
//     const [submitting, setSubmitting] = useState(false);
//     const [semesterNo, setSemesterNo] = useState("1");
//     const toast = useToast();
//     const queryClient = useQueryClient();

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!isLoggedIn || !user) return toast.error("You must be logged in.");

//         if (!catalogueId || !semesterNo) {
//             return toast.error("All fields are required.");
//         }

//         try {
//             setSubmitting(true);
//             await createSemester({
//                 programCatalogue: catalogueId,
//                 semesterNo: Number(semesterNo),
//             });
//             toast.success("Semester created successfully.");
//             queryClient.invalidateQueries(["semesters", catalogueId]);
//             setSemesterNo("1");
//             onSuccess?.();
//         } catch (err: any) {
//             if (err.fieldErrors) {
//                 const fieldErrors = err.fieldErrors as Record<string, string[]>;

//                 for (const messages of Object.values(fieldErrors)) {
//                     messages.forEach((msg) => toast.error(msg));
//                 }
//             } else {
//                 toast.error(err.message || "Failed to create semester");
//             }
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     return (
//         <div className="p-6 mx-auto w-full max-w-xl">
//             <h3 className="text-lg font-semibold mb-4 text-center">Add a New Semester</h3>
//             <form onSubmit={handleSubmit} className="space-y-4">
//                 <SelectInput
//                     label="Semester Number"
//                     name="semesterNo"
//                     value={semesterNo}
//                     onChange={(e) => setSemesterNo(e.target.value)}
//                     options={semesterNumbers}
//                     disabled={submitting}
//                     className="w-full"
//                 />

//                 {/* Center the button horizontally */}
//                 <div className="flex justify-center">
//                     <button
//                         type="submit"
//                         disabled={submitting}
//                         className={getButtonClass({
//                             bg: submitting
//                                 ? "bg-gray-400 dark:bg-darkMuted cursor-not-allowed"
//                                 : "bg-primary dark:bg-darkBlurple",
//                             hoverBg: submitting
//                                 ? ""
//                                 : "hover:bg-white dark:hover:bg-darkBlurpleHover",
//                             text: "text-white dark:text-darkTextPrimary",
//                             hoverText: submitting
//                                 ? ""
//                                 : "hover:text-gray-900 dark:hover:text-darkTextPrimary",
//                             focusRing: "focus:ring-4 focus:ring-blue-200 dark:focus:ring-darkTextSecondary/30",
//                             extra:
//                                 "w-full max-w-xs text-sm px-2 py-2 transition-all duration-200 rounded border border-gray-200 dark:border-darkBorderLight",
//                         })}
//                     >
//                         {submitting ? "Creating..." : "Create Semester"}
//                     </button>

//                 </div>
//             </form>
//         </div>
//     );
// };

// export default CreateSemesterForm;
