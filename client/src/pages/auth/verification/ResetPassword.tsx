import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaLock } from "react-icons/fa";
import { resetPassword } from "../../../api/auth/auth-api";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useToast } from "../../../context/ToastContext";
import { Button } from "../../../components/ui/Button";

const ResetPassword = () => {
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const toast = useToast();

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
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-darkPrimary">
            <div className="max-w-md w-full overflow-hidden">
                <div className="p-8">
                    <h2 className="text-3xl font-bold mb-6 text-center text-primary dark:text-darkTextPrimary">
                        Reset Password
                    </h2>

                    <form onSubmit={handleSubmit}>
                        {/* New Password Field */}
                        <div className="mb-4">
                            <label
                                className="block text-gray-700 dark:text-darkTextSecondary text-sm font-bold mb-2"
                                htmlFor="new-password"
                            >
                                New Password
                            </label>
                            <div className="flex items-center border border-gray-300 dark:border-darkBorderLight rounded px-3 bg-white dark:bg-darkSurface">
                                <FaLock className="text-gray-500 dark:text-darkTextMuted mr-3" />
                                <input
                                    id="new-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="New Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full py-2 px-2 bg-transparent outline-none text-gray-900 dark:text-darkTextPrimary placeholder-gray-400 dark:placeholder-darkTextMuted"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="ml-2 focus:outline-none text-gray-600 dark:text-darkTextMuted hover:text-gray-800 dark:hover:text-darkTextPrimary"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div className="mb-6">
                            <label
                                className="block text-gray-700 dark:text-darkTextSecondary text-sm font-bold mb-2"
                                htmlFor="confirm-password"
                            >
                                Confirm New Password
                            </label>
                            <div className="flex items-center border border-gray-300 dark:border-darkBorderLight rounded px-3 bg-white dark:bg-darkSurface">
                                <FaLock className="text-gray-500 dark:text-darkTextMuted mr-3" />
                                <input
                                    id="confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full py-2 px-2 bg-transparent outline-none text-gray-900 dark:text-darkTextPrimary placeholder-gray-400 dark:placeholder-darkTextMuted"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="ml-2 focus:outline-none text-gray-600 dark:text-darkTextMuted hover:text-gray-800 dark:hover:text-darkTextPrimary"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button isLoading={isLoading} loadingText="Resetting..." fullWidth={true}
                            size="lg">
                            Set New Password
                        </Button>
                    </form>
                </div>
            </div>
        </div>

    );
};

export default ResetPassword;
