import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getUserForumProfile } from '../../../api/auth/user-api';
import ErrorPage from '../../forbidden/ErrorPage';
import { Helmet } from 'react-helmet-async';
import { GLOBAL_TITLE } from '../../../constants';
import PageHeading from '../../../components/ui/PageHeading';
import ProfileCardLayout from '../../../components/social/pages/account/ProfileCardLayout';
import ForumSignaturePreview from '../../../components/social/pages/account/ForumSignaturePreview';
import UserForumStatsCard, { formatDate } from '../../../components/social/pages/account/UserForumStatsCard';
import { UserWithRelations } from '../../../../../server/src/shared/interfaces';
import { VisibilityEnum } from '../../../../../server/src/shared/social.enums';
import { useSettings } from '../../../hooks/admin/useSettings';
import FeatureDisabledPage from '../../forbidden/FeatureDisabledPage';
import TopCenterLoader from '../../../components/ui/TopCenterLoader';


const UserForumProfile: React.FC = () => {
    const { userIdOrUsername } = useParams<{ userIdOrUsername?: string }>();

    const { publicSettings, isLoading: isSettingsLoading } = useSettings(); // user-mode public settings
    const isForumsEnabled = publicSettings?.allowForums ?? false;

    const { data: user, isLoading, error } = useQuery<UserWithRelations>({
        queryKey: ['userForumProfile', { userIdOrUsername }],
        queryFn: () => getUserForumProfile(userIdOrUsername!),
        enabled: !!userIdOrUsername || isForumsEnabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    if (isSettingsLoading) {
        return <TopCenterLoader />;
    }

    if (!isForumsEnabled) {
        return <FeatureDisabledPage
            heading="Forums Disabled"
            message="The forums feature has been disabled by the administrators. Please contact them for more information."
            homeUrl="/"
        />;
    }

    if (isLoading) {
        return <div className="text-center py-10 text-gray-500 dark:text-gray-400">Loading forum profile...</div>;
    }

    if (error || !user) {
        return (
            <ErrorPage
                code={404}
                heading="User Not Found"
                message="The forum user you're looking for doesn't exist."
                homeUrl="/"
                imageUrl="/astro.png"
            />
        );
    }

    const profile = user.forumProfile;

    return (
        <div className="flex justify-center w-full">
            <Helmet>
                <title>{`${profile?.username}'s Forum Profile | ${GLOBAL_TITLE}`}</title>
            </Helmet>

            <div className="w-full max-w-6xl py-8">
                <PageHeading
                    title={`Forum Profile - ${profile?.username}`}
                    className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-darkTextPrimary mb-4"
                />

                <ProfileCardLayout user={user}>
                    {profile?.visibility === VisibilityEnum.private ? (
                        <div className="flex items-center justify-center h-full text-gray-600">
                            <span className="font-medium text-lg">This profile is private.</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 ml-8">
                            <div>
                                <span className="font-semibold">Username:</span> @{profile?.username || "N/A"}
                            </div>
                            <div className="sm:col-span-2">
                                <span className="font-semibold">Interests:</span> {profile?.interests?.join(", ") || "N/A"}
                            </div>
                            <div>
                                <span className="font-semibold">Display Name:</span> {profile?.displayName || "N/A"}
                            </div>
                            <div className="sm:col-span-2">
                                <span className="font-semibold">Bio:</span> {profile?.bio || "N/A"}
                            </div>
                            <div>
                                <span className="font-semibold">Visibility:</span> {profile?.visibility || "public"}
                            </div>
                            <div>
                                <span className="font-semibold">Joined:</span> {formatDate(profile?.joinedAt)}
                            </div>
                            <div>
                                <span className="font-semibold">Last Online:</span> {formatDate(user.lastOnline)}
                            </div>
                        </div>
                    )}
                </ProfileCardLayout>

                {/* Only show stats and signature if profile is public */}
                {profile?.visibility !== VisibilityEnum.private && (
                    <>
                        <UserForumStatsCard user={user} />
                        <ForumSignaturePreview signature={profile?.signature || ""} />
                    </>
                )}
            </div>
        </div>
    );
};

export default UserForumProfile;