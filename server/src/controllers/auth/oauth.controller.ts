import { OAuth2Client } from 'google-auth-library';
import { Response, Request } from 'express';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from '../../constants/http';
import generateToken from '../../utils/token-utils/generateToken';
import crypto from 'crypto';
import { GOOGLE_CLIENT_ID } from '../../constants/env';
import { db } from '../../db/db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { hashValue } from '../../utils/bcrypt';
import { AudienceEnum } from '../../shared/enums';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export const loginWithGoogle = async (req: Request, res: Response) => {
    const { token } = req.body; // the id_token from frontend

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(BAD_REQUEST).json({ message: 'Invalid Google token.' });
        }

        const { email, picture } = payload;

        // Find user by email
        const userResult = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        let user = userResult[0];

        if (!user) {
            // Generate a random password
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const hashedPassword = await hashValue(randomPassword);

            // First-time login — create user
            // Insert new user and get inserted user back
            const now = new Date();
            const insertedUsers = await db
                .insert(users)
                .values({
                    email,
                    avatarURL: picture,
                    lastOnline: now,
                    isEmailVerified: true,
                    role: AudienceEnum.Guest,
                    password: hashedPassword,
                    createdAt: now,
                    updatedAt: now,
                })
                .returning();

            user = insertedUsers[0];
        }

        const accessToken = await generateToken(res, user.id);

        return res.status(OK).json({
            success: true,
            message: 'Logged in with Google',
            user: {
                _id: user.id,
                email: user.email,
                avatarURL: user.avatarURL,
                role: user.role,
            },
            accessToken,
        });

    } catch (err) {
        console.error('Google login failed:', err);
        return res.status(INTERNAL_SERVER_ERROR).json({ message: 'Google login failed' });
    }
};
