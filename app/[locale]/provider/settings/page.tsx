import { getTranslations } from "next-intl/server";

import {
  ProviderSettings,
  type ProviderSettingsCopy,
} from "@/components/provider-workspace/provider-settings";

export default async function ProviderSettingsPage() {
  const t = await getTranslations("ProviderWorkspace");
  return <ProviderSettings copy={t.raw("settings") as ProviderSettingsCopy} />;
}
