import React from "react";
import { useLocation } from "react-router-dom";
import { ForumModerator } from "../../../../constants/social/interfaces";

const ModeratorsPage: React.FC = () => {
    const location = useLocation();
    const { moderators = [], groupLeader } = (location.state as {
        moderators?: ForumModerator[];
        groupLeader: ForumModerator;
    }) || {};

    const otherModerators = moderators;

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-2 text-gray-800">Forum Moderators</h1>
            <p className="text-sm text-gray-600 mb-6">
                <strong>Forum Staff</strong> — Responsible for managing discussions and maintaining a healthy learning environment. This is a closed group; new members can only be added by the group leader.
            </p>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg shadow-sm">
                    <thead className="bg-gray-100 border-b border-gray-300">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avatar</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100 text-sm">
                        {/* Group Leader Section */}
                        <tr>
                            <td colSpan={3} className="px-6 py-4 bg-gray-50 border-b border-gray-300 font-semibold text-gray-700 text-sm">
                                Group Leader
                            </td>
                        </tr>
                        <tr key={groupLeader.id}>
                            <td className="px-6 py-4">
                                {groupLeader.avatarURL ? (
                                    <img
                                        src={groupLeader.avatarURL}
                                        alt={`${groupLeader.firstName} ${groupLeader.lastName}`}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700 dark:bg-darkMuted dark:text-darkTextSecondary">
                                        {(groupLeader.firstName?.[0] || "").toUpperCase()}
                                        {(groupLeader.lastName?.[0] || "").toUpperCase()}
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-800">
                                {groupLeader.firstName} {groupLeader.lastName}
                            </td>
                            <td className="px-6 py-4 text-gray-600">{groupLeader.email}</td>
                        </tr>

                        {/* Moderators Section */}
                        <tr>
                            <td colSpan={3} className="px-6 py-4 bg-gray-50 border-y border-gray-300 font-semibold text-gray-700 text-sm">
                                Moderators
                            </td>
                        </tr>
                        {otherModerators.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                                    No other moderators found.
                                </td>
                            </tr>
                        ) : (
                            otherModerators.map((mod) => (
                                <tr key={mod.id}>
                                    <td className="px-6 py-4">
                                        {mod.avatarURL ? (
                                            <img
                                                src={mod.avatarURL}
                                                alt={`${mod.firstName} ${mod.lastName}`}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700 dark:bg-darkMuted dark:text-darkTextSecondary">
                                                {(mod.firstName?.[0] || "").toUpperCase()}
                                                {(mod.lastName?.[0] || "").toUpperCase()}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-800">
                                        {mod.firstName} {mod.lastName}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{mod.email}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

    );
};

export default ModeratorsPage;