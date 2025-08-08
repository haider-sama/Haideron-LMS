import bcrypt from "bcryptjs";

/**
 * Hashes a given value using bcrypt with the provided number of salt rounds.
 * @param val - The plain text value to hash.
 * @param saltRounds - Number of salt rounds (default is 16).
 * @returns The hashed string.
 */

export const hashValue = async (val: string, saltRounds: number = 8) => {
    try {
        return await bcrypt.hash(val, saltRounds);
    } catch (error) {
        console.error("Error hashing value:", error);
        throw new Error("Hashing failed");
    }
};


/**
 * Compares a plain text value to a hashed value.
 * @param val - The plain text value.
 * @param hashedValue - The hashed string to compare against.
 * @returns True if they match, false otherwise.
 */
export const compareValue = async (val: string, hashedValue: string) => {
    try {
        return await bcrypt.compare(val, hashedValue);
    } catch (error) {
        console.error("Error comparing value:", error);
        return false;
    }
};