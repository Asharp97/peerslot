import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import {
  ProviderShell,
  type ProviderShellCopy,
} from "@/components/provider-workspace/provider-shell";
import { routing } from "@/i18n/routing";

export default async function ProviderLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const t = await getTranslations("ProviderWorkspace");

  return (
    <ProviderShell copy={t.raw("shell") as ProviderShellCopy}>
      {children}
    </ProviderShell>
  );
}
