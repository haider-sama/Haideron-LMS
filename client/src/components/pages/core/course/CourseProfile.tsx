// import { useEffect, useState } from "react";
// import { useMutation } from "react-query";
// import { FiChevronUp, FiEdit3, FiTrash2 } from "react-icons/fi";
// import { CLO, Course, PLO, Program, ProgramCatalogue } from "../../../../../constants/lms/interfaces";
// import { deleteCourse, getAllCourses } from "../../../../../api/lms/faculty/semesterApi";
// import { Input, MultiSelectInput, MultiSelectOption, SelectInput, TextAreaInput } from "../../../../account/Input";
// import { getButtonClass } from "../../../../ui/ButtonClass";
// import { ClassSectionEnum, DomainEnum, KnowledgeAreaEnum, StrengthEnum, SubjectLevelEnum, SubjectTypeEnum } from "../../../../../../../server/src/shared/enums";
// import { getFacultyMembers } from "../../../../../api/lms/faculty/facultyApi";
// import { getAllPrograms, getPLOsByProgramId } from "../../../../../api/lms/faculty/programApi";
// import { useToast } from "../../../../../context/ToastContext";
// import { GLOBAL_TITLE } from "../../../../../constants";
// import { Helmet } from "react-helmet-async";
// import { getCataloguesByProgram } from "../../../../../api/lms/faculty/catalogueApi";
// import InternalError from "../../../../../pages/forbidden/InternalError";
// import { FacultyUser } from "../../../../../constants/lms/interfaces";
// import TopCenterLoader from "../../../../ui/TopCenterLoader";
// import React from "react";

// interface CourseProfileProps {
//     courseId: string;
//     fetchCourse: (id: string) => Promise<Course>;
//     updateCourse: (id: string, data: Partial<Course>) => Promise<any>;
//     onDelete?: () => void;
// }

// const CourseProfile: React.FC<CourseProfileProps> = ({ courseId, fetchCourse, updateCourse, onDelete }) => {
//     const [editFields, setEditFields] = useState<Partial<Course>>({});
//     const [expandedCLOs, setExpandedCLOs] = useState<number[]>([]);
//     const [course, setCourse] = useState<Course | null>(null);
//     const [programs, setPrograms] = useState<Program[]>([]);
//     const [plos, setPlos] = useState<PLO[]>([]);
//     const [catalogues, setCatalogues] = useState<ProgramCatalogue[]>([]);
//     const [allCourses, setAllCourses] = useState<Course[]>([]);
//     const [allFaculty, setAllFaculty] = useState<FacultyUser[]>([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const [shouldRefetchCourse, setShouldRefetchCourse] = useState(true);
//     const toast = useToast();

//     useEffect(() => {
//         if (!courseId || !shouldRefetchCourse) return;

//         setLoading(true);
//         fetchCourse(courseId)
//             .then((data) => {
//                 setCourse(data);
//                 setEditFields(data);
//                 setError(null);
//             })
//             .catch((err) => {
//                 setError(err.message || "Failed to fetch course");
//                 toast.error(err.message || "Failed to fetch course");
//             })
//             .finally(() => {
//                 setLoading(false);
//                 setShouldRefetchCourse(false);
//             });
//     }, [courseId, fetchCourse, toast, shouldRefetchCourse]);

//     // Fetch programs once
//     useEffect(() => {
//         getAllPrograms()
//             .then((res) => {
//                 setPrograms(res.programs || []);
//             })
//             .catch(() => toast.error("Failed to fetch programs"));
//     }, [toast]);

//     // Fetch PLOs whenever selected program changes
//     useEffect(() => {
//         if (!editFields.program) {
//             setPlos([]);
//             return;
//         }

//         getPLOsByProgramId(editFields.program)
//             .then((res) => setPlos(res.plos || []))
//             .catch(() => toast.error("Failed to fetch PLOs"));
//     }, [editFields.program, toast]);

//     // Fetch catalogues when program changes
//     useEffect(() => {
//         if (!editFields.program) {
//             setCatalogues([]);
//             return;
//         }

//         getCataloguesByProgram({ programId: editFields.program })
//             .then((res) => setCatalogues(res.data || []))
//             .catch(() => toast.error("Failed to fetch catalogues"));
//     }, [editFields.program, toast]);

//     // Fetch all courses once
//     useEffect(() => {
//         getAllCourses()
//             .then((res) => setAllCourses(res.courses || []))
//             .catch(() => toast.error("Failed to fetch courses"));
//     }, [toast]);

//     // Fetch all faculty once
//     useEffect(() => {
//         getFacultyMembers()
//             .then((res) => setAllFaculty(res.data || []))
//             .catch(() => toast.error("Failed to fetch faculty"));
//     }, [toast]);

//     const mutation = useMutation((data: Partial<Course>) => updateCourse(courseId, data), {
//         onSuccess: (updatedCourse: Course) => {
//             toast.success("Course updated successfully!");
//             setCourse(updatedCourse);
//             setEditFields(updatedCourse);
//             setShouldRefetchCourse(true);
//         },
//         onError: (err: any) => {
//             if (err.fieldErrors) {
//                 const fieldErrors = err.fieldErrors as Record<string, string[]>;
//                 for (const messages of Object.values(fieldErrors)) {
//                     messages.forEach((msg) => toast.error(msg));
//                 }
//             } else {
//                 toast.error(err.message || "Failed to update course.");
//             }
//         },
//     });

//     const deleteMutation = useMutation(() => deleteCourse(courseId), {
//         onSuccess: () => {
//             toast.success("Course deleted");
//             onDelete?.();
//         },
//         onError: (err: any) => {
//             toast.error(err.message || "Failed to delete course");
//         },
//     });

//     const handleChange = (
//         e:
//             | React.ChangeEvent<HTMLInputElement>
//             | React.ChangeEvent<HTMLTextAreaElement>
//             | React.ChangeEvent<HTMLSelectElement>
//     ) => {
//         const { name, value } = e.target;
//         const numberFields = ["contactHours", "creditHours"];

//         setEditFields((prev) => ({
//             ...prev,
//             [name]: numberFields.includes(name) ? (value === "" ? undefined : parseInt(value, 10)) : value,
//         }));
//     };


//     const handleCLOChange = (
//         index: number,
//         field: keyof CLO,
//         value: any
//     ) => {
//         setEditFields((prev) => {
//             const currentCLOs = prev.clos || [];
//             const oldCLO = currentCLOs[index] || {};
//             const updatedCLO = {
//                 ...oldCLO,
//                 [field]: value,
//                 // Preserve _id if it exists
//                 _id: oldCLO._id,
//             };
//             const newCLOs = [...currentCLOs];
//             newCLOs[index] = updatedCLO;
//             return { ...prev, clos: newCLOs };
//         });
//     };

//     const handlePLOMapChange = (
//         cloIndex: number,
//         mapIndex: number,
//         field: "plo" | "strength",
//         value: any
//     ) => {
//         setEditFields((prev) => {
//             const currentCLOs = prev.clos || [];
//             const clo = currentCLOs[cloIndex] || { ploMapping: [] };
//             const currentMapping = clo.ploMapping || [];
//             const oldMap = currentMapping[mapIndex] || {};
//             const updatedMap = {
//                 ...oldMap,
//                 [field]: value,
//                 _id: oldMap._id,  // preserve id
//             };
//             const newMapping = [...currentMapping];
//             newMapping[mapIndex] = updatedMap;
//             const updatedCLO = { ...clo, ploMapping: newMapping };
//             const newCLOs = [...currentCLOs];
//             newCLOs[cloIndex] = updatedCLO;
//             return { ...prev, clos: newCLOs };
//         });
//     };

//     const addCLO = () => {
//         setEditFields((prev) => ({
//             ...prev,
//             clos: [
//                 ...(prev.clos || []),
//                 { code: "", title: "", description: "", ploMapping: [] },
//             ],
//         }));
//     };

//     const removeCLO = (index: number) => {
//         const filtered = [...(editFields.clos || [])];
//         filtered.splice(index, 1);
//         setEditFields((prev) => ({ ...prev, clos: filtered }));
//     };

//     const addPLOMap = (cloIndex: number) => {
//         setEditFields((prev) => {
//             const currentCLOs = prev.clos || [];
//             const clo = currentCLOs[cloIndex] || { ploMapping: [] };
//             const newMap = { plo: "", strength: StrengthEnum.Medium, /* no _id */ };
//             const newMapping = [...(clo.ploMapping || []), newMap];
//             const updatedCLO = { ...clo, ploMapping: newMapping };
//             const newCLOs = [...currentCLOs];
//             newCLOs[cloIndex] = updatedCLO;
//             return { ...prev, clos: newCLOs };
//         });
//     };

//     const updateSectionTeacher = (section: string, teacherId: string) => {
//         setEditFields((prev) => ({
//             ...prev,
//             sectionTeachers: { ...prev.sectionTeachers, [section]: teacherId },
//         }));
//     };

//     function preserveCLOIds(newCLOs: Partial<CLO>[], existingCLOs: CLO[]): Partial<CLO>[] {
//         return newCLOs.map((incomingCLO) => {
//             const matchedCLO = existingCLOs.find((c) => c._id && String(c._id) === String(incomingCLO._id));
//             const preservedCLO = {
//                 ...incomingCLO,
//                 _id: incomingCLO._id || matchedCLO?._id, // ensure CLO._id
//                 ploMapping: (incomingCLO.ploMapping || []).map((incomingMap, index) => {
//                     const existingMap = matchedCLO?.ploMapping?.[index];
//                     return {
//                         ...incomingMap,
//                         _id: incomingMap._id || existingMap?._id, // ensure mapping._id
//                     };
//                 }),
//             };
//             return preservedCLO;
//         });
//     }

//     const handleSave = () => {
//         const completedCLOs: CLO[] = (editFields.clos || [])
//             .filter((clo): clo is CLO =>
//                 !!clo.code && !!clo.title && !!clo.description && Array.isArray(clo.ploMapping)
//             );

//         const closWithPreservedIds = preserveCLOIds(completedCLOs, course?.clos || []) as CLO[];

//         mutation.mutate({
//             ...editFields,
//             clos: closWithPreservedIds,
//             preRequisites: editFields.preRequisites || [],
//             coRequisites: editFields.coRequisites || [],
//         });
//     };

//     const handleDelete = () => {
//         if (!window.confirm("Are you sure you want to delete this course?")) return;
//         if (!window.confirm("This action is irreversible. Proceed?")) return;
//         deleteMutation.mutate();
//     };

//     if (loading || !course) return <TopCenterLoader />;
//     if (error) return <InternalError />;

//     const courseOptions: MultiSelectOption[] = course
//         ? allCourses
//             .filter((c) => c._id !== course._id)
//             .map((c) => ({
//                 label: `${c.codePrefix}-${c.code}: ${c.title}`,
//                 value: c._id,
//             }))
//         : [];

//     const facultyOptions = allFaculty.map((f) => ({
//         label: `${f.firstName} ${f.lastName}`,
//         value: f._id,
//     }));

//     const ploOptions = plos
//         .filter((p): p is PLO & { _id: string } => Boolean(p._id))
//         .map((p) => ({ label: `${p.code}: ${p.title}`, value: p._id }));

//     const preRequisites: MultiSelectOption[] =
//         editFields.preRequisites?.map((id) =>
//             courseOptions.find((c) => c.value === id) || { label: "Unknown", value: id }
//         ) || [];

//     const coRequisites: MultiSelectOption[] =
//         editFields.coRequisites?.map((id) =>
//             courseOptions.find((c) => c.value === id) || { label: "Unknown", value: id }
//         ) || [];

//     const removePLOMap = (cloIndex: number, mapIndex: number) => {
//         const newCLOs = [...(editFields.clos || [])];
//         const mappings = newCLOs[cloIndex].ploMapping || [];
//         mappings.splice(mapIndex, 1);
//         newCLOs[cloIndex].ploMapping = mappings;
//         setEditFields((prev) => ({ ...prev, clos: newCLOs }));
//     };

//     return (
//         <div className="flex flex-col items-center px-4 space-y-8 max-w-4xl mx-auto">
//             <Helmet>
//                 <title>{GLOBAL_TITLE} - Course Management - Existing Courses - Edit Course</title>
//             </Helmet>
//             <div className="w-full max-w-5xl p-6 space-y-6">
//                 <h1 className="text-2xl font-bold text-center">Edit Course Details</h1>

//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                     <SelectInput
//                         label="Program"
//                         name="program"
//                         value={editFields.program || ""}
//                         onChange={handleChange}
//                         options={programs.map((p: Program) => ({ label: p.title, value: p._id }))}
//                     />
//                     <SelectInput
//                         label="Program Catalogue"
//                         name="programCatalogue"
//                         value={editFields.programCatalogue || ""}
//                         onChange={handleChange}
//                         options={catalogues.map((c: ProgramCatalogue) => ({ label: c.catalogueYear.toString(), value: c._id }))}
//                     />

//                     <Input label="Course Title" name="title" value={editFields.title || ""} onChange={handleChange} />
//                     <Input label="Code Prefix" name="codePrefix" value={editFields.codePrefix || ""} onChange={handleChange} />
//                     <Input label="Course Code" name="code" value={editFields.code || ""} onChange={handleChange} />

//                     <SelectInput
//                         label="Subject Level"
//                         name="subjectLevel"
//                         value={editFields.subjectLevel || ""}
//                         onChange={handleChange}
//                         options={Object.values(SubjectLevelEnum)}
//                     />
//                     <SelectInput
//                         label="Subject Type"
//                         name="subjectType"
//                         value={editFields.subjectType || ""}
//                         onChange={handleChange}
//                         options={Object.values(SubjectTypeEnum)}
//                     />
//                     <Input
//                         type="number"
//                         label="Credit Hours"
//                         name="creditHours"
//                         value={editFields.creditHours?.toString() || ""}
//                         onChange={handleChange}
//                     />
//                     <Input
//                         type="number"
//                         label="Contact Hours"
//                         name="contactHours"
//                         value={editFields.contactHours?.toString() || ""}
//                         onChange={handleChange}
//                     />
//                     <SelectInput
//                         label="Knowledge Area"
//                         name="knowledgeArea"
//                         value={editFields.knowledgeArea || ""}
//                         onChange={handleChange}
//                         options={Object.values(KnowledgeAreaEnum)}
//                     />
//                     <SelectInput
//                         label="Domain"
//                         name="domain"
//                         value={editFields.domain || ""}
//                         onChange={handleChange}
//                         options={Object.values(DomainEnum)}
//                     />
//                 </div>

//                 <TextAreaInput
//                     label="Course Description"
//                     name="description"
//                     value={editFields.description || ""}
//                     onChange={handleChange}
//                     rows={4}
//                 />

//                 <MultiSelectInput
//                     label="Pre-Requisites"
//                     options={courseOptions}
//                     value={preRequisites}
//                     onChange={(selected) => {
//                         setEditFields((prev) => ({ ...prev, preRequisites: selected.map((s) => s.value) }));
//                     }}
//                 />

//                 <MultiSelectInput
//                     label="Co-Requisites"
//                     options={courseOptions}
//                     value={coRequisites}
//                     onChange={(selected) => {
//                         setEditFields((prev) => ({ ...prev, coRequisites: selected.map((s) => s.value) }));
//                     }}
//                 />

//                 <MultiSelectInput
//                     label="Sections"
//                     options={Object.values(ClassSectionEnum).map((sec) => ({ label: sec, value: sec }))}
//                     value={
//                         editFields.sections?.map((s) => ({ label: s, value: s })) || []
//                     }
//                     onChange={(selected) =>
//                         setEditFields((prev) => ({
//                             ...prev,
//                             sections: selected.map((s) => s.value as ClassSectionEnum),
//                         }))
//                     }
//                 />

//                 {/* Section Teachers */}
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
//                     {editFields.sections?.map((sec) => (
//                         <SelectInput
//                             key={sec}
//                             label={`Teacher for Section ${sec}`}
//                             name={`section-${sec}`}
//                             value={editFields.sectionTeachers?.[sec] || ""}
//                             onChange={(e) => updateSectionTeacher(sec, e.target.value)}
//                             options={facultyOptions}
//                         />
//                     ))}
//                 </div>

//                 {/* CLO List */}
//                 <h2 className="text-2xl font-bold text-center pt-8">Edit Course Learning Outcomes (CLOs)</h2>
//                 <button
//                     type="button"
//                     onClick={addCLO}
//                     className="text-blue-600 hover:underline text-sm"
//                 >
//                     + Add CLO
//                 </button>

//                 <div className="overflow-x-auto border rounded-lg shadow-sm bg-white dark:bg-darkSurface dark:border-darkBorderLight mt-4">
//                     <table className="min-w-full text-left">
//                         <thead className="bg-gray-100 text-gray-700 dark:bg-darkMuted dark:text-darkTextMuted uppercase text-xs tracking-wider">
//                             <tr>
//                                 <th className="px-4 py-2 w-1/5">CLO</th>
//                                 <th className="px-4 py-2">Title</th>
//                                 <th className="px-4 py-2 hidden md:table-cell">Description</th>
//                                 <th className="px-4 py-2 text-center">Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {(editFields.clos || []).length === 0 ? (
//                                 <tr>
//                                     <td colSpan={4} className="text-center py-6 text-gray-500 dark:text-darkTextMuted">
//                                         No CLOs defined.
//                                     </td>
//                                 </tr>
//                             ) : (
//                                 editFields.clos?.map((clo, ci) => {
//                                     const isExpanded = expandedCLOs.includes(ci);

//                                     return (
//                                         <React.Fragment key={ci}>
//                                             {/* Display Row */}
//                                             <tr className="border-b hover:bg-gray-50 dark:hover:bg-darkMuted transition border-gray-200 dark:border-darkBorderLight">
//                                                 <td className="px-4 py-2 font-medium text-gray-900 dark:text-darkTextPrimary whitespace-nowrap">
//                                                     {clo.code || `CLO ${ci + 1}`}
//                                                 </td>
//                                                 <td className="px-4 py-2 text-gray-700 dark:text-darkTextSecondary">{clo.title || "-"}</td>
//                                                 <td className="px-4 py-2 hidden md:table-cell text-gray-600 dark:text-darkTextMuted text-sm">
//                                                     {clo.description ? clo.description.slice(0, 80) + (clo.description.length > 80 ? "..." : "") : "-"}
//                                                 </td>
//                                                 <td className="px-4 py-2 text-center">
//                                                     <div className="flex justify-center items-center gap-3">
//                                                         <button
//                                                             type="button"
//                                                             onClick={() =>
//                                                                 setExpandedCLOs((prev) =>
//                                                                     prev.includes(ci) ? prev.filter((i) => i !== ci) : [...prev, ci]
//                                                                 )
//                                                             }
//                                                             className="text-blue-600 hover:text-blue-800 dark:text-darkBlurple dark:hover:text-darkBlurpleHover transition"
//                                                             title={isExpanded ? "Collapse" : "Edit CLO"}
//                                                         >
//                                                             {isExpanded ? <FiChevronUp size={16} /> : <FiEdit3 size={16} />}
//                                                         </button>
//                                                         <button
//                                                             type="button"
//                                                             onClick={() => removeCLO(ci)}
//                                                             className="text-red-600 hover:text-red-800 transition"
//                                                             title="Delete CLO"
//                                                         >
//                                                             <FiTrash2 size={16} />
//                                                         </button>
//                                                     </div>
//                                                 </td>
//                                             </tr>

//                                             {/* Editable Row */}
//                                             {isExpanded && (
//                                                 <tr className="bg-gray-50 dark:bg-darkSurface border-b dark:border-darkBorderLight">
//                                                     <td colSpan={4} className="p-6">
//                                                         <div className="space-y-4">
//                                                             <SelectInput
//                                                                 label="CLO Code"
//                                                                 name={`clo.code.${ci}`}
//                                                                 value={clo.code}
//                                                                 onChange={(e) => handleCLOChange(ci, "code", e.target.value)}
//                                                                 options={Array.from({ length: 10 }, (_, i) => ({
//                                                                     label: `CLO${i + 1}`,
//                                                                     value: `CLO${i + 1}`,
//                                                                 }))}
//                                                             />

//                                                             <Input
//                                                                 label="CLO Title"
//                                                                 name={`clo.title.${ci}`}
//                                                                 value={clo.title}
//                                                                 onChange={(e) => handleCLOChange(ci, "title", e.target.value)}
//                                                             />

//                                                             <TextAreaInput
//                                                                 label="CLO Description"
//                                                                 name={`clo.desc.${ci}`}
//                                                                 rows={3}
//                                                                 value={clo.description}
//                                                                 onChange={(e) => handleCLOChange(ci, "description", e.target.value)}
//                                                             />

//                                                             {/* PLO Mapping */}
//                                                             <div className="space-y-2">
//                                                                 <p className="font-medium text-gray-700 dark:text-darkTextPrimary">PLO Mappings:</p>
//                                                                 {(clo.ploMapping || []).map((m, mi) => (
//                                                                     <div key={mi} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
//                                                                         <SelectInput
//                                                                             label="Select PLO"
//                                                                             name={`plo.${ci}.${mi}`}
//                                                                             value={m.plo}
//                                                                             onChange={(e) =>
//                                                                                 handlePLOMapChange(ci, mi, "plo", e.target.value)
//                                                                             }
//                                                                             options={ploOptions}
//                                                                         />
//                                                                         <SelectInput
//                                                                             label="Strength"
//                                                                             name={`strength.${ci}.${mi}`}
//                                                                             value={m.strength}
//                                                                             onChange={(e) =>
//                                                                                 handlePLOMapChange(ci, mi, "strength", e.target.value)
//                                                                             }
//                                                                             options={Object.values(StrengthEnum)}
//                                                                         />
//                                                                         <button
//                                                                             type="button"
//                                                                             className="text-red-600 hover:text-red-800 mt-1 sm:mt-6"
//                                                                             onClick={() => removePLOMap(ci, mi)}
//                                                                             title="Remove PLO Mapping"
//                                                                         >
//                                                                             <FiTrash2 className="w-5 h-5" />
//                                                                         </button>
//                                                                     </div>
//                                                                 ))}

//                                                                 <button
//                                                                     type="button"
//                                                                     onClick={() => addPLOMap(ci)}
//                                                                     className="text-sm text-blue-600 hover:underline mt-2"
//                                                                 >
//                                                                     + Add PLO Mapping
//                                                                 </button>
//                                                             </div>
//                                                         </div>
//                                                     </td>
//                                                 </tr>
//                                             )}
//                                         </React.Fragment>
//                                     );
//                                 })
//                             )}
//                         </tbody>
//                     </table>
//                 </div>

//                 <div className="flex justify-center pt-4 gap-4">
//                     <button
//                         onClick={handleSave}
//                         disabled={mutation.isLoading}
//                         className={getButtonClass({
//                             bg: mutation.isLoading
//                                 ? "bg-gray-400 dark:bg-darkMuted cursor-not-allowed"
//                                 : "bg-blue-400 dark:bg-blue-500",
//                             hoverBg: mutation.isLoading
//                                 ? ""
//                                 : "hover:bg-white dark:hover:bg-darkSurface",
//                             text: "text-white dark:text-blue-100",
//                             hoverText: mutation.isLoading
//                                 ? ""
//                                 : "hover:text-blue-800 dark:hover:text-blue-300",
//                             focusRing: "focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-500/30",
//                             extra: `px-6 py-2 text-sm border border-gray-200 dark:border-darkBorderLight font-medium rounded ${mutation.isLoading ? "opacity-50 cursor-not-allowed" : ""
//                                 }`,
//                         })}
//                     >
//                         {mutation.isLoading ? "Saving..." : "Save Changes"}
//                     </button>

//                     <button
//                         type="button"
//                         onClick={handleDelete}
//                         className={getButtonClass({
//                             bg: "bg-red-600 dark:bg-red-500 dark:bg-opacity-10",
//                             hoverBg: "hover:bg-white dark:hover:bg-darkSurface",
//                             text: "text-white dark:text-red-400",
//                             hoverText: "hover:text-red-800 dark:hover:text-red-300",
//                             focusRing: "focus:ring-4 focus:ring-red-200 dark:focus:ring-red-500/30",
//                             extra: "px-4 py-2 border border-gray-200 dark:border-darkBorderLight text-sm rounded flex items-center gap-2",
//                         })}
//                     >
//                         <FiTrash2 />
//                         Delete Course
//                     </button>
//                 </div>
//             </div>

//         </div>
//     );
// };

// export default CourseProfile;