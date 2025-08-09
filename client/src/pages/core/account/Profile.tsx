import AvatarUpload from '../../../components/account/AvatarUpload';
import { getButtonClass } from '../../../components/ui/ButtonClass';
import { Link } from 'react-router-dom';
import { Input, ReadOnlyInput, SelectInput } from '../../../components/ui/Input';
import ErrorPage from '../../forbidden/ErrorPage';
import { HiExclamationCircle } from 'react-icons/hi';
import { GLOBAL_TITLE } from '../../../constants';
import { Helmet } from 'react-helmet-async';
import { DegreeEnum } from '../../../../../server/src/shared/enums';
import { useProfile } from '../../../hooks/auth/useProfile';
import { TeacherQualification } from '../../../../../server/src/shared/interfaces';

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
                <title>{GLOBAL_TITLE} - Account</title>
            </Helmet>

            <div className="w-full max-w-4xl bg-white dark:bg-darkSurface p-6">
                <h1 className="text-2xl font-bold mb-8 text-center text-gray-900 dark:text-darkTextPrimary">Account</h1>

                <div className="flex flex-col gap-8 items-center">
                    {/* Avatar */}
                    <div className="w-full flex justify-center">
                        <AvatarUpload avatarURL={user.avatarURL} />
                    </div>

                    {/* Inputs */}
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {canEditBasicFields ? (
                            <>
                                <Input label="First Name" value={editFields.firstName} onChange={e => handleChange('firstName', e.target.value)} />
                                <Input label="Last Name" value={editFields.lastName} onChange={e => handleChange('lastName', e.target.value)} />
                                <Input label="Father's Name" value={editFields.fatherName} onChange={e => handleChange('fatherName', e.target.value)} />
                                <Input label="City" value={editFields.city} onChange={e => handleChange('city', e.target.value)} />
                                <Input label="Country" value={editFields.country} onChange={e => handleChange('country', e.target.value)} />
                                <ReadOnlyInput label="Email" value={user.email} className="sm:col-span-2" />
                                <Input label="Address" value={editFields.address} onChange={e => handleChange('address', e.target.value)} className="sm:col-span-2" />
                                <ReadOnlyInput label="Department" value={user.department} className="sm:col-span-2" />
                            </>
                        ) : (
                            <>
                                <ReadOnlyInput label="First Name" value={user.firstName ?? ''} />
                                <ReadOnlyInput label="Last Name" value={user.lastName ?? ''} />
                                <ReadOnlyInput label="Father's Name" value={user.fatherName ?? ''} />
                                <ReadOnlyInput label="City" value={user.city ?? ''} />
                                <ReadOnlyInput label="Country" value={user.country ?? ''} />
                                <ReadOnlyInput label="Email" value={user.email} className="sm:col-span-2" />
                                <ReadOnlyInput label="Address" value={user.address ?? ''} className="sm:col-span-2" />
                                <ReadOnlyInput label="Department" value={user.department} className="sm:col-span-2" />
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
                                                    updateQualification(index, { ...q, degree: e.target.value })
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
                    <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                        <div className="w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={!isFormChanged || isSaving}
                                className={getButtonClass({
                                    bg: isFormChanged || isSaving
                                        ? "bg-primary dark:bg-darkBlurple"
                                        : "bg-gray-400 dark:bg-darkMuted cursor-not-allowed",
                                    hoverBg: isFormChanged || isSaving
                                        ? "hover:bg-white dark:hover:bg-darkSurface"
                                        : "",
                                    text: "text-white",
                                    hoverText: isFormChanged || isSaving
                                        ? "hover:text-gray-800 dark:hover:text-white"
                                        : "",
                                    extra:
                                        "w-full text-sm px-4 py-2 transition-all duration-200 font-medium rounded border border-gray-200 dark:border-darkBorderLight",
                                })}
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Authentication */}
                <div className="pt-16 flex flex-col sm:flex-row justify-start gap-4">
                    <div className="space-y-6">
                        <div className="w-full sm:w-auto">
                            <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
                                Password and Authentication
                            </h2>

                            <Link to="/forgot-password" className="block w-full" onClick={onClose}>
                                <button
                                    type="button"
                                    className={getButtonClass({
                                        bg: "bg-yellow-500",
                                        hoverBg: "hover:bg-white dark:hover:bg-darkSurface",
                                        text: "text-white",
                                        hoverText: "hover:text-yellow-600 dark:hover:text-yellow-400",
                                        focusRing: "focus:ring-4 focus:ring-yellow-200",
                                        extra: "w-fit px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all duration-200 border border-gray-200 dark:border-darkBorderLight",
                                    })}
                                >
                                    Reset Password
                                </button>
                            </Link>
                        </div>

                        {/* Email Verification */}
                        {!user.isEmailVerified && (
                            <div className="w-full sm:w-auto">
                                <div className="mb-2 flex items-center gap-2">
                                    <HiExclamationCircle className="text-lg text-yellow-600 dark:text-yellow-400" />
                                    <h3 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 animate-pulse">
                                        Email Not Verified
                                    </h3>
                                    <span className="text-xs bg-yellow-100 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-full font-medium dark:bg-opacity-10">
                                        Action Required
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-darkTextMuted mb-4">
                                    Please verify your email to secure your account and enable full access.
                                </p>

                                <Link to="/request-email-verification" className="block w-full" onClick={onClose}>
                                    <button
                                        type="button"
                                        className={getButtonClass({
                                            bg: "bg-primary dark:bg-darkBlurple",
                                            hoverBg: "hover:bg-white dark:hover:bg-darkSurface",
                                            text: "text-white",
                                            hoverText: "hover:text-gray-800 dark:hover:text-darkBlurple",
                                            focusRing: "focus:ring-4 focus:ring-gray-200 dark:focus:ring-darkBorderLight",
                                            extra: "w-fit px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all duration-200 border border-gray-200 dark:border-darkBorderLight",
                                        })}
                                    >
                                        Verify Email Now
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;