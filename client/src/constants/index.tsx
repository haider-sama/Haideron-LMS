import { IconType } from 'react-icons';
import { AudienceEnum } from '../../../server/src/shared/enums';
import { FaHome, FaGraduationCap, FaFileAlt, FaBookOpen, FaChalkboardTeacher, FaUsersCog, FaComments } from "react-icons/fa";
import { HiAcademicCap, HiOutlineUserAdd } from "react-icons/hi";
import { MdAdminPanelSettings, MdDashboard, MdListAlt, MdManageAccounts, MdPersonAddAlt1, MdRateReview } from "react-icons/md";
import { RiGraduationCapFill } from "react-icons/ri";
import { FiBookOpen, FiUserCheck } from "react-icons/fi";
import { BsBookHalf } from "react-icons/bs";

export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

export const GLOBAL_TITLE = "HaideronOS";
export const ALLOW_PUBLIC_REGISTRATION: boolean = true;
export const ALLOW_EMAIL_MIGRATION: boolean = false;

export const MOBILE_BREAKPOINT = 768; // px, adjust if needed
export const MAX_PAGE_LIMIT = 10;

// Define roles to restrict FROM
export const restrictedRoles = [
    AudienceEnum.Admin,
];

// Function to get available roles based on current user's role
export const getAvailableRoles = (currentUserRole: AudienceEnum) => {
    if (currentUserRole === AudienceEnum.Admin) {
        return Object.values(AudienceEnum); // Admin sees all roles
    } else {
        return Object.values(AudienceEnum).filter(role => !restrictedRoles.includes(role)); // Others see limited
    }
};

export interface NavLink {
    label: string;
    href: string;
    icon: IconType;
    subLinks?: NavLink[]; // Optional for parent links
    roles?: string[]; // Optional, e.g., ["Admin"]
}

export const navLinks: NavLink[] = [
    {
        label: 'Home',
        href: '/',
        icon: FaHome,
    },
    {
        label: 'Admin Panel',
        href: '#',
        icon: MdAdminPanelSettings,
        roles: [AudienceEnum.Admin], // Only show to Admins
        subLinks: [
            { label: 'User Registration', href: '/admin/user-registration', icon: HiOutlineUserAdd, roles: [AudienceEnum.Admin] },
            { label: 'User Management', href: '/admin/user-management', icon: MdManageAccounts, roles: [AudienceEnum.Admin] },
        ],
    },
    {
        label: 'Program Management',
        href: '/faculty/programs',
        icon: RiGraduationCapFill,
        roles: [AudienceEnum.Admin, AudienceEnum.DepartmentHead],
    },
    {
        label: 'Catalogue Management',
        href: '/faculty/catalogues',
        icon: BsBookHalf,
        roles: [AudienceEnum.Admin, AudienceEnum.DepartmentHead],
    },
    {
        label: 'Course Management',
        href: '/faculty/semesters/courses/',
        icon: FiBookOpen,
        roles: [AudienceEnum.Admin, AudienceEnum.DepartmentHead],
    },
    {
        label: 'Faculty Management',
        href: '/faculty/members',
        icon: FiUserCheck,
        roles: [AudienceEnum.Admin, AudienceEnum.DepartmentHead],
    },
    {
        label: 'Session Management',
        href: '#',
        icon: HiAcademicCap,
        roles: [AudienceEnum.Admin, AudienceEnum.DepartmentHead],
        subLinks: [
            { label: 'Batch Management', href: '/batches', icon: FaUsersCog, roles: [AudienceEnum.Admin, AudienceEnum.DepartmentHead] },
            { label: 'Register Batch Students', href: '/batches/enrollments/student-batch', icon: MdPersonAddAlt1, roles: [AudienceEnum.Admin, AudienceEnum.DepartmentHead] },
            { label: 'Batch Student List', href: '/batches/enrollments/student-list', icon: MdListAlt, roles: [AudienceEnum.Admin, AudienceEnum.DepartmentHead] },
            { label: 'Review Pending Results', href: '/faculty/pending-results', icon: MdRateReview, roles: [AudienceEnum.DepartmentHead] },
        ],
    },
    {
        label: 'My Learning',
        href: '#',
        icon: FaGraduationCap,
        roles: [AudienceEnum.Student],
        subLinks: [
            { label: 'Course Enrollment', href: '/student/course-enrollment', icon: FaBookOpen, roles: [AudienceEnum.Student] },
            { label: 'Academic Transcript', href: '/student/transcript', icon: FaFileAlt, roles: [AudienceEnum.Student] },
            { label: 'Dashboard', href: '/student/dashboard', icon: FaFileAlt, roles: [AudienceEnum.Student] },
        ],
    },
    {
        label: 'Teacher Dashboard',
        href: '#',
        icon: MdDashboard,
        roles: [AudienceEnum.DepartmentTeacher],
        subLinks: [
            { label: 'Assigned Courses', href: '/teacher/assigned-courses', icon: FaChalkboardTeacher, roles: [AudienceEnum.DepartmentTeacher] },
        ],
    },
    {
        label: 'Forums',
        href: '/forums',
        icon: FaComments,
    },

];
