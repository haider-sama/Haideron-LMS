// import { useParams } from 'react-router-dom';
// import { useQuery } from 'react-query';
// import { Helmet } from 'react-helmet-async';
// import ErrorPage from '../../forbidden/ErrorPage';
// import ProfileCardLayout from '../../../components/pages/social/pages/account/ProfileCardLayout';
// import PageHeading from '../../../components/ui/PageHeading';
// import ForumSignaturePreview from '../../../components/pages/social/pages/account/ForumSignaturePreview';
// import UserForumStatsCard from '../../../components/pages/social/pages/account/UserForumStatsCard';
// import { GLOBAL_TITLE } from '../../../constants';
// import { getUserForumProfile } from '../../../api/auth/userApi';

// const UserForumProfile: React.FC = () => {
//     const { userIdOrUsername } = useParams<{ userIdOrUsername?: string }>();

//     const {
//         data: user,
//         isLoading,
//         error,
//     } = useQuery(
//         ['userForumProfile', userIdOrUsername],
//         () => getUserForumProfile(userIdOrUsername!),
//         {
//             enabled: !!userIdOrUsername,
//             staleTime: 5 * 60 * 1000, // 5 minutes
//         }
//     );

//     if (isLoading) {
//         return <div className="text-center py-10 text-gray-500 dark:text-gray-400">Loading forum profile...</div>;
//     }

//     if (error || !user) {
//         return (
//             <ErrorPage
//                 code={404}
//                 heading="User Not Found"
//                 message="The forum user you're looking for doesn't exist."
//                 homeUrl="/"
//                 imageUrl="/astro.png"
//             />
//         );
//     }

//     return (
//         <div className="flex justify-center w-full">
//             <Helmet>
//                 <title>{GLOBAL_TITLE} - {user.forumProfile?.username}'s Forum Profile</title>
//             </Helmet>

//             <div className="w-full max-w-6xl py-8">
//                 <div className="mb-2">
//                     <PageHeading
//                         title={`Forum Profile - ${user.forumProfile?.username}`}
//                         className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-darkTextPrimary"
//                     />
//                 </div>

//                 <ProfileCardLayout avatarURL={user.avatarURL} user={user}>
//                     {user.forumProfile?.visibility !== 'private' && (
//                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 ml-8">
//                             <div>
//                                 <span className="font-semibold">Username:</span>{' '}
//                                 @{user.forumProfile?.username || 'N/A'}
//                             </div>
//                             <div className="sm:col-span-2">
//                                 <span className="font-semibold">Interests:</span>{' '}
//                                 {user.forumProfile?.interests?.join(', ') || 'N/A'}
//                             </div>
//                             <div>
//                                 <span className="font-semibold">Display Name:</span>{' '}
//                                 {user.forumProfile?.displayName || 'N/A'}
//                             </div>
//                             <div className="sm:col-span-2">
//                                 <span className="font-semibold">Bio:</span>{' '}
//                                 {user.forumProfile?.bio || 'N/A'}
//                             </div>
//                             <div>
//                                 <span className="font-semibold">Visibility:</span>{' '}
//                                 {user.forumProfile?.visibility || 'public'}
//                             </div>
//                         </div>
//                     )}
//                 </ProfileCardLayout>

//                 <UserForumStatsCard user={user} />
//                 <ForumSignaturePreview signature={user.forumProfile?.signature || ''} />
//             </div>
//         </div>
//     );
// };

// export default UserForumProfile;
