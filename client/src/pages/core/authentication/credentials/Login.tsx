import { Link, useLocation, useNavigate } from "react-router-dom";
import { LoginFormData } from "../../../../constants/core/interfaces";
import { useToast } from "../../../../context/ToastContext";
import { useEffect, useRef, useState } from "react";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { PrimaryButton } from '../../../../components/ui/Button';
import { useAuth } from "../../../../hooks/auth/useAuth";
import ErrorStatus from "../../../../components/ui/ErrorStatus";
import { useForm } from "react-hook-form";

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const [showPassword, setShowPassword] = useState(false);
    const googleBtnRef = useRef<HTMLDivElement | null>(null);
    const { emailLogin, googleLogin } = useAuth();

    useEffect(() => {
        if (!window.google || !googleBtnRef.current) return;

        window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID!,
            callback: handleGoogleResponse,
        });

        window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            width: 240,
        });
    }, []);

    const handleGoogleResponse = (response: any) => {
        const idToken = response.credential;
        googleLogin.mutate(idToken, {
            onSuccess: () => {
                toast.success("Logged in with Google");
                navigate(location.state?.from?.pathname || "/account");
            },
            onError: (err: any) => {
                toast.error(err?.response?.data?.message || "Google login failed");
            },
        });
    };

    const {
        register,
        formState: { errors },
        handleSubmit,
    } = useForm<LoginFormData>();

    const onSubmit = handleSubmit((data) => {
        emailLogin.mutate(data, {
            onSuccess: () => {
                toast.success("Login Successful!");
                navigate(location.state?.from?.pathname || "/account");
            },
            onError: (err: any) => {
                const errorData = err?.response?.data;
                if (Array.isArray(errorData?.errors)) {
                    errorData.errors.forEach((e: { message: string }) => toast.error(e.message));
                } else {
                    toast.error(errorData?.message || "Login failed");
                }
            },
        });
    });

    const isLoggingIn = emailLogin.isPending || googleLogin.isPending;

    return (
        <div className="flex items-center justify-center min-h-screen bg-white dark:bg-darkPrimary px-4 py-8">
            <form
                onSubmit={onSubmit}
                className="w-full max-w-md bg-gray-100 border border-gray-300 dark:bg-darkSurface dark:border-darkBorderLight p-8 rounded-md flex flex-col gap-6 shadow-sm"
            >
                {/* Heading + Register */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Login</h2>
                    <p className="text-sm text-gray-700 dark:text-gray-400 mt-1">
                        Don't have an account?{" "}
                        <Link to="/register" className="text-blue-600 hover:underline">
                            Register
                        </Link>
                    </p>
                </div>

                {/* Email */}
                <div>
                    <div className="flex justify-between items-baseline">
                        <label className="text-sm font-bold text-gray-800 dark:text-gray-300">Email</label>
                        <span className="text-xs text-red-600 uppercase">Required</span>
                    </div>
                    <div className="flex items-center border border-gray-300 dark:border-darkBorderLight rounded px-3 bg-white dark:bg-darkSurface mt-1">
                        <FaEnvelope className="text-gray-600 dark:text-gray-400 mr-3" />
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full py-2 px-2 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-darkTextMuted"
                            required
                            {...register("email", { required: "This field is required" })}
                        />
                    </div>
                    {errors.email && (
                        <div className="flex flex-col gap-2 w-full">
                            <ErrorStatus message={errors.email?.message} />
                        </div>
                    )}
                </div>

                {/* Password */}
                <div>
                    <div className="flex justify-between items-baseline">
                        <label className="text-sm font-bold text-gray-800 dark:text-gray-300">Password</label>
                        <span className="text-xs text-red-600 uppercase">Required</span>
                    </div>
                    <div className="flex items-center border border-gray-300 dark:border-darkBorderLight rounded px-3 bg-white dark:bg-darkSurface mt-1">
                        <FaLock className="text-gray-600 dark:text-gray-400 mr-3" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            className="w-full py-2 px-2 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-darkTextMuted"
                            required
                            {...register("password", { required: "This field is required" })}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="ml-2 focus:outline-none text-gray-400 hover:text-gray-800 dark:text-darkTextMuted dark:hover:text-white"
                            tabIndex={-1}
                        >
                            {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                        </button>
                    </div>
                    {errors.password && (
                        <div className="flex flex-col gap-2 w-full">
                            <ErrorStatus message={errors.password?.message} />
                        </div>
                    )}
                </div>

                {/* Login Button */}
                <PrimaryButton isLoading={isLoggingIn} loadingText="Logging in...">
                    Login
                </PrimaryButton>

                {/* Forgot Password */}
                <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline dark:text-darkBlurple">
                        Forgot your password?
                    </Link>
                </div>

                {/* Divider Line */}
                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-darkBorderLight mx-2"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-gray-100 dark:bg-darkSurface px-2 text-gray-600 dark:text-gray-400">
                            Or login with
                        </span>
                    </div>
                </div>

                {/* Google Button */}
                <div ref={googleBtnRef} className="w-full flex justify-center" />
            </form>
        </div>
    );
};

export default Login;
