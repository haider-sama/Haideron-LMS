// import mongoose from "mongoose";
// import { VerificationCodeType } from "../../shared/enums";
// import { fifteenMinutesFromNow } from "../../utils/date";

// export interface VerificationCodeDocument extends mongoose.Document {
//     userId: mongoose.Types.ObjectId;
//     type: VerificationCodeType;
//     code: string;
//     expiresAt: Date;
//     lastSentAt: Date;
// }

// const verificationCodeSchema = new mongoose.Schema<VerificationCodeDocument>({
//     userId: {
//         ref: "User",
//         type: mongoose.Schema.Types.ObjectId,
//         required: true,
//         index: true,
//     },
//     type: {
//         type: String,
//         enum: Object.values(VerificationCodeType),
//         required: true,
//     },
//     code: {
//         type: String,
//         required: true,
//         match: [/^\d{6}$/, "Verification code must be a 6-digit number"], // Ensures only 6-digit numbers
//     },
//     expiresAt: { 
//         type: Date, 
//         required: true, 
//         default: () => fifteenMinutesFromNow() ,
//         index: { expireAfterSeconds: 0 }, // TTL index(expire after 15 minutes)
//     },
//     lastSentAt: { type: Date, default: Date.now() }
// },
//     { timestamps: true }
// );

// const VerificationCodeModel = mongoose.model<VerificationCodeDocument>(
//     "VerificationCode",
//     verificationCodeSchema,
//     "verification_codes"
// );
// export default VerificationCodeModel;