import { useQuery, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";

// Track failures globally per query key
const failureCounts: Record<string, number> = {};
const FAILURE_LIMIT = 8;

export function useSafeQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends readonly unknown[] = any[]
>(
    queryKey: TQueryKey,
    queryFn: () => Promise<TQueryFnData>,
    options?: Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryKey" | "queryFn">
): UseQueryResult<TData, TError> {
    const keyString = JSON.stringify(queryKey);
    const failedTooMuch = (failureCounts[keyString] || 0) >= FAILURE_LIMIT;

    return useQuery<TQueryFnData, TError, TData, TQueryKey>({
        queryKey,
        queryFn: async () => {
            try {
                const result = await queryFn();
                failureCounts[keyString] = 0; // reset on success
                return result;
            } catch (err) {
                failureCounts[keyString] = (failureCounts[keyString] || 0) + 1;
                throw err;
            }
        },
        enabled: !failedTooMuch && (options?.enabled ?? true),
        retry: failedTooMuch ? false : (options?.retry ?? 3),
        ...options,
    });
}
