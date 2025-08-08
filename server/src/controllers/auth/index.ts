// src/controllers/auth/index.ts

import * as authControl from "./auth.controller";
import * as avatarController from './avatar.controller';
import * as emailController from './email.controller';
import * as oauthController from './oauth.controller';
import * as passwordControler from './password.controller';
import * as userController from './user.controller';
import * as userSessionController from './user.session.controller';

export const authController = {
  ...authControl,
  ...avatarController,
  ...emailController,
  ...oauthController,
  ...passwordControler,
  ...userController,
  ...userSessionController,
};