import { getTranslations } from "next-intl/server";

import {
  ProviderAppointments,
  type ProviderAppointmentsCopy,
} from "@/components/provider-workspace/provider-appointments";

export default async function ProviderAppointmentsPage() {
  const t = await getTranslations("ProviderWorkspace");
  return (
    <ProviderAppointments
      copy={t.raw("appointments") as ProviderAppointmentsCopy}
    />
  );
}
