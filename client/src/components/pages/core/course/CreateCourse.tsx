// import React, { useEffect, useState } from "react";
// import { usePermissions } from "../../../../hooks/usePermissions";
// import { useDashboards } from "../../../../hooks/auth/useDashboards";
// import { useToast } from "../../../../context/ToastContext";

// const CreateCourse: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
//     const { user, isLoggedIn, isAdmin, isDepartmentHead } = usePermissions();
//     const { head: departmentHeadDashboard } = useDashboards(user?.role, isLoggedIn);

//     const dashboard = departmentHeadDashboard.data;

//     const [programs, setPrograms] = useState<Program[]>([]);
//     const [catalogues, setCatalogues] = useState<ProgramCatalogue[]>([]);
//     const toast = useToast();

//     const [form, setForm] = useState<any>({
//         programId: "",
//         catalogueId: "",
//         title: "",
//         code: "",
//         codePrefix: "",
//         description: "",
//         subjectLevel: "",
//         subjectType: "",
//         creditHours: 3,
//         contactHours: 3,
//         knowledgeArea: "",
//         domain: "",
//         preRequisites: [],
//         coRequisites: [],
//         clos: [],
//         sections: [],
//     });

//     useEffect(() => {
//         if (isAdmin) {
//             getAllPrograms()
//                 .then((res) => setPrograms(res.programs || []))
//                 .catch(() => toast.error("Failed to fetch programs"));
//         } else if (isDepartmentHead && dashboard.program?._id) {
//             const deptProgram = dashboard.program;
//             setPrograms([deptProgram]);
//             setForm((prev: any) => ({
//                 ...prev,
//                 programId: deptProgram._id,
//             }));
//         }
//     }, [isAdmin, isDepartmentHead, dashboard.program]);

//     useEffect(() => {
//         if (form.programId) {
//             getCataloguesByProgram({ programId: form.programId })
//                 .then((res) => setCatalogues(res.data || []))
//                 .catch(() => toast.error("Failed to fetch catalogues"));
//         }
//     }, [form.programId]);

//     const handleChange = (
//         e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
//     ) => {
//         const { name, value, type } = e.target;
//         setForm({
//             ...form,
//             [name]: type === "number" ? Number(value) : value,
//         });
//     };
//     const mutation = useMutation(createCourse, {
//         onSuccess: () => {
//             toast.success("Course added to semester!");
//             setForm({
//                 programId: "",
//                 catalogueId: "",
//                 title: "",
//                 code: "",
//                 codePrefix: "",
//                 description: "",
//                 subjectLevel: "",
//                 subjectType: "",
//                 creditHours: 3,
//                 contactHours: 3,
//                 knowledgeArea: "",
//                 domain: "",
//                 preRequisites: [],
//                 coRequisites: [],
//                 clos: [],
//                 sections: [],
//             });
//             onSuccess?.();
//         },
//         onError: (err: any) => {
//             if (err.fieldErrors) {
//                 const fieldErrors = err.fieldErrors as Record<string, string[]>;
//                 for (const messages of Object.values(fieldErrors)) {
//                     messages.forEach((msg) => toast.error(msg));
//                 }
//             } else {
//                 toast.error(err.message || "Failed to add course");
//             }
//         },
//     });

//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault();

//         const payload: AddCourseToSemesterPayload = {
//             programId: form.programId,
//             catalogueId: form.catalogueId,
//             title: form.title,
//             code: form.code,
//             codePrefix: form.codePrefix,
//             description: form.description,
//             subjectLevel: form.subjectLevel,
//             subjectType: form.subjectType,
//             contactHours: Number(form.contactHours),
//             creditHours: Number(form.creditHours),
//             knowledgeArea: form.knowledgeArea,
//             domain: form.domain,
//             preRequisites: form.preRequisites,
//             coRequisites: form.coRequisites,
//             clos: form.clos,
//             sections: form.sections,
//         };

//         // console.log("Submitting payload:", payload);
//         mutation.mutate(payload);
//     };


//     return (
//         <div className="max-w-4xl mx-auto p-6">
//             <h2 className="text-2xl font-bold text-center mb-8">Add Course to Semester</h2>
//             <form onSubmit={handleSubmit} className="space-y-6">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <SelectInput
//                         label="Program"
//                         name="programId"
//                         value={form.programId}
//                         onChange={handleChange}
//                         options={programs.map((p) => ({ label: p.title, value: p._id }))}
//                         disabled={isDepartmentHead}
//                     />
//                     <SelectInput
//                         label="Catalogue"
//                         name="catalogueId"
//                         value={form.catalogueId}
//                         onChange={handleChange}
//                         options={catalogues.map((c) => ({ label: `Catalogue ${c.catalogueYear}`, value: c._id }))}
//                     />

//                     {/* Other fields */}
//                     <Input label="Course Title" name="title" value={form.title} onChange={handleChange} />
//                     <Input label="Course Code" name="code" value={form.code} onChange={handleChange} />
//                     <Input label="Code Prefix" name="codePrefix" value={form.codePrefix} onChange={handleChange} />
//                     <Input label="Credit Hours" name="creditHours" type="number" value={form.creditHours} onChange={handleChange} />
//                     <Input label="Contact Hours" name="contactHours" type="number" value={form.contactHours} onChange={handleChange} />

//                     <SelectInput label="Subject Level" name="subjectLevel" value={form.subjectLevel} onChange={handleChange}
//                         options={Object.values(SubjectLevelEnum).map((v) => ({ label: v, value: v }))} />
//                     <SelectInput label="Subject Type" name="subjectType" value={form.subjectType} onChange={handleChange}
//                         options={Object.values(SubjectTypeEnum).map((v) => ({ label: v, value: v }))} />
//                     <SelectInput label="Knowledge Area" name="knowledgeArea" value={form.knowledgeArea} onChange={handleChange}
//                         options={Object.values(KnowledgeAreaEnum).map((v) => ({ label: v, value: v }))} />
//                     <SelectInput label="Domain" name="domain" value={form.domain} onChange={handleChange}
//                         options={Object.values(DomainEnum).map((v) => ({ label: v, value: v }))} />
//                 </div>

//                 <TextAreaInput
//                     label="Description"
//                     name="description"
//                     value={form.description}
//                     onChange={handleChange}
//                 />

//                 <div className="flex justify-center">
//                     <button
//                         type="submit"
//                         disabled={mutation.isLoading}
//                         className={getButtonClass({
//                             bg: mutation.isLoading
//                                 ? "bg-gray-400 dark:bg-darkMuted cursor-not-allowed"
//                                 : "bg-primary dark:bg-darkBlurple",
//                             hoverBg: mutation.isLoading
//                                 ? ""
//                                 : "hover:bg-white dark:hover:bg-darkBlurpleHover",
//                             text: "text-white dark:text-darkTextPrimary",
//                             hoverText: mutation.isLoading
//                                 ? ""
//                                 : "hover:text-gray-900 dark:hover:text-darkTextPrimary",
//                             focusRing: "focus:ring-4 focus:ring-blue-200 dark:focus:ring-darkTextSecondary/30",
//                             extra:
//                                 "w-full max-w-md text-sm px-2 py-2 transition-all duration-200 rounded border border-gray-200 dark:border-darkBorderLight",
//                         })}
//                     >
//                         {mutation.isLoading ? "Submitting..." : "Add Course"}
//                     </button>
//                 </div>
//             </form>
//         </div>
//     );
// };

// export default CreateCourse;
