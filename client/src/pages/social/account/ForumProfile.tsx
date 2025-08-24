// import { useState } from 'react';
// import { Helmet } from 'react-helmet-async';
// import { Input, TextAreaInput, SelectInput } from '../../../components/account/Input';
// import ErrorPage from '../../forbidden/ErrorPage';
// import { useToast } from '../../../context/ToastContext';
// import { updateUserProfile } from '../../../api/auth/userApi';
// import { GLOBAL_TITLE } from '../../../constants';
// import { usePermissions } from '../../../hooks/usePermissions';
// import ProfileCardLayout from '../../../components/pages/social/pages/account/ProfileCardLayout';
// import PageHeading from '../../../components/ui/PageHeading';
// import ForumSignaturePreview from '../../../components/pages/social/pages/account/ForumSignaturePreview';
// import UserForumStatsCard from '../../../components/pages/social/pages/account/UserForumStatsCard';
// import { SecondaryButton } from '../../../components/ui/Button';

// const ForumProfile: React.FC = () => {
//     const { user } = usePermissions();
//     const toast = useToast();

//     const [forumProfile, setForumProfile] = useState(() => ({
//         username: user?.forumProfile?.username || '',
//         displayName: user?.forumProfile?.displayName || '',
//         bio: user?.forumProfile?.bio || '',
//         signature: user?.forumProfile?.signature || '',
//         interests: user?.forumProfile?.interests?.join(', ') || '',
//         visibility: user?.forumProfile?.visibility || 'public',
//     }));

//     const [isSaving, setIsSaving] = useState(false);

//     if (!user) return (
//         <ErrorPage
//             code={404}
//             heading="User Not Found"
//             message="Oops! The user you're looking for doesn't exist."
//             homeUrl="/"
//             imageUrl="/astro.png"
//         />
//     );

//     const handleChange = (field: string, value: string) => {
//         setForumProfile((prev) => ({ ...prev, [field]: value }));
//     };

//     const handleSave = async () => {
//         setIsSaving(true);
//         try {
//             await updateUserProfile({
//                 forumProfile: {
//                     username: forumProfile.username,
//                     displayName: forumProfile.displayName,
//                     bio: forumProfile.bio,
//                     signature: forumProfile.signature,
//                     interests: forumProfile.interests
//                         .split(',')
//                         .map((s) => s.trim())
//                         .filter(Boolean),
//                     visibility: forumProfile.visibility as 'public' | 'private',
//                 },
//             });
//             toast.success('Forum profile updated successfully!');
//         } catch (error: any) {
//             const firstField = Object.keys(error?.errors || {})[0];
//             const message = error?.errors?.[firstField]?.[0] || error.message;
//             toast.error(message || 'Failed to update forum profile.');
//         } finally {
//             setIsSaving(false);
//         }
//     };

//     const isFormChanged = JSON.stringify({
//         username: user.forumProfile?.username || '',
//         displayName: user.forumProfile?.displayName || '',
//         bio: user.forumProfile?.bio || '',
//         signature: user.forumProfile?.signature || '',
//         interests: user.forumProfile?.interests?.join(', ') || '',
//         visibility: user.forumProfile?.visibility || 'public',
//     }) !== JSON.stringify(forumProfile);

//     return (
//         <div className="flex justify-center w-full">
//             <Helmet>
//                 <title>{GLOBAL_TITLE} - Forum Profile</title>
//             </Helmet>

//             <div className="w-full max-w-6xl py-8">
//                 {/* Heading aligned to top-left inside the card */}
//                 <div className="mb-2">
//                     <PageHeading
//                         title={`Forum Profile - ${user.forumProfile?.username}`}
//                         className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-darkTextPrimary"
//                     />
//                 </div>

//                 {/* Profile card content */}
//                 <ProfileCardLayout avatarURL={user.avatarURL} user={user} >
//                     <div className="w-full">
//                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                             <Input
//                                 label="Username"
//                                 value={forumProfile.username}
//                                 onChange={(e) => handleChange('username', e.target.value)}
//                             />
//                             <Input
//                                 label="Display Name"
//                                 value={forumProfile.displayName}
//                                 onChange={(e) => handleChange('displayName', e.target.value)}
//                             />
//                             <TextAreaInput
//                                 label="Bio"
//                                 value={forumProfile.bio}
//                                 onChange={(e) => handleChange('bio', e.target.value)}
//                                 className="sm:col-span-2"
//                                 name=""
//                             />
//                             <TextAreaInput
//                                 label="Signature"
//                                 value={forumProfile.signature}
//                                 onChange={(e) => handleChange('signature', e.target.value)}
//                                 className="sm:col-span-2"
//                                 name=""
//                             />
//                             <Input
//                                 label="Interests (comma-separated)"
//                                 value={forumProfile.interests}
//                                 onChange={(e) => handleChange('interests', e.target.value)}

//                             />
//                             <SelectInput
//                                 label="Visibility"
//                                 value={forumProfile.visibility}
//                                 onChange={(e) => handleChange('visibility', e.target.value)}
//                                 options={[
//                                     { label: 'Public', value: 'public' },
//                                     { label: 'Private', value: 'private' },
//                                 ]}
//                             />
//                         </div>

//                         <div className="mt-6 flex justify-center sm:justify-end">
//                             <SecondaryButton
//                                 type="button"
//                                 onClick={handleSave}
//                                 isLoading={isSaving}
//                                 loadingText="Saving..."
//                                 disabled={!isFormChanged || isSaving}
//                                 bg={
//                                     isFormChanged || isSaving
//                                         ? 'bg-primary dark:bg-darkBlurple'
//                                         : 'bg-gray-400 dark:bg-darkMuted cursor-not-allowed'
//                                 }
//                                 hoverBg={
//                                     isFormChanged || isSaving ? 'hover:bg-white dark:hover:bg-darkSurface' : ''
//                                 }
//                                 text="text-white"
//                                 hoverText={
//                                     isFormChanged || isSaving ? 'hover:text-gray-800 dark:hover:text-white' : ''
//                                 }
//                                 extra="text-sm px-4 py-2 transition-all duration-200 font-medium rounded border border-gray-200 dark:border-darkBorderLight"
//                             >
//                                 Save Changes
//                             </SecondaryButton>
//                         </div>
//                     </div>
//                 </ProfileCardLayout>

//                 <UserForumStatsCard user={user} />
//                 <ForumSignaturePreview signature={forumProfile.signature} />
//             </div>
//         </div>
//     );
// };

// export default ForumProfile;
