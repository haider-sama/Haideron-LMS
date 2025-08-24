import React, { useState } from "react";
import { AudienceEnum } from "../../../../../../server/src/shared/enums";
import { ForumTypeEnum } from "../../../../../../server/src/shared/social.enums";
import { CreateForumPayload } from "../../../../constants/social/interfaces";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../../../context/ToastContext";
import { requestForumCreation } from "../../../../api/social/forum/forum-user-api";
import { Input, SelectInput, TextAreaInput } from "../../../ui/Input";
import { Button } from "../../../ui/Button";
import { getAllowedForumTypesForAudience } from "./AddForum";
type RequestForumCreationProps = {
    audience: AudienceEnum;
};

const RequestForumCreation: React.FC<RequestForumCreationProps> = ({ audience }) => {
    const toast = useToast();
    const queryClient = useQueryClient();

    const [form, setForm] = useState<CreateForumPayload>({
        title: "",
        description: "",
        type: ForumTypeEnum.PUBLIC,
    });

    const allowedForumTypes = getAllowedForumTypesForAudience(audience);

    const mutation = useMutation({
        mutationFn: (payload: CreateForumPayload) => requestForumCreation(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["forums"] }); // refresh main forum list
            setForm({
                title: "",
                description: "",
                type: ForumTypeEnum.PUBLIC,
            });
            toast.success("Forum creation request submitted!");
        },
        onError: (err: any) => {
            const message = err?.response?.data?.message || err.message || "Failed to submit forum creation request";
            toast.error(message);
        },
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
                <h2 className="text-xl font-bold text-center">Request Forum Creation</h2>

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
                    loadingText="Submitting..."
                    disabled={mutation.isPending}
                >
                    Submit Request
                </Button>

            </form>
        </div>
    );
};

export default RequestForumCreation;
