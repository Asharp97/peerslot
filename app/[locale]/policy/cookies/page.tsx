import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalDocument } from "@/components/legal-document";

type LegalSection = {
  heading: string;
  paragraphs?: string[];
  items?: string[];
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal.cookies");
  return { title: t("title"), description: t("introduction") };
}

export default async function CookiePolicyPage() {
  const t = await getTranslations("Legal.cookies");

  return (
    <div className="w-full">
      <LegalDocument
        aria-label={t("title")}
        eyebrow={t("eyebrow")}
        introduction={t("introduction")}
        sections={t.raw("sections") as LegalSection[]}
        title={t("title")}
        updatedAt={t("updatedAt")}
      />
    </div>
  );
}
