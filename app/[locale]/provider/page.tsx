import { getTranslations } from "next-intl/server";

import {
  ProviderOverview,
  type ProviderOverviewCopy,
} from "@/components/provider-workspace/provider-overview";

export default async function ProviderPage() {
  const t = await getTranslations("ProviderWorkspace");
  return <ProviderOverview copy={t.raw("overview") as ProviderOverviewCopy} />;
}
