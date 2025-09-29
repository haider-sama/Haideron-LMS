import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useToast } from "../../../../shared/context/ToastContext";
import { usePermissions } from "../../../../features/auth/hooks/usePermissions";
import { useDashboards } from "../../../../features/auth/hooks/useDashboards";
import { getCourseById, updateCourseById } from "../../../../api/core/course-api";
import { getPLOsForProgram } from "../../../../api/core/program-api";
import { DomainEnum, KnowledgeAreaEnum, StrengthEnum, SubjectLevelEnum, SubjectTypeEnum } from "../../../../../../server/src/shared/enums";
import { CLO, EditableCourse, PLOMapping, UpdateCoursePayload } from "../../../../shared/constants/core/interfaces";
import ErrorStatus from "../../../ui/ErrorStatus";
import { Input, SelectInput, TextAreaInput } from "../../../ui/Input";
import { Button } from "../../../ui/Button";
import CLOEditor from "../course/CLOEditor";

interface EditCourseFacultyProps {
    courseId: string;
}

const EditCourseFaculty: React.FC<EditCourseFacultyProps> = ({ courseId }) => {
    const toast = useToast();
    const queryClient = useQueryClient();

    const { user, isLoggedIn } = usePermissions();
    const { faculty: facultyDashboard } = useDashboards(user?.role, isLoggedIn);

    const program = facultyDashboard.data?.program;
    const [editFields, setEditFields] = useState<EditableCourse>({});
    const [expandedCLOs, setExpandedCLOs] = useState<number[]>([]);

    /** --- Fetch Course --- */
    const { data: course, error: courseError } = useQuery({
        queryKey: ["course", courseId],
        queryFn: () => getCourseById(courseId),
        enabled: !!courseId,
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    /** Map backend -> editable fields */
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

    /** --- Fetch PLOs for faculty program --- */
    const { data: plosData } = useQuery({
        queryKey: ["plos", program?.id],
        queryFn: () => getPLOsForProgram(program!.id),
        enabled: !!program?.id,
        staleTime: 1000 * 60 * 5, // 5 min cache
    });


    const ploOptions =
        plosData?.plos?.map((p) => ({
            label: `${p.code} - ${p.title}`,
            value: p.id,
        })) || [];

    /** --- Update Course Mutation --- */
    const updateMutation = useMutation({
        mutationFn: (data: EditableCourse) => {
            const payload: UpdateCoursePayload = {
                title: data.title,
                code: data.code,
                codePrefix: data.codePrefix,
                description: data.description,
                subjectLevel: data.subjectLevel,
                subjectType: data.subjectType,
                contactHours: data.contactHours,
                creditHours: data.creditHours,
                knowledgeArea: data.knowledgeArea,
                domain: data.domain,
                clos: data.clos || [],
            };
            return updateCourseById(courseId, payload);
        },
        onSuccess: () => {
            toast.success("Course updated successfully");
            queryClient.invalidateQueries({ queryKey: ["course", courseId] });
        },
        onError: (err: any) => {
            if (err?.fieldErrors) {
                Object.values(err.fieldErrors).forEach((messages: any) => {
                    if (Array.isArray(messages)) messages.forEach((msg) => toast.error(msg));
                });
            } else {
                toast.error(err.message || "Failed to update course.");
            }
        },
    });

    /** --- Handlers --- */
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
        };
        updateMutation.mutate(payload);
    };


    if (courseError) {
        return <ErrorStatus message="Failed to fetch course" />;
    }

    return (
        <div className="flex flex-col items-center px-4 space-y-8 max-w-4xl mx-auto">
            <div className="w-full max-w-5xl p-6 space-y-6">
                <h1 className="text-2xl font-semibold text-center">Edit Course Details</h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Input
                        label="Course Title"
                        name="title"
                        value={editFields.title || ""}
                        onChange={handleChange}
                    />
                    <Input
                        label="Code Prefix"
                        name="codePrefix"
                        value={editFields.codePrefix || ""}
                        onChange={handleChange}
                    />
                    <Input
                        label="Course Code"
                        name="code"
                        value={editFields.code || ""}
                        onChange={handleChange}
                    />

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
                    <Button
                        loadingText="Saving..."
                        isLoading={updateMutation.isPending}
                        disabled={updateMutation.isPending}
                        fullWidth={false}
                        variant="gray"
                        onClick={handleSave}
                    >
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default EditCourseFaculty;