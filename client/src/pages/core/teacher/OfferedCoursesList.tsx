import React, { useEffect, useState } from "react";
import { usePermissions } from "../../../hooks/usePermissions";
import { useDashboards } from "../../../hooks/auth/useDashboards";
import { useToast } from "../../../context/ToastContext";
import { getAllAssignedCourseOfferings } from "../../../api/core/teacher/teacher-course-api";
import { GetAssignedCourseOfferingsResponse } from "../../../constants/core/interfaces";
import { useQuery } from "@tanstack/react-query";
import TopCenterLoader from "../../../components/ui/TopCenterLoader";
import Breadcrumbs, { generateBreadcrumbs } from "../../../components/ui/Breadcrumbs";
import PageHeading from "../../../components/ui/PageHeading";
import { Input, SelectInput } from "../../../components/ui/Input";
import TeacherCourseCard from "../../../components/pages/core/teacher/TeacherCourseCard";
import Modal from "../../../components/ui/Modal";
import ErrorStatus from "../../../components/ui/ErrorStatus";
import { Button } from "../../../components/ui/Button";
import CreateAssessmentForm from "../../../components/pages/core/teacher/assessment/CreateAssessmentForm";
import AssessmentListTable from "../../../components/pages/core/teacher/assessment/AssessmentListTable";
import CourseEnrolledStudentsList from "../../../components/pages/core/teacher/CourseEnrolledStudentsList";
import EditCourseFaculty from "../../../components/pages/core/teacher/EditCourseFaculty";
import { GradingFinalizationForm } from "../../../components/pages/core/teacher/GradingFinalizationForm";

const OfferedCoursesList: React.FC = () => {
    const { user, isLoggedIn } = usePermissions();
    const { faculty: facultyDashboard } = useDashboards(user?.role, isLoggedIn);
    const contextLoading = facultyDashboard.isLoading;
    const dashboardError = facultyDashboard.error;
    const toast = useToast();

    const activatedSemesters = facultyDashboard.data?.activatedSemesters;
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState(search);

    const [modalOpen, setModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editCourseId, setEditCourseId] = useState<string | null>(null);
    const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
    const [assessmentModalData, setAssessmentModalData] = useState<{
        offeringId: string;
        sections: string[];
        selectedSection: string;
    } | null>(null);

    const [studentModalData, setStudentModalData] = useState<{
        offeringId: string;
        sections: string[];
        selectedSection: string;
    } | null>(null);

    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showListModal, setShowListModal] = useState(false);

    // debounce search
    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timeout);
    }, [search]);

    // select active semester by default
    useEffect(() => {
        if (activatedSemesters?.length) {
            const activeSemester = activatedSemesters.find((s) => s.isActive);
            if (activeSemester) setSelectedSemesterId(activeSemester.id);
        }
    }, [activatedSemesters]);

    // Fetch offerings
    const {
        data,
        isLoading,
        isError,
        error
    } = useQuery<GetAssignedCourseOfferingsResponse, Error>({
        queryKey: ["assignedCourseOfferings", selectedSemesterId],
        queryFn: () => getAllAssignedCourseOfferings(selectedSemesterId),
        enabled: !!selectedSemesterId,
        staleTime: 1000 * 60 * 1, // 1 min cache
        retry: false,
    });

    // Handle errors safely
    useEffect(() => {
        if (isError && error) {
            toast.error(error.message || "Failed to load assigned courses");
        }
    }, [isError, error, toast]);

    // Safe access
    const offerings = data?.offerings ?? [];

    // Filter offerings by search query
    const filteredOfferings = offerings.filter((offering) => {
        const q = debouncedSearch.trim().toLowerCase();
        return (
            offering.course.title.toLowerCase().includes(q) ||
            offering.course.code.toLowerCase().includes(q) ||
            offering.assignedSections.join(",").toLowerCase().includes(q)
        );
    });

    // Modal handlers
    const openStudentModal = (offeringId: string, sections: string[]) => {
        setStudentModalData({ offeringId, sections, selectedSection: sections[0] });
        setModalOpen(true);
    };
    const closeStudentModal = () => setModalOpen(false);

    const openEditModal = (courseId: string) => {
        setEditCourseId(courseId);
        setEditModalOpen(true);
    };
    const closeEditModal = () => {
        setEditCourseId(null);
        setEditModalOpen(false);
    };

    const openAssessmentModal = (offeringId: string, sections: string[]) => {
        setAssessmentModalData({ offeringId, sections, selectedSection: sections[0] });
        setAssessmentModalOpen(true);
        setShowCreateModal(false);
        setShowListModal(false);
        setShowFinalizeModal(false);
    };
    const closeAssessmentModal = () => {
        setAssessmentModalOpen(false);
        setAssessmentModalData(null);
    };

    const matchedOffering = offerings.find(
        (o) => o.offeringId === assessmentModalData?.offeringId
    );

    if (dashboardError) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center text-gray-600">
                <p className="text-lg font-semibold">No Courses Are Assigned for This Semester!</p>
            </div>
        );
    }

    if (isLoading || contextLoading) return <TopCenterLoader />;
    if (!activatedSemesters || activatedSemesters.length === 0) {
        return <ErrorStatus message="Something went wrong here. No active semesters found." />;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <Breadcrumbs items={generateBreadcrumbs('/teacher/assigned-courses')} />
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <PageHeading title="Assigned Courses" />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-end">
                    <div className="w-full sm:w-48">
                        <SelectInput
                            name="semester"
                            value={selectedSemesterId}
                            onChange={(e) => setSelectedSemesterId(e.target.value)}
                            options={activatedSemesters
                                .filter((sem) => sem.isActive)
                                .map((sem) => ({
                                    value: sem.id,
                                    label: `Semester ${sem.semesterNo} - ${sem.term}`,
                                }))}
                        />
                    </div>
                    <div className="w-full sm:flex-1">
                        <Input
                            placeholder="Search courses..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <TopCenterLoader />
            ) : filteredOfferings.length === 0 ? (
                <div className="text-center text-gray-600 py-10">No assigned courses found.</div>
            ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {filteredOfferings.map((offering) => (
                        <TeacherCourseCard
                            key={offering.offeringId}
                            title={offering.course.title}
                            code={offering.course.code}
                            onEdit={() => openEditModal(offering.course.id)}
                            onViewStudents={() =>
                                openStudentModal(offering.offeringId, offering.assignedSections)
                            }
                            onViewAssessments={() =>
                                openAssessmentModal(offering.offeringId, offering.assignedSections)
                            }
                        />
                    ))}
                </div>
            )}

            {studentModalData && (
                <Modal isOpen={modalOpen} onClose={closeStudentModal}>
                    <div className="p-6 w-full max-w-4xl mx-auto flex flex-col items-center text-center bg-white dark:bg-darkSurface rounded-xl">
                        <h2 className="text-xl font-semibold mb-6 text-primary dark:text-darkTextPrimary">
                            Students List
                        </h2>

                        <div className="mb-6 w-full max-w-sm text-left">
                            <label className="block mb-1 font-medium text-gray-700 dark:text-darkTextPrimary">
                                Select Section
                            </label>
                            <select
                                className="w-full border border-gray-300 dark:border-darkBorderLight px-3 py-2 rounded bg-white dark:bg-darkMuted text-gray-900 dark:text-darkTextPrimary"
                                value={studentModalData.selectedSection}
                                onChange={(e) =>
                                    setStudentModalData((prev) =>
                                        prev ? { ...prev, selectedSection: e.target.value } : prev
                                    )
                                }
                            >
                                {studentModalData.sections.map((sec) => (
                                    <option key={sec} value={sec}>
                                        Section {sec}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <CourseEnrolledStudentsList
                            offeringId={studentModalData.offeringId}
                            section={studentModalData.selectedSection}
                        />
                    </div>
                </Modal>
            )}

            {editModalOpen && editCourseId && (
                <Modal isOpen={editModalOpen} onClose={closeEditModal}>
                    <EditCourseFaculty courseId={editCourseId} />
                </Modal>
            )}

            {assessmentModalOpen && assessmentModalData && (
                <Modal isOpen={assessmentModalOpen} onClose={closeAssessmentModal}>
                    <div className="p-4 w-full max-w-2xl mx-auto flex flex-col items-center text-center bg-white dark:bg-darkSurface text-gray-900 dark:text-darkTextPrimary">
                        <h2 className="text-xl font-semibold mb-6 text-primary dark:text-darkTextPrimary">Manage Assessments</h2>

                        <div className="mb-6 w-full max-w-md text-left">
                            <SelectInput
                                label="Select Section"
                                value={assessmentModalData.selectedSection}
                                onChange={(e) =>
                                    setAssessmentModalData((prev) =>
                                        prev ? { ...prev, selectedSection: e.target.value } : prev
                                    )
                                }
                                options={assessmentModalData.sections.map((sec) => ({
                                    label: `Section ${sec}`,
                                    value: sec,
                                }))}
                                className="w-full"
                                placeholder="Select a section"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                            <Button onClick={() => setShowCreateModal(true)} fullWidth={false}>
                                Create Assessment
                            </Button>
                            <Button onClick={() => setShowListModal(true)} fullWidth={false} variant="gray">
                                View / Submit Results
                            </Button>
                            <Button onClick={() => setShowFinalizeModal(true)} fullWidth={false} variant="green">
                                Finalize Results
                            </Button>
                        </div>
                    </div>

                </Modal>
            )}

            {showCreateModal && assessmentModalData && matchedOffering && (
                <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
                    <div className="flex items-center justify-center min-h-[60vh] w-full">
                        <CreateAssessmentForm
                            offering={matchedOffering}
                            clos={matchedOffering.course.clos}
                        />
                    </div>
                </Modal>
            )}

            {showListModal && assessmentModalData && matchedOffering && (
                <Modal isOpen={showListModal} onClose={() => setShowListModal(false)}>
                    <div className="min-h-[60vh] flex items-center justify-center p-4">
                        <div className="w-full max-w-6xl bg-white dark:bg-darkSurface text-gray-800 dark:text-darkTextPrimary rounded-lg shadow">
                            <h2 className="text-xl font-semibold mb-4 text-center">
                                Assessments <span className="text-gray-600 dark:text-darkTextMuted">(Section {assessmentModalData.selectedSection})</span>
                            </h2>
                            <AssessmentListTable
                                offeringId={assessmentModalData.offeringId}
                                section={assessmentModalData.selectedSection}
                                clos={matchedOffering.course.clos}
                            />
                        </div>
                    </div>
                </Modal>
            )}

            {showFinalizeModal && assessmentModalData && (
                <Modal isOpen={showFinalizeModal} onClose={() => setShowFinalizeModal(false)}>
                    <div className="min-h-[40vh] flex items-center justify-center">
                        <div className="w-full max-w-2xl">
                            <GradingFinalizationForm
                                courseOfferingId={assessmentModalData.offeringId}
                                section={assessmentModalData.selectedSection}
                            />
                        </div>
                    </div>
                </Modal>
            )}

        </div>
    );
};

export default OfferedCoursesList;