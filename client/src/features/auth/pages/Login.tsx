import { Link, useLocation, useNavigate } from "react-router-dom";
import { LoginFormData } from "../../../shared/constants/core/interfaces";
import { useToast } from "../../../shared/context/ToastContext";
import { useEffect, useRef, useState } from "react";
import { FaEnvelope, FaKey, FaLock } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Button } from '../../../components/ui/Button';
import { useAuth } from "../hooks/useAuth";
import ErrorStatus from "../../../components/ui/ErrorStatus";
import { useForm } from "react-hook-form";

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const [showPassword, setShowPassword] = useState(false);
    const googleBtnRef = useRef<HTMLDivElement | null>(null);
    const { TwoFALogin, is2FARequired, googleLogin, isLoggingIn } = useAuth();

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
                navigate(location.state?.from?.pathname || "/");
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
        TwoFALogin.mutate(data, {
            onSuccess: (res) => {
                // if no 2FA required, redirect here
                if (!res?.twoFARequired) {
                    navigate(location.state?.from?.pathname || "/");
                }
            },
        });
    });


    return (
        <div className="flex min-h-screen bg-white px-4 py-8">

            <div className="hidden md:flex flex-1 justify-center items-center">
                {/* TODO: an image or illustration here later */}
            </div>

            <div className="flex-1 flex justify-center items-center">
                <form
                    onSubmit={onSubmit}
                    className="w-full max-w-sm bg-gray-100 border border-gray-300 p-8 rounded-sm flex flex-col gap-4 shadow-sm"
                >
                    {/* Heading + Register */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Login</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Don't have an account?{" "}
                            <Link to="/register" className="text-blue-600 hover:underline">
                                Register
                            </Link>
                        </p>
                    </div>

                    {/* Email */}
                    <div>
                        <div className="flex justify-between items-baseline">
                            <label className="text-sm font-bold text-gray-800">Email</label>
                            <span className="text-xs text-red-600 uppercase">Required</span>
                        </div>
                        <div className="flex items-center border border-gray-300 rounded px-3 bg-white mt-1">
                            <FaEnvelope className="text-gray-600 mr-3" />
                            <input
                                type="email"
                                placeholder="Email"
                                className="w-full p-2 bg-transparent outline-none text-gray-900 placeholder-gray-400"
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
                            <label className="text-sm font-bold text-gray-800">Password</label>
                            <span className="text-xs text-red-600 uppercase">Required</span>
                        </div>
                        <div className="flex items-center border border-gray-300 rounded px-3 bg-white mt-1">
                            <FaLock className="text-gray-600 mr-3" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                className="w-full p-2 bg-transparent outline-none text-gray-900 placeholder-gray-400"
                                required
                                {...register("password", { required: "This field is required" })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="ml-2 focus:outline-none text-gray-400 hover:text-gray-800"
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

                    {/* 2FA Code - Only show if required */}
                    {is2FARequired && (
                        <div>
                            <label className="text-sm font-bold text-gray-800">2FA Code</label>
                            <div className="flex items-center border border-gray-300 rounded px-3 bg-white mt-1">
                                <FaKey className="text-gray-600 mr-3" />
                                <input
                                    type="text"
                                    placeholder="Enter 2FA Code"
                                    className="w-full p-2 bg-transparent outline-none text-gray-900 placeholder-gray-400"
                                    {...register("twoFAToken", { required: "This field is required" })}
                                />
                            </div>
                            {errors.twoFAToken && <ErrorStatus message={errors.twoFAToken.message} />}
                        </div>
                    )}

                    <Button isLoading={isLoggingIn} loadingText="Logging in..." fullWidth size="lg">
                        {is2FARequired ? "Verify & Login" : "Login"}
                    </Button>

                    {/* Forgot Password */}
                    <div className="flex justify-end">
                        <Link to="/account/forgot-password" className="text-sm text-blue-600 hover:underline">
                            Forgot your password?
                        </Link>
                    </div>

                    {/* Divider Line */}
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 mx-2"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-gray-100 px-2 text-gray-600">
                                Or login with
                            </span>
                        </div>
                    </div>

                    {/* Google Button */}
                    <div ref={googleBtnRef} className="w-full flex justify-center" />
                </form>
            </div>
        </div>
    );
};

export default Login;
