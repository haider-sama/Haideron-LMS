import React, { useState } from "react";
import { ForumStatusEnum } from "../../../../../../server/src/shared/social.enums";
import { useToast } from "../../../../context/ToastContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ForumWithDetails } from "../../../../constants/social/interfaces";
import { SelectInput } from "../../../ui/Input";
import { updateForumStatus } from "../../../../api/social/forum/forum-api";
import { Button } from "../../../ui/Button";

interface ChangeForumStatusProps {
    forum: ForumWithDetails;
    onClose: () => void;
}

export const ChangeForumStatus: React.FC<ChangeForumStatusProps> = ({ forum, onClose }) => {
    const [status, setStatus] = useState<ForumStatusEnum>(forum.status);
    const toast = useToast();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (status: ForumStatusEnum) =>
            updateForumStatus(forum.id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["forums"] });
            toast.success("Forum status updated");
            onClose();
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to update status");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(status);
    };

    return (
        <div className="flex items-center justify-center">
            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 p-4 bg-white dark:bg-darkMuted rounded-lg">
                <h2 className="text-xl font-bold text-center">Change Forum Status</h2>

                <SelectInput
                    label="Status"
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ForumStatusEnum)}
                    options={Object.values(ForumStatusEnum).map((value) => ({
                        value,
                        label: value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                    }))}
                />

                <Button
                    isLoading={mutation.isPending}
                    loadingText="Updating..."
                    disabled={mutation.isPending}
                >
                    Update Status
                </Button>
            </form>
        </div>
    );
};
