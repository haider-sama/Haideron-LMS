import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { resetPassword } from "../../services/auth-api";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useToast } from "../../../../shared/context/ToastContext";
import { Button } from "../../../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { GLOBAL_TITLE } from "../../../../shared/constants";
import { Helmet } from "react-helmet-async";

const ResetPassword = () => {
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            if (token) {
                await resetPassword(token, password);
                toast.success("Password reset successfully, redirecting to login page...");
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } else {
                toast.error("Invalid token, please try again.");
            }
        } catch (error: any) {
            toast.error(error.message || "Error resetting password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Helmet>
                <title>Reset Password</title>
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

                    {/* User Info */}
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
                        Set a new password to secure your account. Make sure it is strong and unique.
                    </p>
                </div>

                {/* Form Card */}
                <div className="w-full md:w-2/3 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* New Password Field */}
                        <div className="space-y-2">
                            <label htmlFor="new-password" className="block text-gray-700 font-medium">
                                New Password
                            </label>
                            <div className="flex items-center border border-gray-300 rounded-md px-3 bg-white">
                                <input
                                    id="new-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="New Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full py-2 px-2 bg-transparent outline-none text-gray-900 placeholder-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="ml-2 focus:outline-none text-gray-600 hover:text-gray-800"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                            <label htmlFor="confirm-password" className="block text-gray-700 font-medium">
                                Confirm Password
                            </label>
                            <div className="flex items-center border border-gray-300 rounded-md px-3 bg-white">
                                <input
                                    id="confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full py-2 px-2 bg-transparent outline-none text-gray-900 placeholder-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="ml-2 focus:outline-none text-gray-600 hover:text-gray-800"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <Button
                                isLoading={isLoading}
                                loadingText="Resetting..."
                                fullWidth={false}
                                size="md"
                            >
                                Set New Password
                            </Button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default ResetPassword;
