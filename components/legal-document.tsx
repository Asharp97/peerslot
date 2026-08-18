import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type LegalDocumentProps = ComponentPropsWithoutRef<"article"> & {
  text: string;
};

export function LegalDocument({
  text,
  className,
  ...props
}: LegalDocumentProps) {
  const paragraphs = text
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean);

  return (
    <article
      className={cn(
        "mx-auto w-full max-w-3xl rounded-[28px] border-2 border-vast-ink bg-white px-6 py-8 text-vast-ink shadow-[6px_6px_0_var(--color-vast-ink)] sm:px-10 sm:py-12",
        className,
      )}
      {...props}
    >
      <div className="space-y-5 text-[15px] leading-7 text-[#4f4f49] sm:text-base sm:leading-8">
        {paragraphs.map((paragraph, index) => (
          <p className="whitespace-pre-wrap" key={index}>
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
