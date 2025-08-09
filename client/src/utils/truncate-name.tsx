// Truncates a full name to a maximum length of 8 characters.
export function truncateName(fullName: string, maxLength = 8): string {
    if (!fullName) return '';
    if (fullName.length <= maxLength) return fullName;
    return fullName.slice(0, maxLength) + '...';
}
