export function useAccount() {
  const account = useState<any>("booking-account", () => null);
  const request = useBookingRequest();
  async function refresh() {
    try {
      account.value = await request("/api/me");
    } catch {
      account.value = null;
    }
    return account.value;
  }
  return { account, refresh };
}
