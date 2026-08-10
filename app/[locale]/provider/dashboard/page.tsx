import { redirect } from "next/navigation";

type ProviderDashboardPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProviderDashboardPage({
  params,
}: ProviderDashboardPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/provider`);
}
