import { useQuery } from "@tanstack/react-query";
import { AudienceEnum } from "../../../../server/src/shared/enums";
import { getDepartmentHeadDashboardContext } from "../../api/core/faculty-api";
import { getStudentDashboardContext } from "../../api/core/student-api";
import { ProgramWithCreator } from "../../constants/core/interfaces";

type DepartmentHeadDashboardResponse = {
  program: ProgramWithCreator; // replace `any` with your actual Program type
  programBatch: any;
  activatedSemesters: any[];
};

export function useDashboards(role?: AudienceEnum, isLoggedIn?: boolean) {
    // const isFaculty = isLoggedIn && role === AudienceEnum.DepartmentTeacher;
    const isStudent = isLoggedIn && role === AudienceEnum.Student;
    const isHead = isLoggedIn && role === AudienceEnum.DepartmentHead;

    // const faculty = useQuery({
    //     queryKey: ["facultyDashboard"],
    //     queryFn: getFacultyDashboardContext,
    //     enabled: !!isFaculty,
    //     staleTime: 5 * 60 * 1000,
    // });

    const student = useQuery({
        queryKey: ["studentDashboard"],
        queryFn: getStudentDashboardContext,
        enabled: !!isStudent,
        staleTime: 5 * 60 * 1000,
    });

    const head = useQuery<DepartmentHeadDashboardResponse, Error>({
        queryKey: ["departmentHeadDashboard"],
        queryFn: getDepartmentHeadDashboardContext,
        enabled: !!isHead,
        staleTime: 5 * 60 * 1000,
    });
    
    return {
        // faculty,
        student,
        head,
    };
}
