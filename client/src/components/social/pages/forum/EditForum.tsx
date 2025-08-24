import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateForumPayload, ForumWithDetails } from "../../../../constants/social/interfaces";
import { useToast } from "../../../../context/ToastContext";
import { getAllowedForumTypesForAudience } from "./AddForum";
import { useState } from "react";
import { updateForum } from "../../../../api/social/forum/forum-api";
import ForumIconUpload from "./ForumIconUpload";
import { Input, SelectInput, TextAreaInput } from "../../../ui/Input";
import { Button } from "../../../ui/Button";
import { usePermissions } from "../../../../hooks/usePermissions";
import { AudienceEnum } from "../../../../../../server/src/shared/enums";

interface EditForumProps {
    forum: ForumWithDetails;
    onClose: () => void;
}

export const EditForum: React.FC<EditForumProps> = ({ forum, onClose }) => {
    const toast = useToast();
    const queryClient = useQueryClient();

    const { user } = usePermissions();
    const allowedForumTypes = getAllowedForumTypesForAudience(user?.role ?? AudienceEnum.Guest);

    const [form, setForm] = useState<CreateForumPayload>({
        title: forum.title || "",
        description: forum.description || "",
        type: forum.type,
    });

    const mutation = useMutation({
        mutationFn: (updated: CreateForumPayload) => updateForum(forum.id, updated),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["forums"] });
            toast.success("Forum updated successfully");
            onClose();
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to update forum");
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

        const payload: CreateForumPayload = {
            title: form.title || "",
            description: form.description || "",
            type: form.type,
        };

        mutation.mutate(payload);
    };

    return (
        <div className="flex items-center justify-center flex-col gap-6">
            <ForumIconUpload forumId={forum.id} forumIconURL={forum.iconUrl} />

            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 p-4 bg-white">
                <h2 className="text-xl font-bold text-center">Edit Forum</h2>
                <Input label="Title" name="title" value={form.title} onChange={handleChange} required />
                <TextAreaInput label="Description" name="description" value={form.description} onChange={handleChange} />
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
                    loadingText="Updating..."
                    disabled={mutation.isPending}
                >
                    Update Forum
                </Button>
            </form>
        </div>
    );
};