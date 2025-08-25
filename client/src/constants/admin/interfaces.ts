export type PublicSettings = {
    allowForums: boolean;
    allowPosts: boolean;
    allowComments: boolean;
    allowLikes: boolean;
    allowUserRegistration: boolean;
    allowEmailMigration: boolean;
    enableEmailNotifications: boolean;
    enablePushNotifications: boolean;
    maintenanceMode: boolean;
};

export type AdminSettings = PublicSettings & {
    allowMessages: boolean;
    // add other fields
};