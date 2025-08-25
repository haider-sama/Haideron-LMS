import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import ErrorPage from '../../forbidden/ErrorPage';
import { useToast } from '../../../context/ToastContext';
import { GLOBAL_TITLE } from '../../../constants';
import { usePermissions } from '../../../hooks/usePermissions';
import PageHeading from '../../../components/ui/PageHeading';
import { updateUserProfile } from '../../../api/auth/user-api';
import ProfileCardLayout from '../../../components/social/pages/account/ProfileCardLayout';
import { Input, SelectInput, TextAreaInput } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import UserForumStatsCard from '../../../components/social/pages/account/UserForumStatsCard';
import ForumSignaturePreview from '../../../components/social/pages/account/ForumSignaturePreview';
import { VisibilityEnum } from '../../../../../server/src/shared/social.enums';
import { ForumProfile } from '../../../../../server/src/shared/interfaces';
import { UpdateUserPayload } from '../../../constants/core/interfaces';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSettings } from '../../../hooks/admin/useSettings';
import FeatureDisabledPage from '../../forbidden/FeatureDisabledPage';
import TopCenterLoader from '../../../components/ui/TopCenterLoader';

const ForumUserProfile: React.FC = () => {
    const { user } = usePermissions();
    const toast = useToast();
    const queryClient = useQueryClient();

    const { publicSettings, isLoading: isSettingsLoading } = useSettings(); // user-mode public settings
    const isForumsEnabled = publicSettings?.allowForums ?? false;

    const [forumProfile, setForumProfile] = useState<Partial<ForumProfile>>({
        username: "",
        displayName: "",
        bio: "",
        signature: "",
        interests: [],
        visibility: VisibilityEnum.public,
    });

    const [_, setInterestsInput] = useState(""); // comma-separated input

    // Initialize form state
    useEffect(() => {
        if (user?.forumProfile) {
            const { username, displayName, bio, signature, interests, visibility } = user.forumProfile;
            setForumProfile({
                username,
                displayName: displayName || "",
                bio,
                signature,
                interests: interests || [],
                visibility,
            });
            setInterestsInput(interests?.join(", ") || "");
        }
    }, [user]);

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

    if (!user) {
        return (
            <ErrorPage
                code={404}
                heading="User Not Found"
                message="Oops! The user you're looking for doesn't exist."
                homeUrl="/"
                imageUrl="/astro.png"
            />
        );
    }

    const handleChange = (field: keyof ForumProfile | "interests", value: string) => {
        if (field === "interests") {
            setInterestsInput(value);
            setForumProfile((prev) => ({
                ...prev,
                interests: value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
            }));
        } else {
            setForumProfile((prev) => ({ ...prev, [field]: value }));
        }
    };

    const mutation = useMutation({
        mutationFn: (payload: UpdateUserPayload) => updateUserProfile(payload),
        onSuccess: () => {
            toast.success("Forum profile updated successfully!");
            queryClient.invalidateQueries({ queryKey: ['validateToken'] });
        },
        onError: (error: any) => {
            const firstField = Object.keys(error?.errors || {})[0];
            const message = error?.errors?.[firstField]?.[0] || error.message;
            toast.error(message || "Failed to update forum profile.");
        },
    });

    const handleSave = () => {
        mutation.mutate({
            forumProfile: {
                ...forumProfile,
                interests: forumProfile.interests || [],
                visibility: forumProfile.visibility as VisibilityEnum,
            },
        });
    };

    const isFormChanged = JSON.stringify({
        username: user.forumProfile?.username || "",
        displayName: user.forumProfile?.displayName || "",
        bio: user.forumProfile?.bio || "",
        signature: user.forumProfile?.signature || "",
        interests: user.forumProfile?.interests?.join(", ") || "",
        visibility: user.forumProfile?.visibility || VisibilityEnum.public,
    }) !== JSON.stringify(forumProfile);


    return (
        <div className="flex justify-center w-full">
            <Helmet>
                <title>{GLOBAL_TITLE} - Forum Profile</title>
            </Helmet>

            <div className="w-full max-w-6xl py-8">
                <div className="mb-2">
                    <PageHeading
                        title={`Forum Profile - ${user.forumProfile?.username}`}
                        className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-darkTextPrimary"
                    />
                </div>

                <ProfileCardLayout user={user} >
                    <div className="w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Username"
                                value={forumProfile.username}
                                onChange={(e) => handleChange('username', e.target.value)}
                            />
                            <Input
                                label="Display Name"
                                value={forumProfile.displayName ?? ""}
                                onChange={(e) => handleChange('displayName', e.target.value)}
                            />
                            <TextAreaInput
                                label="Bio"
                                value={forumProfile.bio ?? ""}
                                onChange={(e) => handleChange('bio', e.target.value)}
                                className="sm:col-span-2"
                                name=""
                            />
                            <TextAreaInput
                                label="Signature"
                                value={forumProfile.signature ?? ""}
                                onChange={(e) => handleChange("signature", e.target.value)}
                                className="sm:col-span-2"
                                name=""
                            />
                            <Input
                                label="Interests (comma-separated)"
                                value={forumProfile.interests?.join(", ") ?? ""}
                                onChange={(e) => handleChange("interests", e.target.value)}
                            />
                            <SelectInput
                                label="Visibility"
                                value={forumProfile.visibility ?? VisibilityEnum.public}
                                onChange={(e) => handleChange('visibility', e.target.value)}
                                options={[
                                    { label: 'Public', value: 'public' },
                                    { label: 'Private', value: 'private' },
                                ]}
                            />
                        </div>

                        <div className="mt-6 flex justify-center sm:justify-end">
                            <Button
                                type="button"
                                onClick={handleSave}
                                isLoading={mutation.isPending}
                                loadingText="Saving..."
                                disabled={!isFormChanged || mutation.isPending}
                                fullWidth={false}
                                variant='green'
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </ProfileCardLayout>

                <UserForumStatsCard user={user} />
                <ForumSignaturePreview signature={forumProfile.signature} />
            </div>
        </div>
    );
};

export default ForumUserProfile;
