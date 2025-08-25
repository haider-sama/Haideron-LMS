import React from 'react';
import { FiImage } from 'react-icons/fi';
import { useRoleBadge } from '../../../../hooks/badges/useRoleBadges';
import { UserWithRelations } from '../../../../../../server/src/shared/interfaces';
import { truncateName } from '../../../../utils/truncate-name';

type ProfileCardLayoutProps = {
    user?: UserWithRelations;
    children: React.ReactNode;
};

const ProfileCardLayout = ({ user, children }: ProfileCardLayoutProps) => {
    const { RoleBadge } = useRoleBadge(user?.role!, "forum", "xs");

    return (
        <div className="bg-gray-100 p-6 border border-gray-300 flex flex-col sm:flex-row gap-6 rounded-md">
            <div className="flex-shrink-0 flex flex-col items-center text-center">
                {user?.avatarURL ? (
                    <img
                        src={user?.avatarURL}
                        alt="User Avatar"
                        className="w-32 h-32 object-cover border border-gray-300"
                    />
                ) : (
                    <div className="w-32 h-32 flex items-center justify-center bg-gray-200 border border-gray-300">
                        <FiImage className="w-12 h-12 text-gray-600" />
                    </div>
                )}

                <div className="mt-1 flex flex-col items-center text-center">
                    {user?.forumProfile?.username ? (
                        <>
                            <p className="text-gray-800 font-medium text-sm">
                                {truncateName(user.forumProfile.username)}
                            </p>
                            {user?.role && <RoleBadge />}
                        </>
                    ) : null}
                </div>
            </div>

            <div className="flex-1">{children}</div>
        </div>
    );
};

export default ProfileCardLayout;
