import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ProviderDashboard } from "@/components/provider-dashboard";
import { routing } from "@/i18n/routing";

type ProviderDashboardPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProviderDashboardPage({
  params,
}: ProviderDashboardPageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const t = await getTranslations("ProviderDashboard");

  return (
    <ProviderDashboard
      copy={t.raw("content") as Parameters<typeof ProviderDashboard>[0]["copy"]}
    />
  );
}
