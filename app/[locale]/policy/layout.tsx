import { PublicSiteLayout } from "@/components/public-site-layout";

export default function PolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicSiteLayout>
      <main
        className="mx-auto flex w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 sm:py-18"
        id="main-content"
      >
        {children}
      </main>
    </PublicSiteLayout>
  );
}
