
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../context/ToastContext";
import { archivePost, restorePost, togglePinPost } from "../../api/social/post/post-api";


export const usePostActions = (forumId: string) => {
    const queryClient = useQueryClient();
    const toast = useToast();

    const archive = useMutation({
        mutationFn: (postId: string) => archivePost(postId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["forumPosts", forumId] });
            toast.success("Post archived");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to archive post");
        },
    });

    const restore = useMutation({
        mutationFn: (postId: string) => restorePost(postId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["forumPosts", forumId] });
            toast.success("Post restored");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to restore post");
        },
    });

    const togglePin = useMutation({
        mutationFn: ({ postId, pin }: { postId: string; pin: boolean }) =>
            togglePinPost(postId, pin),
        onSuccess: (_, { pin }) => {
            queryClient.invalidateQueries({ queryKey: ["forumPosts", forumId] });
            toast.success(`Post ${pin ? "pinned" : "unpinned"}`);
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to toggle pin status");
        },
    });

    return {
        archive,
        restore,
        togglePin,
    };
};