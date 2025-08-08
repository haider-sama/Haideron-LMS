import nodemailer, { SentMessageInfo } from 'nodemailer';
import {
    EMAIL_CHANGED_NOTIFICATION_TEMPLATE,
    PASSWORD_RESET_REQUEST_TEMPLATE,
    PASSWORD_RESET_SUCCESS_TEMPLATE,
    VERIFICATION_EMAIL_TEMPLATE,
} from './emailTemplates';
import dotenv from "dotenv";
dotenv.config();

const sender = 'vegeta.khan2000@gmail.com'; // Replace with your email

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587, // Use 465 for SSL or 587 for TLS
    secure: false, // true for port 465, false for 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
    },
});

export const sendVerificationEmail = async (email: string, verificationToken: string): Promise<SentMessageInfo> => {
    const mailOptions = {
        from: sender,
        to: email,
        subject: "Verify your email",
        html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
    };

    try {
        const response = await transporter.sendMail(mailOptions);
        console.log("Verification email sent successfully", response);
        return response;
    } catch (error) {
        console.error("Error sending verification email", error);
        throw new Error(`Error sending verification email: ${error}`);
    }
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<SentMessageInfo> => {
    const mailOptions = {
        from: sender,
        to: email,
        subject: "Welcome to Auth Company",
        html: `<h1>Welcome, ${name}!</h1><p>Thank you for joining Auth Company.</p>`,
    };

    try {
        const response = await transporter.sendMail(mailOptions);
        console.log("Welcome email sent successfully", response);
        return response;
    } catch (error) {
        console.error("Error sending welcome email", error);
        throw new Error(`Error sending welcome email: ${error}`);
    }
};

export const sendPasswordResetEmail = async (email: string, resetURL: string): Promise<SentMessageInfo> => {
    const mailOptions = {
        from: sender,
        to: email,
        subject: "Reset your password",
        html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
    };

    try {
        const response = await transporter.sendMail(mailOptions);
        console.log("Password reset email sent successfully", response);
        return response;
    } catch (error) {
        console.error("Error sending password reset email", error);
        throw new Error(`Error sending password reset email: ${error}`);
    }
};

export const sendResetSuccessEmail = async (email: string): Promise<SentMessageInfo> => {
    const mailOptions = {
        from: sender,
        to: email,
        subject: "Password Reset Successful",
        html: PASSWORD_RESET_SUCCESS_TEMPLATE,
    };

    try {
        const response = await transporter.sendMail(mailOptions);
        console.log("Password reset success email sent successfully", response);
        return response;
    } catch (error) {
        console.error("Error sending password reset success email", error);
        throw new Error(`Error sending password reset success email: ${error}`);
    }
};

export const sendEmailChangedNotification = async (
    oldEmail: string,
    newEmail: string
): Promise<SentMessageInfo> => {
    const mailOptions = {
        from: sender,
        to: oldEmail,
        subject: "Your account email has been changed",
        html: EMAIL_CHANGED_NOTIFICATION_TEMPLATE(oldEmail, newEmail),
    };

    try {
        const response = await transporter.sendMail(mailOptions);
        console.log("Email change notification sent successfully", response);
        return response;
    } catch (error) {
        console.error("Error sending email change notification", error);
        throw new Error(`Error sending email change notification: ${error}`);
    }
};