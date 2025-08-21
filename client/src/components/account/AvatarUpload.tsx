import React, { useState } from 'react';
import { deleteAvatar, uploadAvatar } from '../../api/auth/auth-api';
import { useToast } from '../../context/ToastContext';
import { FiImage } from 'react-icons/fi';
import Modal from '../ui/Modal';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { Button } from '../ui/Button';

interface AvatarUploadProps {
    avatarURL?: string | null; // Expect a single string
    targetUserId?: string; // optional, for admin/dept head usage
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ avatarURL, targetUserId }) => {
    const [image, setImage] = useState<File | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [deleting, setDeleting] = useState(false);
    const toast = useToast();
    const [modalOpen, setModalOpen] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);

    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

            if (!validImageTypes.includes(file.type)) {
                toast.error('Only JPG, PNG, GIF, or WEBP images are allowed');
                return;
            }

            setImage(file);

            const reader = new FileReader();
            reader.onload = () => {
                setImageSrc(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Disable cropper if it's a GIF
            if (file.type === 'image/gif') {
                setCroppedAreaPixels(null);
            }
        }
    };

    const getCroppedImg = async (imageSrc: string, crop: any): Promise<File | null> => {
        const image = new Image();
        image.src = imageSrc;

        await new Promise((resolve) => (image.onload = resolve));

        const canvas = document.createElement('canvas');
        canvas.width = crop.width;
        canvas.height = crop.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(
            image,
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            0,
            0,
            crop.width,
            crop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) return resolve(null);
                const file = new File([blob], 'cropped-avatar.jpg', { type: 'image/jpeg' });
                resolve(file);
            }, 'image/jpeg');
        });
    };

    const handleUpload = async () => {
        if (!image || !imageSrc || !croppedAreaPixels) {
            toast.error("Please select and crop an image");
            return;
        }

        setLoading(true);
        try {
            const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (!croppedFile) {
                toast.error("Failed to crop image");
                return;
            }

            await uploadAvatar(croppedFile, targetUserId);
            toast.success("Avatar updated successfully (refresh to see changes)");
            setModalOpen(false);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteAvatar(targetUserId);
            toast.success("Avatar deleted successfully (refresh to see changes)");
            setImage(null);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Avatar Display */}
            <div
                className="w-32 h-32 border rounded-lg border-gray-300 dark:border-darkBorderLight overflow-hidden cursor-pointer shadow-sm transition hover:ring-1 hover:ring-primary"
                onClick={() => setModalOpen(true)}
                title="Click to change avatar"
            >
                {avatarURL ? (
                    <img src={avatarURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-darkMuted flex items-center justify-center text-gray-500 dark:text-darkTextMuted text-sm">
                        No Avatar
                    </div>
                )}
            </div>

            {/* Trigger Button */}
            <Button variant="primary" size='md' fullWidth={false} onClick={() => setModalOpen(true)}>
                Change Avatar
            </Button>

            {/* Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                <div className="flex flex-col items-center gap-6 p-4 md:p-6">
                    {/* Upload Card */}
                    <div className="w-full max-w-md border border-gray-200 dark:border-darkBorderLight rounded-2xl p-6 bg-white dark:bg-darkSurface shadow-lg flex flex-col items-center gap-6 text-center">
                        <FiImage size={48} className="text-primary" />
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-darkTextPrimary">
                            Upload New Avatar
                        </h2>

                        {/* Image input */}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="avatar-file-input"
                        />
                        <label
                            htmlFor="avatar-file-input"
                            className="cursor-pointer bg-primary text-white px-4 py-2 rounded-md hover:bg-white dark:hover:bg-transparent hover:text-primary border border-primary text-sm transition"
                        >
                            Choose Image
                        </label>

                        {/* Cropper */}
                        {imageSrc && (
                            <div className="relative w-64 h-64 rounded-md overflow-hidden border border-gray-300 dark:border-darkBorderLight bg-black shadow">
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    cropShape="round"
                                    showGrid={false}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={(_, croppedPixels) => {
                                        setCroppedAreaPixels(croppedPixels);
                                    }}
                                />
                            </div>
                        )}

                        {/* Zoom Slider */}
                        {imageSrc && (
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
                        )}

                        {/* Upload Button */}
                        {image && (
                            <button
                                onClick={handleUpload}
                                disabled={loading}
                                className={`w-full py-2 rounded-md text-white text-sm transition-all ${loading
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-darkOnlineGreen hover:bg-green-600"
                                    }`}
                            >
                                {loading ? "Uploading..." : "Upload Avatar"}
                            </button>
                        )}
                    </div>

                    {/* Delete Button */}
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className={`text-sm text-white w-full max-w-md py-2 rounded-md shadow-sm ${deleting
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700"
                            }`}
                    >
                        {deleting ? "Deleting..." : "Delete Avatar"}
                    </button>
                </div>
            </Modal>
        </div>
    );
};


export default AvatarUpload;
