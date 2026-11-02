export function useBookingUi() {
  const money = (cents: number) =>
    new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(cents / 100);
  const when = (iso: string | number) =>
    new Date(iso).toLocaleString("en-ZA", {
      timeZone: "Africa/Johannesburg",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const clock = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-ZA", {
      timeZone: "Africa/Johannesburg",
      hour: "2-digit",
      minute: "2-digit",
    });
  const today = () =>
    new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 10);
  const dayOf = (iso: string) =>
    new Date(Date.parse(iso) + 2 * 3600000).toISOString().slice(0, 10);
  const toIso = (local: string) => new Date(local + ":00+02:00").toISOString();
  const message = (error: any) =>
    error?.data?.statusMessage ||
    error?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again.";
  const number = (seq: number) => "OV-STG-" + String(seq).padStart(6, "0");
  const paidLabel = (method?: string) =>
    method === "staging_simulation"
      ? "Simulated — no money received"
      : method === "yoco_test"
        ? "Yoco test payment — no real money"
        : "";
  return {
    money,
    when,
    clock,
    today,
    dayOf,
    toIso,
    message,
    number,
    paidLabel,
  };
}
