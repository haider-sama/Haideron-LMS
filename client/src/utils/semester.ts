type SemesterType = "Spring" | "Summer" | "Fall";

/**
 * Returns the current semester string based on current date.
 */
export function getCurrentSemester(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    let term: SemesterType;
    if (month >= 1 && month <= 4) term = "Spring";
    else if (month >= 5 && month <= 7) term = "Summer";
    else term = "Fall";

    return `${term} ${year}`;
}

/**
 * Generates a list of semesters between a range of years.
 * By default, it goes from 5 years ago to 5 years in the future.
 */
export function generateSemesters(
    startYear: number = new Date().getFullYear() - 10,
    endYear: number = new Date().getFullYear() + 5
): string[] {
    const semesters: string[] = [];

    for (let year = startYear; year <= endYear; year++) {
        ["Spring", "Summer", "Fall"].forEach((term) => {
            semesters.push(`${term} ${year}`);
        });
    }

    return semesters;
}
