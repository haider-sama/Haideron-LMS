import React, { useEffect, useMemo, useState } from "react";
import { usePermissions } from "../../../hooks/usePermissions";
import { useDashboards } from "../../../hooks/auth/useDashboards";
import { useToast } from "../../../context/ToastContext";
import { ActivatedSemester, CourseOffering, EnrollInCoursePayload, SectionTeacher } from "../../../constants/core/interfaces";
import { getCourseOfferings } from "../../../api/core/batch/course-offering-api";
import { deEnrollFromCourse, enrollInCourse, getEnrolledCourses } from "../../../api/core/student-api";
import InternalError from "../../forbidden/InternalError";
import Spinner from "../../../components/ui/Spinner";
import Breadcrumbs, { generateBreadcrumbs } from "../../../components/ui/Breadcrumbs";
import PageHeading from "../../../components/ui/PageHeading";
import { Input, SelectInput } from "../../../components/ui/Input";
import TopCenterLoader from "../../../components/ui/TopCenterLoader";
import StudentCourseCard from "../../../components/pages/core/student/StudentCourseCard";
import Modal from "../../../components/ui/Modal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const StudentCourseEnrollment: React.FC = () => {
    const { user, isLoggedIn } = usePermissions();
    const { student: studentDashboard } = useDashboards(user?.role, isLoggedIn);

    const activatedSemesters = studentDashboard.data?.activatedSemesters ?? [];
    const contextLoading = studentDashboard.isLoading;
    const error = studentDashboard.isError;

    const toast = useToast();
    const queryClient = useQueryClient();

    const [selectedSemester, setSelectedSemester] = useState<ActivatedSemester | null>(null);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const [selectedOffering, setSelectedOffering] = useState<CourseOffering | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showEnrollButtons, setShowEnrollButtons] = useState(true);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [enrollingSection, setEnrollingSection] = useState<string | null>(null);
    const [deEnrollingId, setDeEnrollingId] = useState<string | null>(null);
    const [selectedSectionTeacher, setSelectedSectionTeacher] =
        useState<SectionTeacher | null>(null);

    // Pick latest semester when dashboard loads
    useEffect(() => {
        if (activatedSemesters.length > 0) {
            const sorted = [...activatedSemesters]
                .filter((s) => s.isActive)
                .sort(
                    (a, b) =>
                        new Date(b.createdAt || "").getTime() -
                        new Date(a.createdAt || "").getTime()
                );

            setSelectedSemester(sorted[0] || null);
        }
    }, [activatedSemesters]);

    // Debounce search
    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timeout);
    }, [search]);

    // Queries
    const enrolledQuery = useQuery({
        queryKey: ["student", "enrollments"],
        queryFn: getEnrolledCourses,
        enabled: !!selectedSemester, // only load when semester is picked
    });

    const offeringsQuery = useQuery({
        queryKey: ["student", "offerings", selectedSemester?.id],
        queryFn: () => getCourseOfferings(selectedSemester!.id),
        enabled: !!selectedSemester,
        select: (data) => data.offerings,
    });

    // Mutations
    const enrollMutation = useMutation({
        mutationFn: ({
            offeringId,
            payload,
        }: { offeringId: string; payload: EnrollInCoursePayload }) =>
            enrollInCourse(offeringId, payload),
        onSuccess: () => {
            toast.success("Enrolled successfully");
            queryClient.invalidateQueries({ queryKey: ["student", "enrollments"] });
            setShowModal(false);
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to enroll");
        },
    });

    const deEnrollMutation = useMutation({
        mutationFn: ({
            offeringId,
            payload,
        }: { offeringId: string; payload: EnrollInCoursePayload }) =>
            deEnrollFromCourse(offeringId, payload),
        onSuccess: () => {
            toast.success("De-enrolled successfully");
            queryClient.invalidateQueries({ queryKey: ["student", "enrollments"] });
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to de-enroll");
        },
    });

    // Derived Data
    const offerings = offeringsQuery.data ?? [];
    const enrolledCourses = enrolledQuery.data ?? [];

    const filteredOfferings = useMemo(() => {
        const q = debouncedSearch.trim().toLowerCase();
        return offerings.filter(
            (offering) =>
                offering.course?.title?.toLowerCase().includes(q) ||
                offering.course?.code?.toLowerCase().includes(q)
        );
    }, [offerings, debouncedSearch]);

    const enrollmentDeadlinePassed = selectedSemester?.enrollmentDeadline
        ? new Date() > new Date(selectedSemester.enrollmentDeadline)
        : false;

    const isAlreadyEnrolled = (offeringId: string) =>
        enrolledCourses.some((enr) => enr.courseOffering.id === offeringId);

    const visibleOfferings = filteredOfferings.filter(
        (o) => !isAlreadyEnrolled(o.id)
    );

    if (contextLoading) return <Spinner />;
    if (error) return <InternalError />;
    if (offeringsQuery.isLoading || enrolledQuery.isLoading) return <TopCenterLoader />;

    const filteredEnrolledCourses = enrolledCourses.filter(
        (enrollment) =>
            enrollment.courseOffering.activatedSemester.id === selectedSemester?.id
    );

    const preReqs = selectedOffering?.course.preRequisites ?? [];
    const coReqs = selectedOffering?.course.coRequisites ?? [];

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <Breadcrumbs items={generateBreadcrumbs('/student/course-enrollment')} />

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <PageHeading title="Available Courses" />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <SelectInput
                        name="semester"
                        value={selectedSemester?.id || ""}
                        onChange={(e) => {
                            const found = activatedSemesters.find((s) => s.id === e.target.value);
                            if (found) setSelectedSemester(found);
                        }}
                        options={activatedSemesters
                            .filter((s) => s.isActive)
                            .map((sem) => ({
                                value: sem.id,
                                label: `Semester ${sem.semesterNo} - ${sem.term}`,
                            }))
                        }
                    />
                    <Input
                        type="text"
                        placeholder="Search courses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {visibleOfferings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4">
                    {visibleOfferings.map((offering) => {

                        return (
                            <StudentCourseCard
                                key={offering.id}
                                title={offering.course.title}
                                code={offering.course.code}
                                isEnrolled={false}
                                onEnrollClick={
                                    enrollmentDeadlinePassed
                                        ? undefined
                                        : () => {
                                            setSelectedOffering(offering);
                                            setShowEnrollButtons(true);
                                            setShowModal(true);
                                        }
                                }
                                onViewClick={() => {
                                    setSelectedOffering(offering);
                                    setShowEnrollButtons(false);
                                    setSelectedSectionTeacher(null);
                                    setShowModal(true);
                                }}
                                showEnrollButtons={true}
                            />
                        );
                    })}
                </div>
            ) : (
                <p className="text-center text-gray-600 mt-16 dark:text-darkTextSecondary">You’re all caught up — check back later!</p>
            )}


            <PageHeading
                title="Enrolled Courses"
                className="mt-16 text-primary"
                subtitle="View your enrolled courses for the selected semester."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4">
                {filteredEnrolledCourses.map((enrollment) => {
                    const course = enrollment.courseOffering.course;

                    return (
                        <StudentCourseCard
                            key={enrollment.id}
                            title={course.title}
                            code={course.code}
                            isEnrolled={true}
                            onDeEnrollClick={
                                enrollmentDeadlinePassed
                                    ? undefined
                                    : () => {
                                        deEnrollMutation.mutate({
                                            offeringId: enrollment.courseOffering.id,
                                            payload: {
                                                section: enrollment.section,
                                            },
                                        });
                                        setDeEnrollingId("");
                                    }
                            }
                            isDeEnrolling={deEnrollingId === enrollment.id}
                            enrollmentDeadline={selectedSemester?.enrollmentDeadline?.toString()}
                            onViewClick={() => {
                                setSelectedOffering(enrollment.courseOffering as any);
                                setSelectedSection(enrollment.section);
                                setSelectedSectionTeacher(enrollment.sectionTeacher);
                                setShowEnrollButtons(false);
                                setShowModal(true);
                            }}
                            showEnrollButtons={false}
                        />
                    );
                })}
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
                {selectedOffering && (
                    <div className="max-w-3xl mx-auto px-4 py-6">
                        <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-darkTextPrimary">
                            {selectedOffering.course.title}
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 mb-10 text-sm text-gray-800 dark:text-darkTextSecondary">
                            {[
                                ["Code", selectedOffering.course.code],
                                ["Code Prefix", selectedOffering.course.codePrefix || "-"],
                                ["Title", selectedOffering.course.title],
                                ["Credit Hours", selectedOffering.course.creditHours],
                                ["Contact Hours", selectedOffering.course.contactHours],
                                ["Level", selectedOffering.course.subjectLevel],
                                ["Type", selectedOffering.course.subjectType],
                                ["Domain", selectedOffering.course.domain || "-"],
                                ["Knowledge Area", selectedOffering.course.knowledgeArea || "-"],
                            ].map(([label, value]) => (
                                <div key={label} className="flex gap-2">
                                    <span className="font-semibold min-w-[9rem]">{label}:</span>
                                    <span className="text-gray-700 dark:text-darkTextMuted">{value}</span>
                                </div>
                            ))}

                            {selectedSection && (
                                <div className="flex gap-2">
                                    <span className="font-semibold min-w-[9rem]">Section:</span>
                                    <span className="text-gray-700 dark:text-darkTextMuted">{selectedSection}</span>
                                </div>
                            )}

                            {showEnrollButtons === false && selectedSectionTeacher && (
                                <div className="flex gap-2">
                                    <span className="font-semibold min-w-[9rem]">Teacher:</span>
                                    <span className="text-gray-700 dark:text-darkTextMuted">
                                        {selectedSectionTeacher.name} ({selectedSectionTeacher.email})
                                    </span>
                                </div>
                            )}
                        </div>

                        {preReqs.length > 0 && (
                            <div className="mb-10 px-2 sm:px-4">
                                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-darkTextPrimary">
                                    Prerequisites
                                </h3>
                                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-darkTextMuted">
                                    {preReqs.map((pre, idx) => (
                                        <li key={idx}>{pre.preReqCourseId}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Co-requisites */}
                        {coReqs.length > 0 && (
                            <div className="mb-10 px-2 sm:px-4">
                                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-darkTextPrimary">
                                    Co-requisites
                                </h3>
                                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-darkTextMuted">
                                    {coReqs.map((co, idx) => (
                                        <li key={idx}>{co.coReqCourseId}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="mb-10 px-2 sm:px-4">
                            <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-darkTextPrimary">
                                Description
                            </h3>
                            <p className="text-sm text-gray-700 dark:text-darkTextMuted">
                                {selectedOffering.course.description || "No description provided."}
                            </p>
                        </div>

                        {showEnrollButtons && (
                            <div className="text-center">
                                <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-darkTextPrimary">
                                    Available Sections
                                </h3>
                                <div className="flex flex-wrap justify-center gap-3">
                                    {Object.keys(selectedOffering.sectionSchedules ?? {}).map((section) => (
                                        <button
                                            key={section}
                                            disabled={enrollingSection !== null}
                                            onClick={() => {
                                                enrollMutation.mutate({
                                                    offeringId: selectedOffering!.id,
                                                    payload: { section },
                                                });
                                                setEnrollingSection("");
                                            }}

                                            className={`px-4 py-2 rounded-md border transition text-sm font-medium
                                            ${enrollingSection === section
                                                    ? "bg-gray-300 dark:bg-darkMuted text-gray-600 dark:text-darkTextMuted cursor-wait border-gray-300 dark:border-darkBorderMuted"
                                                    : "bg-blue-200 dark:bg-darkBlurple text-blue-600 dark:text-darkTextPrimary hover:bg-white dark:hover:bg-darkBlurpleHover border-gray-200 dark:border-darkBorderLight focus:ring-4 focus:ring-blue-200 dark:focus:ring-darkTextSecondary/30"
                                                }`}
                                        >
                                            {enrollingSection === section
                                                ? "Enrolling..."
                                                : `Enroll in Section ${section}`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

        </div>
    );
};

export default StudentCourseEnrollment;
