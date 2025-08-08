// import mongoose from "mongoose";
// import { compareValue, hashValue } from "../../utils/bcrypt";
// import {
//     AudienceEnum, DegreeEnum,
//     DepartmentEnum, FacultyTypeEnum,
//     TeacherDesignationEnum
// } from "../../shared/enums";
// import { ForumBadgeEnum } from "../../shared/social.enums";

// export interface UserDocument extends mongoose.Document {
//     _id: mongoose.Types.ObjectId;
//     email: string;
//     password: string;
//     displayName?: string;
//     fatherName: string;
//     firstName: string;
//     lastName: string;
//     city: string;
//     country: string;
//     avatarURL?: string;
//     lastOnline: string;
//     address: string;
//     isEmailVerified: boolean;
//     pendingEmail: string | null;
//     emailChangeToken: string | null;
//     emailChangeExpiresAt: Date | null,
//     role: AudienceEnum;
//     department: DepartmentEnum;
//     resetPasswordToken: string | null,
//     tokenVersion: number,
//     resetPasswordExpiresAt: Date | null,
//     createdAt: Date | null,
//     updatedAt: Date | null,
//     comparePassword: (enteredPassword: string) => Promise<boolean>;
//     omitPassword(): Omit<UserDocument, "password">;
//     teacherInfo?: {
//         designation: string;
//         joiningDate: Date | null;
//         facultyType: string;
//         subjectOwner: boolean;
//         qualifications: {
//             degree: string;
//             passingYear: number;
//             institutionName: string;
//             majorSubjects: string[];
//         }[];
//     };
//     forumProfile?: {
//         username: string;
//         displayName?: string;
//         bio?: string;
//         signature?: string;
//         interests?: string[];
//         badges?: string[];
//         reputation?: number;
//         visibility?: "public" | "private";
//         postCount?: number;
//         commentCount?: number;
//         joinedAt?: Date;
//     };
// };

// const TeacherQualificationSchema = new mongoose.Schema({
//     degree: {
//         type: String,
//         enum: Object.values(DegreeEnum),
//         required: true,
//     },
//     passingYear: { type: Number, required: true },
//     institutionName: { type: String, required: true },
//     majorSubjects: [{ type: String, required: true }],
// }, { _id: false });

// const TeacherInfoSchema = new mongoose.Schema({
//     designation: {
//         type: String,
//         enum: Object.values(TeacherDesignationEnum),
//         required: true,
//     },
//     joiningDate: { type: Date, required: true },
//     facultyType: {
//         type: String,
//         enum: Object.values(FacultyTypeEnum),
//         required: true,
//     },
//     subjectOwner: { type: Boolean, default: false },
//     qualifications: [TeacherQualificationSchema],
// }, { _id: false });

// const ForumProfileSchema = new mongoose.Schema({
//     username: { type: String, unique: true, required: true }, // unique handle
//     displayName: { type: String }, // not unique, for name display
//     bio: { type: String, default: "" },
//     signature: { type: String, default: "" },
//     interests: [{ type: String }],
//     badges: [{
//         type: String,
//         enum: Object.values(ForumBadgeEnum),
//     }],
//     reputation: { type: Number, default: 0 },
//     visibility: {
//         type: String,
//         enum: ["public", "private"],
//         default: "public",
//     },
//     postCount: { type: Number, default: 0 },
//     commentCount: { type: Number, default: 0 },
//     joinedAt: { type: Date, default: Date.now },
// }, { _id: false });


// const UserSchema = new mongoose.Schema({
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     fatherName: { type: String },
//     firstName: { type: String },
//     lastName: { type: String },
//     city: { type: String },
//     country: { type: String },
//     avatarURL: { type: String, default: null },
//     lastOnline: { type: Date, required: true },
//     address: { type: String },
//     isEmailVerified: { type: Boolean, default: false },
//     pendingEmail: { type: String, default: null },
//     emailChangeToken: { type: String, default: null },
//     emailChangeExpiresAt: { type: Date, default: null },
//     role: {
//         type: String,
//         enum: Object.values(AudienceEnum),
//         required: true,
//         default: AudienceEnum.User, // or Audience.Student depending on your logic
//     },
//     department: {
//         type: String,
//         enum: Object.values(DepartmentEnum),
//         required: false,
//     },
//     resetPasswordToken: {
//         type: String,
//         default: null
//     },
//     resetPasswordExpiresAt: {
//         type: Date,
//         default: null,
//     },
//     tokenVersion: {
//         type: Number,
//         default: 0,
//     },
//     teacherInfo: {
//         type: TeacherInfoSchema,
//         default: null,
//     },
//     forumProfile: {
//         type: ForumProfileSchema,
//         default: () => ({}), // Important: initialize with default object
//     },
// },
//     {
//         timestamps: true,
//     }
// );

// UserSchema.pre("validate", function (next) {
//     if (this.role === AudienceEnum.DepartmentTeacher && !this.teacherInfo) {
//         return next(new Error("TeacherInfo is required for DepartmentTeacher role"));
//     }
//     next();
// });

// // Encrypt password before saving
// UserSchema.pre("save", async function (next) {
//     if (!this.isModified("password")) {
//         return next();
//     }

//     this.password = await hashValue(this.password);
//     return next();
// });

// UserSchema.methods.comparePassword = async function (val: string) {
//     return compareValue(val, this.password);
// };

// UserSchema.methods.omitPassword = function () {
//     const user = this.toObject();
//     delete user.password;
//     return user;
// };

// const User = mongoose.model<UserDocument>("User", UserSchema);
// export default User;