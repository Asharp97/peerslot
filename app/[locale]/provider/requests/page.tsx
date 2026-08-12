import { getTranslations } from "next-intl/server";

import {
  ProviderAppointmentRequests,
  type ProviderAppointmentRequestsCopy,
} from "@/components/provider-workspace/provider-appointment-requests";

export default async function ProviderAppointmentRequestsPage() {
  const t = await getTranslations("ProviderWorkspace");

  return (
    <ProviderAppointmentRequests
      copy={t.raw("requests") as ProviderAppointmentRequestsCopy}
    />
  );
}
