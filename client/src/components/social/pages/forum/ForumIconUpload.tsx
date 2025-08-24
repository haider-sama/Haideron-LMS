import { useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { FiImage } from "react-icons/fi";
import { useToast } from "../../../../context/ToastContext";
import { deleteForumIcon, uploadForumIcon } from "../../../../api/social/forum/forum-api";
import { Button } from "../../../ui/Button";
import Modal from "../../../ui/Modal";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ForumIconUploadProps {
    forumId: string;
    forumIconURL?: string;
}

const ForumIconUpload: React.FC<ForumIconUploadProps> = ({ forumId, forumIconURL }) => {
    const [image, setImage] = useState<File | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const toast = useToast();
    const queryClient = useQueryClient();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        const file = e.target.files[0];
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        if (!allowedTypes.includes(file.type)) {
            toast.error('Only JPG, PNG, GIF, or WEBP images are allowed');
            return;
        }

        setImage(file);

        const reader = new FileReader();
        reader.onload = () => setImageSrc(reader.result as string);
        reader.readAsDataURL(file);

        if (file.type === 'image/gif') {
            setCroppedAreaPixels(null);
        }
    };

    const getCroppedImg = async (imageSrc: string, crop: any): Promise<File | null> => {
        const image = new Image();
        image.src = imageSrc;
        await new Promise(resolve => (image.onload = resolve));

        const canvas = document.createElement('canvas');
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

        return new Promise(resolve => {
            canvas.toBlob(blob => {
                if (!blob) return resolve(null);
                const file = new File([blob], 'cropped-forum-icon.jpg', { type: 'image/jpeg' });
                resolve(file);
            }, 'image/jpeg');
        });
    };

    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!image || !imageSrc || (!croppedAreaPixels && image.type !== "image/gif")) {
                throw new Error("Please select and crop an image");
            }

            const fileToUpload =
                image.type === "image/gif"
                    ? image
                    : await getCroppedImg(imageSrc, croppedAreaPixels!);

            if (!fileToUpload) {
                throw new Error("Cropping failed");
            }

            return uploadForumIcon(forumId, fileToUpload);
        },
        onSuccess: () => {
            toast.success("Forum icon updated (refresh to see changes)");
            setModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["forum", forumId] });
            queryClient.invalidateQueries({ queryKey: ["forums"] });
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to upload forum icon");
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: () => deleteForumIcon(forumId),
        onSuccess: () => {
            toast.success("Forum icon deleted (refresh to see changes)");
            setImage(null);
            queryClient.invalidateQueries({ queryKey: ["forum", forumId] });
            queryClient.invalidateQueries({ queryKey: ["forums"] });
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to delete forum icon");
        },
    });

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Forum Icon Preview */}
            <div
                onClick={() => setModalOpen(true)}
                title="Click to update forum icon"
                className="w-32 h-32 rounded-lg border border-gray-300 dark:border-darkBorderLight overflow-hidden shadow-sm cursor-pointer hover:ring-1 hover:ring-primary transition"
            >
                {forumIconURL ? (
                    <img src={forumIconURL} alt="Forum Icon" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-darkMuted flex items-center justify-center text-gray-500 dark:text-darkTextMuted text-sm">
                        No Icon
                    </div>
                )}
            </div>

            <Button onClick={() => setModalOpen(true)}>
                Change Forum Icon
            </Button>

            {/* Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                <div className="flex flex-col items-center gap-6 p-4 md:p-6">
                    <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-darkSurface border border-gray-200 dark:border-darkBorderLight shadow-lg flex flex-col items-center gap-6 text-center">
                        <FiImage size={48} className="text-primary" />
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-darkTextPrimary">
                            Upload New Forum Icon
                        </h2>

                        <input type="file" accept="image/*" id="forum-icon-input" className="hidden" onChange={handleImageChange} />
                        <label
                            htmlFor="forum-icon-input"
                            className="cursor-pointer bg-primary text-white px-4 py-2 rounded-md hover:bg-white hover:text-primary dark:hover:bg-transparent border border-gray-300 text-sm transition"
                        >
                            Choose Image
                        </label>

                        {imageSrc && (
                            <>
                                <div className="relative w-64 h-64 bg-black border border-gray-300 dark:border-darkBorderLight rounded-md overflow-hidden shadow">
                                    <Cropper
                                        image={imageSrc}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={1}
                                        cropShape="round"
                                        showGrid={false}
                                        onCropChange={setCrop}
                                        onZoomChange={setZoom}
                                        onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                                    />
                                </div>

                                <div className="w-full flex items-center gap-2">
                                    <label htmlFor="zoom" className="text-sm text-gray-600 dark:text-darkTextMuted w-16">
                                        Zoom
                                    </label>
                                    <input
                                        id="zoom"
                                        type="range"
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        value={zoom}
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                            </>
                        )}

                        {image && (
                            <Button
                                onClick={() => uploadMutation.mutate()}
                                isLoading={uploadMutation.isPending}
                                loadingText="Uploading..."
                                disabled={uploadMutation.isPending}
                                variant="green"
                                fullWidth={false}
                            >
                                Upload Forum Icon
                            </Button>
                        )}
                    </div>

                    <Button
                        onClick={() => deleteMutation.mutate()}
                        isLoading={deleteMutation.isPending}
                        loadingText="Deleting..."
                        disabled={deleteMutation.isPending}
                        variant="red"
                        fullWidth={false}
                    >
                        Delete Forum Icon
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default ForumIconUpload;
