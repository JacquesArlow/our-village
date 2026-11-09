import type { $Fetch, FetchOptions } from "ofetch";

export function useBookingPath(path: string) {
  return useRuntimeConfig().app.baseURL.replace(/\/$/, "") + path;
}

export function useBookingRequest() {
  const base = useBookingPath("");
  const request = useRequestFetch() as $Fetch;
  return <T = unknown>(path: string, options?: FetchOptions<"json">) =>
    request<T>(base + path, options);
}
