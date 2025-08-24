import React, { useState } from "react";
import { AudienceEnum } from "../../../../../../server/src/shared/enums";
import { ForumTypeEnum } from "../../../../../../server/src/shared/social.enums";
import { CreateForumPayload } from "../../../../constants/social/interfaces";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../../../context/ToastContext";
import { createForum } from "../../../../api/social/forum/forum-api";
import { Input, SelectInput, TextAreaInput } from "../../../ui/Input";
import { Button } from "../../../ui/Button";

export const getAllowedForumTypesForAudience = (audience: AudienceEnum): ForumTypeEnum[] => {
    switch (audience) {
        case AudienceEnum.Admin:
        case AudienceEnum.CommunityAdmin:
            return Object.values(ForumTypeEnum);

        case AudienceEnum.ForumModerator:
        case AudienceEnum.ForumCurator:
            return Object.values(ForumTypeEnum).filter(
                type => type !== ForumTypeEnum.ADMIN
            );

        case AudienceEnum.DepartmentHead:
            return [
                ForumTypeEnum.COURSE,
                ForumTypeEnum.PROGRAM,
                ForumTypeEnum.DEPARTMENT,
                ForumTypeEnum.FACULTY,
                ForumTypeEnum.UNIVERSITY,
                ForumTypeEnum.RESEARCH,
                ForumTypeEnum.EVENT,
                ForumTypeEnum.ANNOUNCEMENT,
                ForumTypeEnum.GENERAL,
                ForumTypeEnum.SUPPORT,
                ForumTypeEnum.PUBLIC,
                ForumTypeEnum.ALUMNI,
            ];

        case AudienceEnum.DepartmentTeacher:
            return [
                ForumTypeEnum.COURSE,
                ForumTypeEnum.PROGRAM,
                ForumTypeEnum.FACULTY,
                ForumTypeEnum.UNIVERSITY,
                ForumTypeEnum.RESEARCH,
                ForumTypeEnum.EVENT,
                ForumTypeEnum.ANNOUNCEMENT,
                ForumTypeEnum.GENERAL,
                ForumTypeEnum.SUPPORT,
                ForumTypeEnum.PUBLIC,
            ];

        case AudienceEnum.Student:
            return [
                ForumTypeEnum.COURSE,
                ForumTypeEnum.PROGRAM,
                ForumTypeEnum.UNIVERSITY,
                ForumTypeEnum.STUDENT_GROUP,
                ForumTypeEnum.EVENT,
                ForumTypeEnum.ANNOUNCEMENT,
                ForumTypeEnum.GENERAL,
                ForumTypeEnum.SUPPORT,
                ForumTypeEnum.PUBLIC,
                ForumTypeEnum.ALUMNI,
            ];

        case AudienceEnum.Guest:
        default:
            return [
                ForumTypeEnum.PUBLIC,
                ForumTypeEnum.SUPPORT,
                ForumTypeEnum.GENERAL,
            ];
    }
};

type AddForumProps = {
    audience: AudienceEnum;
};

export const AddForum: React.FC<AddForumProps> = ({ audience }) => {
    const toast = useToast();
    const queryClient = useQueryClient();

    const [form, setForm] = useState<CreateForumPayload>({
        title: "",
        description: "",
        type: ForumTypeEnum.PUBLIC,
    });

    const allowedForumTypes = getAllowedForumTypesForAudience(audience);

    const mutation = useMutation({
        mutationFn: createForum,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["forums"] });
            setForm({
                title: "",
                description: "",
                type: ForumTypeEnum.PUBLIC,
            });
            toast.success("Forum created successfully!");
        },
        onError: (err: any) => {
            const message =
                err?.response?.data?.message || err.message || "Failed to create forum";
            toast.error(message);
        },
    });

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.title.trim() || !form.description.trim()) {
            toast.error("Title and description are required.");
            return;
        }

        mutation.mutate(form);
    };

    return (
        <div className="flex items-center justify-center">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md space-y-4 p-4 bg-white"
            >
                <h2 className="text-xl font-bold text-center">Create New Forum</h2>

                <Input
                    label="Title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                />

                <TextAreaInput
                    label="Description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                />

                <SelectInput
                    label="Type"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    options={allowedForumTypes.map(type => ({
                        label: type.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
                        value: type,
                    }))}
                />

                <Button 
                    isLoading={mutation.isPending} 
                    loadingText="Creating..."
                    disabled={mutation.isPending}
                >
                    Create Forum
                </Button>
            </form>
        </div>
    );
};
