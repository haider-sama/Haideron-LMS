import React, { useEffect, useState } from "react";
import { usePermissions } from "../../../../hooks/usePermissions";
import { useDashboards } from "../../../../hooks/auth/useDashboards";
import { useToast } from "../../../../context/ToastContext";
import { Input, SelectInput, TextAreaInput } from "../../../ui/Input";
import { DomainEnum, KnowledgeAreaEnum, SubjectLevelEnum, SubjectTypeEnum } from "../../../../../../server/src/shared/enums";
import { CreateCoursePayload } from "../../../../constants/core/interfaces";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCataloguesByProgram } from "../../../../api/core/catalogue-api";
import { getPrograms } from "../../../../api/core/program-api";
import { createCourse } from "../../../../api/core/course-api";
import { Button } from "../../../ui/Button";
import TopCenterLoader from "../../../ui/TopCenterLoader";
import ErrorStatus from "../../../ui/ErrorStatus";

const CreateCourse: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
    const { user, isLoggedIn, isAdmin, isDepartmentHead } = usePermissions();
    const { head: departmentHeadDashboard } = useDashboards(user?.role, isLoggedIn);

    const dashboard = departmentHeadDashboard.data;

    const queryClient = useQueryClient();
    const toast = useToast();
    const initialProgramId = isDepartmentHead && dashboard?.program?.id ? dashboard.program.id : "";

    // Form state
    const [form, setForm] = useState<CreateCoursePayload & { programmeId?: string }>({
        programId: initialProgramId,
        programCatalogueId: "",
        title: "",
        code: "",
        codePrefix: "",
        description: "",
        subjectLevel: "" as SubjectLevelEnum,
        subjectType: "" as SubjectTypeEnum,
        contactHours: 3,
        creditHours: 3,
        knowledgeArea: "" as KnowledgeAreaEnum,
        domain: "" as DomainEnum,
    });

    // Fetch programs
    const { data: programsData, isLoading: programsLoading, error: programsError } = useQuery({
        queryKey: ["programs", isAdmin, isDepartmentHead, dashboard?.program?.id],
        queryFn: async () => {
            if (isAdmin) {
                const res = await getPrograms();
                return res.programs || [];
            } else if (isDepartmentHead && dashboard?.program?.id) {
                return [dashboard.program];
            }
            return [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    useEffect(() => {
        if (isDepartmentHead && dashboard?.program?.id) {
            setForm(prev => ({
                ...prev,
                programId: dashboard.program.id,
            }));
        }
    }, [isDepartmentHead, dashboard?.program?.id]);

    // Fetch catalogues for selected program
    const { data: cataloguesData, isLoading: cataloguesLoading, error: cataloguesError } = useQuery({
        queryKey: ["catalogues", form.programId],
        queryFn: async () => {
            if (!form.programId) return [];
            const res = await getCataloguesByProgram({ programId: form.programId });
            return res.data || [];
        },
        enabled: !!form.programId, // wait until programId is valid
        staleTime: 1000 * 60 * 5,
    });

    // Form change handler
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        setForm({
            ...form,
            [name]: type === "number" ? Number(value) : value,
        });
    };

    // Mutation for creating course
    const mutation = useMutation({
        mutationFn: (payload: CreateCoursePayload) => createCourse(payload),
        onSuccess: () => {
            toast.success("Course created!");
            setForm({
                programId: isDepartmentHead && dashboard?.program?.id ? dashboard.program.id : "",
                programCatalogueId: "",
                title: "",
                code: "",
                codePrefix: "",
                description: "",
                subjectLevel: "" as SubjectLevelEnum,
                subjectType: "" as SubjectTypeEnum,
                contactHours: 3,
                creditHours: 3,
                knowledgeArea: "" as KnowledgeAreaEnum,
                domain: "" as DomainEnum,
            });
            onSuccess?.();
            queryClient.invalidateQueries({ queryKey: ["courses"] }); // Refresh courses list
        },
        onError: (err: any) => {
            if (err.fieldErrors) {
                const fieldErrors = err.fieldErrors as Record<string, string[]>;
                Object.values(fieldErrors).forEach((messages) =>
                    messages.forEach((msg) => toast.error(msg))
                );
            } else {
                toast.error(err.message || "Failed to add course");
            }
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(form);
    };

    const cataloguesArray = cataloguesData
        ? Array.isArray(cataloguesData)
            ? cataloguesData
            : [cataloguesData]
        : [];

    if (programsLoading || cataloguesLoading) return <TopCenterLoader />
    if (programsError || cataloguesError) {
        return <ErrorStatus message="Failed to fetch data, try refreshing..." />
    }
    
    return (
        <div className="max-w-4xl mx-auto p-4">
            <h2 className="text-2xl font-semibold text-center mb-8">Create Course</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectInput
                        label="Program"
                        name="programId"
                        value={form.programId}
                        onChange={handleChange}
                        options={(programsData || []).map((p) => ({ label: p.title, value: p.id }))}
                        disabled={isDepartmentHead}
                    />

                    <SelectInput
                        label="Catalogue"
                        name="programCatalogueId"
                        value={form.programCatalogueId}
                        onChange={handleChange}
                        options={cataloguesArray.map(c => ({ label: `Catalogue ${c.catalogueYear}`, value: c.id }))}
                    />

                    <Input label="Course Title" name="title" value={form.title} onChange={handleChange} />
                    <Input label="Course Code" name="code" value={form.code} onChange={handleChange} />
                    <Input label="Code Prefix" name="codePrefix" value={form.codePrefix} onChange={handleChange} />
                    <Input label="Credit Hours" name="creditHours" type="number" value={form.creditHours} onChange={handleChange} />
                    <Input label="Contact Hours" name="contactHours" type="number" value={form.contactHours} onChange={handleChange} />

                    <SelectInput
                        label="Subject Level"
                        name="subjectLevel"
                        value={form.subjectLevel}
                        onChange={handleChange}
                        options={Object.values(SubjectLevelEnum).map((v) => ({ label: v, value: v }))}
                    />
                    <SelectInput
                        label="Subject Type"
                        name="subjectType"
                        value={form.subjectType}
                        onChange={handleChange}
                        options={Object.values(SubjectTypeEnum).map((v) => ({ label: v, value: v }))}
                    />
                    <SelectInput
                        label="Knowledge Area"
                        name="knowledgeArea"
                        value={form.knowledgeArea}
                        onChange={handleChange}
                        options={Object.values(KnowledgeAreaEnum).map((v) => ({ label: v, value: v }))}
                    />
                    <SelectInput
                        label="Domain"
                        name="domain"
                        value={form.domain}
                        onChange={handleChange}
                        options={Object.values(DomainEnum).map((v) => ({ label: v, value: v }))}
                    />
                </div>

                <TextAreaInput label="Description" name="description" value={form.description}
                    onChange={handleChange} rows={4} />

                <div className="flex justify-center">
                    <Button isLoading={mutation.isPending} loadingText="Creating..."
                        disabled={mutation.isPending} fullWidth={false} size="md"
                        extra="max-w-xs w-full">
                        Create Course
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreateCourse;
