// import mongoose, { Schema } from "mongoose";

// const UserSessionSchema = new Schema(
//     {
//         userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
//         ip: String,
//         userAgent: {
//             browser: String,
//             os: String,
//             device: String,
//             raw: String,
//         },
//         lastUsed: { 
//             type: Date, 
//             default: Date.now,
//             expires: 60 * 60 * 24 * 7, // 7 days in seconds
//         },
//     },
//     { timestamps: true }
// );

// const UserSession = mongoose.model("UserSession", UserSessionSchema);
// export default UserSession;