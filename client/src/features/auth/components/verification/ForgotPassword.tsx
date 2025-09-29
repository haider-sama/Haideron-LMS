import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiMail } from "react-icons/fi";
import { forgotPassword, resendPasswordResetEmail } from "../../services/auth-api";
import { useToast } from "../../../../shared/context/ToastContext";
import { Button } from "../../../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { Helmet } from "react-helmet-async";
import { GLOBAL_TITLE } from "../../../../shared/constants";

const ForgotPassword = () => {
    const [email, setEmail] = useState<string>("");
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isResending, setIsResending] = useState(false);
    const toast = useToast();
    const { user, isLoggedIn } = useAuth();

    // set cooldown to 5 minutes
    const RESEND_COOLDOWN = 5 * 60; // 300 seconds

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isSubmitted) {
            // first time sending
            setIsLoading(true);
            try {
                await forgotPassword(email);
                setIsSubmitted(true);
                setResendCooldown(RESEND_COOLDOWN); // start countdown
            } catch (err: any) {
                toast.error(err.message || "Error sending reset link");
            } finally {
                setIsLoading(false);
            }
        } else {
            // resend
            if (resendCooldown > 0) return; // prevent click during cooldown
            setIsResending(true);
            try {
                await resendPasswordResetEmail(email);
                toast.success("Password Reset Email resent.");
                setResendCooldown(RESEND_COOLDOWN); // restart countdown
            } catch (err: any) {
                toast.error(err.message || "Could not resend email.");
            } finally {
                setIsResending(false);
            }
        }
    };

    useEffect(() => {
        if (resendCooldown <= 0) return;

        const timer = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isSubmitted]); // only depends on isSubmitted to start first countdown

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Helmet>
                <title>Forgot Password</title>
            </Helmet>

            <div className="max-w-4xl w-full flex bg-white rounded-xl shadow-lg overflow-hidden border border-gray-300">

                {/* Info Panel */}
                <div className="hidden md:flex w-1/3 flex-col justify-center p-8 bg-gray-50 space-y-6 border-r border-gray-200">
                    {/* Global Title */}
                    <span
                        style={{ fontFamily: "Orbitron, sans-serif" }}
                        className="drop-shadow-sm text-primary text-3xl font-bold"
                    >
                        {GLOBAL_TITLE}
                    </span>

                    {/* Optional User Info */}
                    {user && (
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-gray-800">Hi, {user.firstName ?? "User"}</h3>
                            <span className="inline-block bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
                                {user.email}
                            </span>
                        </div>
                    )}

                    {/* Optional description */}
                    <p className="text-sm text-gray-600">
                        Enter your email to confirm your identity, and we'll send you a link to reset your password.
                    </p>
                </div>

                {/* Form Card */}
                <div className="w-full md:w-2/3 p-8">
                    <form onSubmit={handleFormSubmit} className="space-y-6">

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-gray-700 font-medium">
                                Enter your email address
                            </label>
                            <div className="flex items-center border border-gray-300 rounded-md px-3 bg-white">
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full py-2 px-2 bg-transparent outline-none text-gray-900 placeholder-gray-400"
                                />
                            </div>
                        </div>

                        {/* Back to Login + Submit Button */}
                        <div className="flex justify-between items-center mt-4">
                            {/* Back to Login */}
                            {isLoggedIn && (
                                <Link
                                    to="/login"
                                    className="text-sm text-gray-600 hover:underline flex items-center"
                                >
                                    <FiArrowLeft className="h-4 w-4 mr-2" /> Back to Login
                                </Link>
                            )}

                            {/* Send / Resend Button */}
                            <Button
                                type="submit"
                                isLoading={isLoading || isResending}
                                loadingText={isSubmitted ? "Resending..." : "Sending..."}
                                size="md"
                                fullWidth={false}
                                disabled={isLoading || isResending || resendCooldown > 0}
                            >
                                {isSubmitted
                                    ? resendCooldown > 0
                                        ? `Resend in ${Math.floor(resendCooldown / 60)}:${String(resendCooldown % 60).padStart(2, "0")}`
                                        : "Resend Reset Link"
                                    : "Send Reset Link"}
                            </Button>

                        </div>

                        {/* Success Message */}
                        {isSubmitted && (
                            <div className="text-center mt-6 space-y-4">
                                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                                    <FiMail className="h-8 w-8 text-white" />
                                </div>
                                <p className="text-gray-600">
                                    If an account exists for <span className="font-medium">{email}</span>, you will receive a password reset link shortly.
                                </p>
                            </div>
                        )}
                    </form>
                </div>

            </div>
        </div>


    );
};

export default ForgotPassword;
