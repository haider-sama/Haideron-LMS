import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import PasswordStrengthMeter from '../components/account/PasswordMeter';
import { RegisterFormData, RegisterPayload } from '../../../shared/constants/core/interfaces';
import * as authAPI from '../services/auth-api';
import { useToast } from '../../../shared/context/ToastContext';
import { useEffect, useRef, useState } from 'react';
import { FaEnvelope, FaLock } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import ErrorStatus from '../../../components/ui/ErrorStatus';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../../../components/ui/Button';

const Register = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const toast = useToast();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const googleBtnRef = useRef<HTMLDivElement | null>(null);
    const { googleLogin } = useAuth();
    const location = useLocation();

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
        watch,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>();

    const mutation = useMutation({
        mutationFn: (data: RegisterFormData) => {
            const registrationData: RegisterPayload = {
                email: data.email,
                password: data.password,
            };
            return authAPI.register(registrationData);
        },
        onSuccess: async () => {
            toast.success('Registration successful! Please check your email to confirm your account.');
            await queryClient.invalidateQueries({ queryKey: ['validateToken'] });
            toast.neutral('Waiting for email confirmation...', 8000);
            navigate('/account/verify-email');
        },
        onError: (error: any) => {
            const responseData = error.response?.data;

            if (responseData?.errors?.length) {
                responseData.errors.forEach((err: { field: string; message: string }) => {
                    toast.error(err.message);
                });
            } else {
                const errorMessage =
                    responseData?.message || error.message || 'An unexpected error occurred';
                toast.error(errorMessage);
            }
        },
    });


    const passwordValue = watch('password', '');

    const onSubmit = handleSubmit((data) => {
        mutation.mutate(data);
    });

    return (
        <div className="flex min-h-screen bg-white px-4 py-8">
            <div className="hidden md:flex flex-1 justify-center items-center">
                {/* TODO: an image or illustration here later */}
            </div>

            <div className="flex-1 flex justify-center items-center">
                <form
                    className="w-full max-w-md bg-gray-100 border border-gray-300 p-8 rounded-sm flex flex-col gap-6 shadow-sm"
                    onSubmit={onSubmit}
                >
                    {/* Heading */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                        <p className="text-sm text-gray-700 mt-1">
                            Already registered?{" "}
                            <Link to="/login" className="text-blue-600 hover:underline">
                                Login here
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
                                className="w-full py-2 px-2 bg-transparent outline-none text-gray-900 placeholder-gray-400"
                                required
                                {...register('email', { required: 'This field is required' })}
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
                                className="w-full py-2 px-2 bg-transparent outline-none text-gray-900 placeholder-gray-400"
                                required
                                {...register('password', { required: 'This field is required' })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="ml-2 focus:outline-none text-gray-400"
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
                        <PasswordStrengthMeter password={passwordValue} />
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <div className="flex justify-between items-baseline">
                            <label className="text-sm font-bold text-gray-800">Confirm Password</label>
                            <span className="text-xs text-red-600 uppercase">Required</span>
                        </div>
                        <div className="flex items-center border border-gray-300 rounded px-3 bg-white mt-1">
                            <FaLock className="text-gray-600 mr-3" />
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm Password"
                                className="w-full py-2 px-2 bg-transparent outline-none text-gray-900 placeholder-gray-400"
                                required
                                {...register('confirmPassword', {
                                    validate: (val) => {
                                        if (!val) return 'This field is required';
                                        if (watch('password') !== val) return 'Your passwords do not match';
                                    }
                                })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                className="ml-2 focus:outline-none text-gray-400"
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <span className="text-red-600 text-sm">{errors.confirmPassword.message}</span>
                        )}
                        {errors.confirmPassword && (
                            <div className="flex flex-col gap-2 w-full">
                                <ErrorStatus message={errors.confirmPassword?.message} />
                            </div>
                        )}
                    </div>

                    {/* Register Button */}
                    <Button isLoading={mutation.isPending} loadingText="Registering..." fullWidth={true}
                        size='lg'>
                        Register
                    </Button>

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
                                Or register with
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

export default Register;
