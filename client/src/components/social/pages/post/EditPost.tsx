// import React, { useEffect, useRef, useState } from "react";
// import { useMutation, useQueryClient } from "react-query";
// import { updatePost } from "../../../../../api/social/postApi";
// import { PostTypeEnum } from "../../../../../../../server/src/shared/social.enums";
// import { useToast } from "../../../../../context/ToastContext";
// import { uploadMedia, deleteMediaByUrl } from "../../../../../lib/mediaUploader";
// import { FiPaperclip, FiSend, FiX } from "react-icons/fi";
// import { FaChevronDown } from "react-icons/fa";
// import { Post } from "../../../../../constants/social/social-types";
// import LazyMedia from "../../../../ui/social/LazyMedia";

// type EditPostProps = {
//     post: Post;
//     onClose?: () => void;
// };

// export const EditPost: React.FC<EditPostProps> = ({ post, onClose }) => {
//     const toast = useToast();
//     const queryClient = useQueryClient();

//     const [form, setForm] = useState({
//         type: post.type,
//         content: post.content || "",
//         mediaUrls: post.mediaUrls || [],
//     });

//     const [uploading, setUploading] = useState(false);
//     const [showDropdown, setShowDropdown] = useState(false);
//     const dropdownRef = useRef<HTMLDivElement>(null);
//     const fileInputRef = useRef<HTMLInputElement>(null);

//     const postTypes = [
//         { label: "Text", value: PostTypeEnum.TEXT },
//         { label: "Question", value: PostTypeEnum.QUESTION },
//         { label: "Link", value: PostTypeEnum.LINK },
//         { label: "Image/Video", value: PostTypeEnum.MEDIA },
//     ];

//     useEffect(() => {
//         const handleClickOutside = (e: MouseEvent) => {
//             if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
//                 setShowDropdown(false);
//             }
//         };
//         document.addEventListener("mousedown", handleClickOutside);
//         return () => document.removeEventListener("mousedown", handleClickOutside);
//     }, []);

//     const mutation = useMutation(
//         (payload: typeof form) => updatePost(post._id, payload),
//         {
//             onSuccess: () => {
//                 queryClient.invalidateQueries(["forumPosts", post.forumId]);
//                 toast.success("Post updated!");
//                 onClose?.();
//             },
//             onError: (err: any) => {
//                 toast.error(err.message || "Failed to update post");
//             },
//         }
//     );

//     const handleFileUpload = async (file: File) => {
//         try {
//             setUploading(true);
//             const url = await uploadMedia(file);
//             setForm(prev => ({ ...prev, mediaUrls: [...(prev.mediaUrls || []), url] }));
//         } catch {
//             toast.error("Upload failed");
//         } finally {
//             setUploading(false);
//         }
//     };

//     const handleCancelMedia = async () => {
//         if (form.mediaUrls?.length) {
//             await Promise.all(form.mediaUrls.map(url => deleteMediaByUrl(url)));
//         }
//         setForm(prev => ({ ...prev, mediaUrls: [] }));
//     };

//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault();

//         if (!form.content?.trim() && !form.mediaUrls?.length) {
//             toast.error("Post must have content or media.");
//             return;
//         }

//         mutation.mutate(form);
//     };

//     const renderPostFields = () => {
//         switch (form.type) {
//             case PostTypeEnum.TEXT:
//             case PostTypeEnum.QUESTION:
//                 return (
//                     <textarea
//                         rows={4}
//                         placeholder={
//                             form.type === PostTypeEnum.QUESTION ? "Ask a question..." : "What's on your mind?"
//                         }
//                         className="w-full resize-none bg-gray-100 border border-gray-200 text-sm p-4 rounded-lg outline-none focus:ring-2 ring-primary"
//                         value={form.content}
//                         onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
//                     />
//                 );
//             case PostTypeEnum.LINK:
//                 return (
//                     <input
//                         type="text"
//                         placeholder="Paste a link (e.g. https://example.com)"
//                         className="w-full bg-gray-100 border border-gray-200 text-sm p-3 rounded-lg outline-none focus:ring-2 ring-primary"
//                         value={form.content}
//                         onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
//                     />
//                 );
//             default:
//                 return null;
//         }
//     };

//     return (
//         <div className="flex justify-center px-4">
//             <form onSubmit={handleSubmit} className="w-full max-w-xl p-4 space-y-4 bg-white dark:bg-darkCard rounded-xl relative">
//                 {/* Post Type Dropdown */}
//                 <div className="relative w-full" ref={dropdownRef}>
//                     <button
//                         type="button"
//                         onClick={() => setShowDropdown(prev => !prev)}
//                         className="w-full px-4 py-2 text-sm flex justify-between items-center bg-gray-100 dark:bg-darkMuted border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition"
//                     >
//                         <span>{postTypes.find(t => t.value === form.type)?.label}</span>
//                         <FaChevronDown className={`w-4 h-4 transform transition-transform ${showDropdown ? "rotate-180" : ""}`} />
//                     </button>

//                     {showDropdown && (
//                         <ul className="absolute left-0 right-0 mt-1 z-20 bg-white dark:bg-darkMuted border border-gray-300 dark:border-gray-700 rounded-lg shadow-md overflow-hidden animate-fadeIn">
//                             {postTypes.map(option => (
//                                 <li
//                                     key={option.value}
//                                     onClick={() => {
//                                         setForm(prev => ({ ...prev, type: option.value, content: "", mediaUrls: [] }));
//                                         setShowDropdown(false);
//                                     }}
//                                     className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-darkMuted/70 transition"
//                                 >
//                                     {option.label}
//                                 </li>
//                             ))}
//                         </ul>
//                     )}
//                 </div>

//                 {/* Dynamic Fields */}
//                 {renderPostFields()}

//                 {/* Media Preview */}
//                 {(form.mediaUrls.length > 0 || uploading) && (
//                     <div className="bg-white dark:bg-darkMuted p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-2">
//                         {uploading && (
//                             <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2 overflow-hidden">
//                                 <div className="bg-primary h-full animate-pulse w-full" />
//                             </div>
//                         )}

//                         <div className="flex flex-wrap gap-2">
//                             {form.mediaUrls.map((url, idx) => (
//                                 <div key={idx} className="relative w-32 h-32 rounded overflow-hidden">
//                                     <LazyMedia src={url} alt={`preview-${idx}`} isSingle isPreview />
//                                     <button
//                                         type="button"
//                                         className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded-full"
//                                         onClick={async () => {
//                                             await deleteMediaByUrl(url);
//                                             setForm(prev => ({
//                                                 ...prev,
//                                                 mediaUrls: prev.mediaUrls.filter(u => u !== url),
//                                             }));
//                                         }}
//                                     >
//                                         <FiX className="text-base" />
//                                     </button>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 )}
                
//                 {/* Action Buttons */}
//                 <div className="flex justify-end flex-wrap items-center gap-x-3 gap-y-2 pt-6 border-t dark:border-gray-700 mt-6">
//                     <input
//                         type="file"
//                         accept="image/*,video/*"
//                         ref={fileInputRef}
//                         onChange={e => {
//                             const file = e.target.files?.[0];
//                             if (file) handleFileUpload(file);
//                         }}
//                         className="hidden"
//                     />

//                     <button
//                         type="button"
//                         onClick={() => fileInputRef.current?.click()}
//                         className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-darkMuted dark:hover:bg-darkMuted/80 shadow-sm"
//                     >
//                         <FiPaperclip className="text-base" />
//                         Attach Media
//                     </button>

//                     {onClose && (
//                         <button
//                             type="button"
//                             onClick={async () => {
//                                 await handleCancelMedia();
//                                 onClose();
//                             }}
//                             className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-darkMuted dark:hover:bg-darkMuted/80 shadow-sm"
//                         >
//                             <FiX className="text-base" />
//                             Cancel
//                         </button>
//                     )}

//                     <button
//                         type="submit"
//                         disabled={mutation.isLoading}
//                         className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-xl text-white shadow-md transition ${mutation.isLoading
//                             ? "bg-gray-400 cursor-wait"
//                             : "bg-primary hover:bg-primary/90"
//                             }`}
//                     >
//                         <FiSend className="text-base" />
//                         {mutation.isLoading ? "Saving..." : "Save"}
//                     </button>
//                 </div>
//             </form>
//         </div>
//     );
// };
