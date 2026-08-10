import { getTranslations } from "next-intl/server";

import {
  ProviderAvailabilityEditor,
  type ProviderAvailabilityCopy,
} from "@/components/provider-workspace/provider-availability-editor";

export default async function ProviderAvailabilityPage() {
  const t = await getTranslations("ProviderWorkspace");
  return (
    <ProviderAvailabilityEditor
      copy={t.raw("availability") as ProviderAvailabilityCopy}
    />
  );
}
