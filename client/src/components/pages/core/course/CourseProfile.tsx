import { useEffect, useState } from "react";
import { Course, ProgramCatalogue } from "../../../../../../server/src/shared/interfaces";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteCourseById, getCourses } from "../../../../api/core/course-api";
import { getFacultyMembers } from "../../../../api/core/faculty-api";
import { getCataloguesByProgram } from "../../../../api/core/catalogue-api";
import { getPLOsForProgram, getPrograms } from "../../../../api/core/program-api";
import { useToast } from "../../../../context/ToastContext";
import TopCenterLoader from "../../../ui/TopCenterLoader";
import { Input, MultiSelectInput, SelectInput, TextAreaInput } from "../../../ui/Input";
import { ClassSectionEnum, DomainEnum, KnowledgeAreaEnum, StrengthEnum, SubjectLevelEnum, SubjectTypeEnum } from "../../../../../../server/src/shared/enums";
import React from "react";
import { CLO, EditableCourse, PLOMapping, ProgramWithCreator, UpdateCoursePayload } from "../../../../constants/core/interfaces";
import CLOEditor from "./CLOEditor";
import ErrorStatus from "../../../ui/ErrorStatus";
import { Button } from "../../../ui/Button";
import Select from "react-select";
import { MAX_PAGE_LIMIT } from "../../../../constants";

interface CourseProfileProps {
    courseId: string;
    fetchCourse: (id: string) => Promise<Course>;
    updateCourse: (id: string, data: Partial<Course>) => Promise<any>;
    onDelete?: () => void;
}

const CourseProfile: React.FC<CourseProfileProps> = ({ courseId, fetchCourse, updateCourse, onDelete }) => {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [editFields, setEditFields] = useState<EditableCourse>({});

    const [expandedCLOs, setExpandedCLOs] = useState<number[]>([]);
    const [facultySearch, setFacultySearch] = useState("");
    const [preReqSearch, setPreReqSearch] = useState("");
    const [coReqSearch, setCoReqSearch] = useState("");

    // Fetch course
    const { data: course, error: courseError } = useQuery({
        queryKey: ["course", courseId],
        queryFn: () => fetchCourse(courseId),
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    /** Map backend Course -> frontend EditableCourse */
    useEffect(() => {
        if (!course) return;
        setEditFields({
            ...course,
            preRequisites: course.preRequisites?.map(pr => pr.preReqCourseId) || [],
            coRequisites: course.coRequisites?.map(cr => cr.coReqCourseId) || [],
            sectionTeachers: course.sectionTeachers?.map(st => ({ section: st.section, teacherId: st.teacherId })) || [],
            sections: course.sections?.map(s => ({ section: s.section })) || [],
        });
    }, [course]);

    // Fetch Programs
    const { data: programs, isLoading: programsLoading, error: programsError } = useQuery({
        queryKey: ["programs"],
        queryFn: () => getPrograms(),
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    /** --- Fetch Catalogues and PLOs (enabled only if programId exists) --- */
    const { data: catalogues, isLoading: cataloguesLoading, error: cataloguesError } = useQuery({
        queryKey: ["catalogues", editFields.programId],
        queryFn: () =>
            getCataloguesByProgram({ programId: editFields.programId! }),
        enabled: !!editFields.programId,
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    useEffect(() => {
        if (!catalogues) return;
        // any side-effects here, e.g., toast messages
    }, [catalogues]);

    const { data: plos } = useQuery({
        queryKey: ["plos", editFields.programId],
        queryFn: () => getPLOsForProgram(editFields.programId!),
        enabled: !!editFields.programId,
    });

    const ploOptions = plos?.plos?.map(p => ({
        label: p.code + " - " + p.title,
        value: p.id
    })) || [];

    // Fetch all courses (for pre/co-requisites)
    const { data: preReqCourses } = useQuery({
        queryKey: ["courses", preReqSearch],
        queryFn: () => getCourses({ limit: MAX_PAGE_LIMIT, search: preReqSearch }),
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    const { data: coReqCourses } = useQuery({
        queryKey: ["courses", coReqSearch],
        queryFn: () => getCourses({ limit: MAX_PAGE_LIMIT, search: coReqSearch }),
    });

    const preReqOptions = preReqCourses?.courses?.map(c => ({
        label: c.title,
        value: c.id
    })) || [];

    const coReqOptions = coReqCourses?.courses?.map(c => ({
        label: c.title,
        value: c.id
    })) || [];

    // Fetch all faculty
    const { data: facultyData, isError: facultyError } = useQuery({
        queryKey: ["faculty", { limit: 10, search: facultySearch }],
        queryFn: () => getFacultyMembers({ limit: MAX_PAGE_LIMIT, search: facultySearch }),
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    if (facultyError) toast.error("Failed to fetch faculty");

    const facultyOptions = facultyData?.data.map(f => ({
        label: `${f.firstName} ${f.lastName || ""}`.trim(),
        value: f.id
    })) || [];

    // Update Course Mutation
    const updateMutation = useMutation({
        mutationFn: (data: EditableCourse) => {
            // Convert frontend EditableCourse to backend-compatible Partial<Course>
            const payload: Partial<Course> = {
                ...data,
                preRequisites: data.preRequisites?.map(id => ({
                    courseId,
                    preReqCourseId: id
                })),
                coRequisites: data.coRequisites?.map(id => ({
                    courseId,
                    coReqCourseId: id
                })),
                sectionTeachers: data.sectionTeachers?.map(st => ({
                    ...st,
                    courseId
                })),
                sections: data.sections?.map(s => ({
                    courseId,
                    section: s.section
                })) || [],
            };
            return updateCourse(courseId, payload);
        },
        onSuccess: (updatedCourse) => {
            toast.success("Course updated successfully");
            setEditFields(updatedCourse);
            queryClient.invalidateQueries({ queryKey: ["course", courseId] });
        },
        onError: (err: any) => {
            if (err?.zodErrors) {
                Object.entries(err.zodErrors).forEach(([_, messages]) => {
                    if (Array.isArray(messages)) messages.forEach((msg) => toast.error(msg));
                });
            } else {
                toast.error(err.message || 'Failed to update course.');
            }
        },
    });

    // Delete Course Mutation
    const deleteMutation = useMutation({
        mutationFn: () => deleteCourseById(courseId),
        onSuccess: () => {
            toast.success("Course deleted");
            onDelete?.();
            queryClient.invalidateQueries({ queryKey: ["courses"] });
        },
        onError: (err: any) => toast.error(err.message || "Failed to delete course"),
    });

    /** Handlers */
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        const numberFields = ["creditHours", "contactHours"];
        setEditFields((prev) => ({
            ...prev,
            [name]: numberFields.includes(name) ? (value === "" ? undefined : parseInt(value)) : value,
        }));
    };

    const handleCLOChange = (index: number, field: keyof CLO, value: any) => {
        setEditFields((prev) => {
            const clos = [...(prev.clos || [])];
            clos[index] = { ...clos[index], [field]: value };
            return { ...prev, clos };
        });
    };

    const addCLO = () => {
        setEditFields((prev) => ({
            ...prev,
            clos: [...(prev.clos || []), { code: "", title: "", description: "", ploMappings: [] }],
        }));
    };

    const removeCLO = (index: number) => {
        setEditFields((prev) => ({
            ...prev,
            clos: (prev.clos || []).filter((_, i) => i !== index),
        }));
    };

    const handlePLOMapChange = (cloIndex: number, mapIndex: number, field: keyof PLOMapping, value: any) => {
        setEditFields((prev) => {
            const clos = [...(prev.clos || [])];
            const mapping = [...(clos[cloIndex]?.ploMappings || [])];
            mapping[mapIndex] = { ...mapping[mapIndex], [field]: value };
            clos[cloIndex] = { ...clos[cloIndex], ploMappings: mapping };
            return { ...prev, clos };
        });
    };

    const addPLOMap = (cloIndex: number) => {
        setEditFields((prev) => {
            const clos = [...(prev.clos || [])];
            const mapping = [...(clos[cloIndex]?.ploMappings || []), { ploId: "", strength: StrengthEnum.Medium }];
            clos[cloIndex] = { ...clos[cloIndex], ploMappings: mapping };
            return { ...prev, clos };
        });
    };

    const removePLOMap = (cloIndex: number, mapIndex: number) => {
        setEditFields((prev) => {
            const clos = [...(prev.clos || [])];
            const mapping = [...(clos[cloIndex]?.ploMappings || [])];

            // Remove the specific mapping
            mapping.splice(mapIndex, 1);

            clos[cloIndex] = { ...clos[cloIndex], ploMappings: mapping };
            return { ...prev, clos };
        });
    };

    const handleSave = () => {
        const payload: UpdateCoursePayload = {
            ...editFields,
            clos: editFields.clos,
            preRequisites: editFields.preRequisites || [],
            coRequisites: editFields.coRequisites || [],
            sections: editFields.sections || [],
        };
        updateMutation.mutate(payload);
    };

    const handleDelete = () => {
        if (window.confirm("Are you sure? This action is irreversible.")) {
            deleteMutation.mutate();
        }
    };

    if (programsError || cataloguesError || courseError) {
        return <ErrorStatus message="Failed to fetch data, try refreshing..." />;
    }

    return (
        <div className="flex flex-col items-center px-4 space-y-8 max-w-4xl mx-auto">
            <div className="w-full max-w-5xl p-6 space-y-6">
                <h1 className="text-2xl font-semibold text-center">Edit Course Details</h1>

                {(programsLoading || cataloguesLoading) && <TopCenterLoader />}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <SelectInput
                        label="Program"
                        name="programId"
                        value={editFields.programId || ""}
                        onChange={handleChange}
                        options={programs?.programs?.map((p: ProgramWithCreator) => ({ label: p.title, value: p.id })) || []}
                    />

                    <SelectInput
                        label="Program Catalogue"
                        name="programCatalogueId"
                        value={editFields.programCatalogueId || ""}
                        onChange={handleChange}
                        options={catalogues?.data?.map((c: ProgramCatalogue) => ({
                            label: c.catalogueYear.toString(),
                            value: c.id
                        })) || []}
                    />

                    <Input label="Course Title" name="title" value={editFields.title || ""} onChange={handleChange} />
                    <Input label="Code Prefix" name="codePrefix" value={editFields.codePrefix || ""} onChange={handleChange} />
                    <Input label="Course Code" name="code" value={editFields.code || ""} onChange={handleChange} />

                    <SelectInput
                        label="Subject Level"
                        name="subjectLevel"
                        value={editFields.subjectLevel || ""}
                        onChange={handleChange}
                        options={Object.values(SubjectLevelEnum)}
                    />
                    <SelectInput
                        label="Subject Type"
                        name="subjectType"
                        value={editFields.subjectType || ""}
                        onChange={handleChange}
                        options={Object.values(SubjectTypeEnum)}
                    />
                    <Input
                        type="number"
                        label="Credit Hours"
                        name="creditHours"
                        value={editFields.creditHours?.toString() || ""}
                        onChange={handleChange}
                    />
                    <Input
                        type="number"
                        label="Contact Hours"
                        name="contactHours"
                        value={editFields.contactHours?.toString() || ""}
                        onChange={handleChange}
                    />
                    <SelectInput
                        label="Knowledge Area"
                        name="knowledgeArea"
                        value={editFields.knowledgeArea || ""}
                        onChange={handleChange}
                        options={Object.values(KnowledgeAreaEnum)}
                    />
                    <SelectInput
                        label="Domain"
                        name="domain"
                        value={editFields.domain || ""}
                        onChange={handleChange}
                        options={Object.values(DomainEnum)}
                    />
                </div>

                <TextAreaInput
                    label="Course Description"
                    name="description"
                    value={editFields.description || ""}
                    onChange={handleChange}
                    rows={4}
                />

                <MultiSelectInput
                    label="Pre-Requisites"
                    options={preReqOptions}
                    onInputChange={(value: string) => setPreReqSearch(value)}
                    value={editFields.preRequisites?.map(id => ({
                        label: preReqCourses?.courses?.find(c => c.id === id)?.title || id,
                        value: id
                    })) || []}
                    onChange={(selected) =>
                        setEditFields(prev => ({
                            ...prev,
                            preRequisites: selected.map(s => s.value)
                        }))
                    }
                />

                <MultiSelectInput
                    label="Co-Requisites"
                    options={coReqOptions}
                    onInputChange={(value: string) => setCoReqSearch(value)}
                    value={editFields.coRequisites?.map(id => ({
                        label: coReqCourses?.courses?.find(c => c.id === id)?.title || id,
                        value: id
                    })) || []}
                    onChange={(selected) =>
                        setEditFields(prev => ({
                            ...prev,
                            coRequisites: selected.map(s => s.value)
                        }))
                    }
                />

                <MultiSelectInput
                    label="Sections"
                    options={Object.values(ClassSectionEnum).map(sec => ({ label: sec, value: sec }))}
                    value={editFields.sections?.map(s => ({ label: s.section, value: s.section })) || []}
                    onChange={(selected) =>
                        setEditFields(prev => ({
                            ...prev,
                            sections: selected.map(s => ({ section: s.value as ClassSectionEnum })) // keep object shape
                        }))
                    }
                />

                {/* Section Teachers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {editFields.sections?.map(secObj => (
                        <Select
                            key={secObj.section}
                            placeholder={`Search teacher for Section ${secObj.section}`}
                            options={facultyOptions}
                            isSearchable
                            onInputChange={(value) => setFacultySearch(value)} // triggers refetch
                            onChange={(option) => {
                                if (option?.value) {
                                    setEditFields(prev => ({
                                        ...prev,
                                        sectionTeachers: [
                                            ...(prev.sectionTeachers?.filter(st => st.section !== secObj.section) || []),
                                            { section: secObj.section, teacherId: option.value }
                                        ]
                                    }));
                                }
                            }}
                            value={facultyOptions.find(opt =>
                                opt.value === editFields.sectionTeachers?.find(st => st.section === secObj.section)?.teacherId
                            )}
                        />
                    ))}
                </div>

                {/* CLO List */}
                <CLOEditor
                    clos={editFields.clos || []}
                    expandedCLOs={expandedCLOs}
                    setExpandedCLOs={setExpandedCLOs}
                    addCLO={addCLO}
                    removeCLO={removeCLO}
                    handleCLOChange={handleCLOChange}
                    handlePLOMapChange={handlePLOMapChange}
                    addPLOMap={addPLOMap}
                    removePLOMap={removePLOMap}
                    ploOptions={ploOptions}
                />

                {/* Save / Delete Buttons */}
                <div className="flex justify-center gap-4 mt-6">
                    <Button loadingText="Saving..." isLoading={updateMutation.isPending}
                        disabled={updateMutation.isPending} fullWidth={false} variant="gray"
                        onClick={handleSave}>
                        Save Changes
                    </Button>
                    <Button loadingText="Deleting..." isLoading={deleteMutation.isPending}
                        disabled={deleteMutation.isPending} fullWidth={false} variant="red"
                        onClick={handleDelete}>
                        Delete Course
                    </Button>
                </div>

            </div>
        </div >
    );
};

export default CourseProfile;