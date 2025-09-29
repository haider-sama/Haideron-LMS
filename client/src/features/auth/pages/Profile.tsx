import AvatarUpload from '../components/account/AvatarUpload';
import { Link } from 'react-router-dom';
import { Input, ReadOnlyInput, SelectInput } from '../../../components/ui/Input';
import ErrorPage from '../../../pages/forbidden/ErrorPage';
import { HiExclamationCircle } from 'react-icons/hi';
import { Helmet } from 'react-helmet-async';
import { DegreeEnum } from '../../../../../server/src/shared/enums';
import { useProfile } from '../hooks/useProfile';
import { TeacherQualification } from '../../../../../server/src/shared/interfaces';
import { Button } from '../../../components/ui/Button';

type ProfileProps = {
    onClose?: () => void; // Optional prop
};

const Profile: React.FC<ProfileProps> = ({ onClose }) => {
    const {
        user,
        editFields,
        majorSubjectsBuffer,
        handleChange,
        setMajorSubjectsBuffer,
        handleSave,
        isFormChanged,
        canEditProfile,
        canEditBasicFields,
        canEditTeacherInfo,
        updateQualification,
        removeQualification,
        addQualification,
        isSaving,
    } = useProfile();


    if (!user) return <ErrorPage
        code={404}
        heading="User Not Found"
        message="Oops! The user you're looking for doesn't exist."
        homeUrl="/"
        imageUrl="/astro.png"
    />;

    return (
        <div className="flex justify-center">
            <Helmet>
                <title>Account</title>
            </Helmet>

            <div className="w-full max-w-4xl bg-white">
                <div className='mb-4'>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Account Settings
                    </h2>
                    <p className="text-sm text-gray-600">
                        Update your personal information, email, and preferences to keep your account secure and up-to-date.
                    </p>
                </div>

                <div className="flex flex-col gap-8 items-center">
                    {/* Avatar */}
                    <div className="w-full flex justify-center">
                        <AvatarUpload avatarURL={user.avatarURL} />
                    </div>

                    {/* Inputs */}
                    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {canEditBasicFields ? (
                            <>
                                <Input label="First Name" value={editFields.firstName ?? 'N/A'} onChange={e => handleChange('firstName', e.target.value)} className="col-span-1" />
                                <Input label="Last Name" value={editFields.lastName ?? 'N/A'} onChange={e => handleChange('lastName', e.target.value)} className="col-span-1" />
                                <Input label="Father's Name" value={editFields.fatherName ?? 'N/A'} onChange={e => handleChange('fatherName', e.target.value)} className="col-span-1" />
                                <Input label="City" value={editFields.city ?? 'N/A'} onChange={e => handleChange('city', e.target.value)} className="col-span-1" />
                                <Input label="Country" value={editFields.country ?? 'N/A'} onChange={e => handleChange('country', e.target.value)} className="col-span-1" />
                                <ReadOnlyInput label="Department" value={user.department ?? 'N/A'} className="col-span-1" />
                                <ReadOnlyInput label="Email" value={user.email} className="col-span-1" />
                                <Input label="Address" value={editFields.address ?? 'N/A'} onChange={e => handleChange('address', e.target.value)} className="col-span-1" />

                            </>
                        ) : (
                            <>
                                <ReadOnlyInput label="First Name" value={user.firstName ?? 'N/A'} className="col-span-1" />
                                <ReadOnlyInput label="Last Name" value={user.lastName ?? 'N/A'} className="col-span-1" />
                                <ReadOnlyInput label="Father's Name" value={user.fatherName ?? 'N/A'} className="col-span-1" />
                                <ReadOnlyInput label="City" value={user.city ?? 'N/A'} className="col-span-1" />
                                <ReadOnlyInput label="Country" value={user.country ?? 'N/A'} className="col-span-1" />
                                <ReadOnlyInput label="Department" value={user.department ?? 'N/A'} className="col-span-1" />
                                <ReadOnlyInput label="Email" value={user.email} className="col-span-1" />
                                <ReadOnlyInput label="Address" value={user.address ?? 'N/A'} className="col-span-1" />
                            </>
                        )}
                    </div>
                </div>

                {(editFields.teacherInfo && canEditTeacherInfo) && (
                    <div className="mt-8">
                        <h2 className="text-lg font-semibold mb-4">Teacher Qualifications</h2>
                        <div className="mt-4 border-t pt-4">
                            <h3 className="text-md font-semibold mb-2">Qualifications</h3>

                            {(editFields.teacherInfo.qualifications?.length ?? 0) === 0 && (
                                <div className="text-sm text-gray-500 mb-4">
                                    No qualifications added yet.
                                </div>
                            )}

                            {(editFields.teacherInfo.qualifications ?? []).map((q: TeacherQualification, index: number) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4"
                                >
                                    {canEditTeacherInfo ? (
                                        <>
                                            <SelectInput
                                                label="Degree"
                                                value={q.degree}
                                                onChange={(e) =>
                                                    updateQualification(index, { ...q, degree: e.target.value as DegreeEnum })
                                                }
                                                options={Object.values(DegreeEnum).map((degree) => ({
                                                    label: degree,
                                                    value: degree,
                                                }))}
                                            />
                                            <Input
                                                label="Passing Year"
                                                type="number"
                                                value={q.passingYear.toString()}
                                                onChange={(e) =>
                                                    updateQualification(index, {
                                                        ...q,
                                                        passingYear: parseInt(e.target.value),
                                                    })
                                                }
                                            />
                                            <Input
                                                label="Institution"
                                                value={q.institutionName}
                                                onChange={(e) =>
                                                    updateQualification(index, {
                                                        ...q,
                                                        institutionName: e.target.value,
                                                    })
                                                }
                                            />
                                            <Input
                                                label="Major Subjects (comma-separated)"
                                                value={majorSubjectsBuffer[index] || ""}
                                                onChange={(e) => {
                                                    const updated = [...majorSubjectsBuffer];
                                                    updated[index] = e.target.value;
                                                    setMajorSubjectsBuffer(updated);
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeQualification(index)}
                                                className="text-red-500 border border-red-300 px-2 py-1 rounded text-sm"
                                            >
                                                Remove
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <ReadOnlyInput label="Degree" value={q.degree} />
                                            <ReadOnlyInput label="Passing Year" value={q.passingYear.toString()} />
                                            <ReadOnlyInput label="Institution" value={q.institutionName} />
                                            <ReadOnlyInput
                                                label="Major Subjects"
                                                value={q.majorSubjects?.join(", ") || ""}
                                            />
                                        </>
                                    )}
                                </div>
                            ))}

                            {canEditTeacherInfo && (
                                <button
                                    type="button"
                                    onClick={addQualification}
                                    className="text-sm px-4 py-2 bg-blue-500 text-white rounded mt-2"
                                >
                                    Add Qualification
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Buttons */}
                {canEditProfile && (
                    <div className="mt-8 flex flex-col sm:flex-row justify-center">
                        <div className="w-full sm:w-auto">
                            <Button
                                type="button"
                                onClick={handleSave}
                                disabled={!isFormChanged}
                                isLoading={isSaving}
                                loadingText="Saving..."
                                bg={isFormChanged ? "bg-primary" : "bg-gray-400 cursor-not-allowed"}
                                hoverBg={isFormChanged ? "hover:bg-white" : ""}
                                text="text-white"
                                hoverText={isFormChanged ? "hover:text-gray-800" : ""}
                                size="md"
                                extra='border'
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                )}

                {/* Authentication */}
                <div className="pt-16 flex justify-center">
                    <div className="w-full max-w-3xl bg-white border border-gray-300 shadow-sm rounded-lg p-6 space-y-6">

                        {/* Password and Authentication */}
                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold text-gray-800">
                                Access & Verification
                            </h2>
                            <p className="text-sm text-gray-600">
                                Manage your password and authentication settings to keep your account secure.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link to="/account/forgot-password" onClick={onClose} className="w-full sm:w-auto">
                                    <Button variant="gray" size="md" fullWidth={false}>
                                        Reset Password
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Email Verification */}
                        {!user.isEmailVerified && (
                            <>
                                <hr className="border-gray-200" />

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <HiExclamationCircle className="text-lg text-yellow-600" />
                                        <h3 className="text-sm font-semibold text-yellow-600 animate-pulse">
                                            Email Not Verified
                                        </h3>
                                        <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full font-medium">
                                            Action Required
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 pb-2">
                                        Please verify your email to secure your account and enable full access.
                                    </p>
                                    <Link to="/account/request-email-verification" onClick={onClose} className="w-full sm:w-auto">
                                        <Button size="md" fullWidth={false}>
                                            Verify Email Now
                                        </Button>
                                    </Link>
                                </div>
                            </>
                        )}

                        {/* 2FA Section */}
                        <>
                            <hr className="border-gray-200" />

                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Two-Factor Authentication (2FA)
                                </h3>
                                <p className="text-sm text-gray-600 pb-2">
                                    {user.isTwoFAEnabled
                                        ? "You have 2FA enabled. You can disable it if you no longer want extra security."
                                        : "2FA adds an extra layer of security to your account."}
                                </p>
                                <Link
                                    to={user.isTwoFAEnabled ? "/account/disable-2fa" : "/account/enable-2fa"}
                                    onClick={onClose}
                                    className="w-full sm:w-auto"
                                >
                                    <Button
                                        size="md"
                                        fullWidth={false}
                                        variant={user.isTwoFAEnabled ? "red" : "green"}
                                    >
                                        {user.isTwoFAEnabled ? "Disable 2FA" : "Enable 2FA"}
                                    </Button>
                                </Link>
                            </div>
                        </>

                    </div>
                </div>


            </div>
        </div>
    );
};

export default Profile;