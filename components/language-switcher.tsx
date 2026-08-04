"use client";

import { clsx } from "clsx";
import { useLocale } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

type LanguageSwitcherProps = {
  label: string;
  localeLabels: Record<AppLocale, string>;
};

export function LanguageSwitcher({
  label,
  localeLabels,
}: LanguageSwitcherProps) {
  const currentLocale = useLocale();
  const pathname = usePathname();

  return (
    <div
      className="flex shrink-0 items-center rounded-full border-2 border-vast-ink bg-lumen-cream p-1"
      aria-label={label}
      role="group"
    >
      {routing.locales.map((locale) => {
        const isCurrent = locale === currentLocale;

        return (
          <Link
            className={clsx(
              "grid min-h-9 min-w-9 place-items-center rounded-full px-2 text-[11px] font-bold tracking-[0.08em] transition-colors hover:bg-lumen-stone focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ember-glow",
              isCurrent
                ? "bg-vast-ink text-lumen-cream hover:bg-vast-ink"
                : "text-vast-ink",
              isCurrent && "max-sm:hidden",
            )}
            href={pathname}
            hrefLang={locale}
            locale={locale}
            aria-current={isCurrent ? "page" : undefined}
            aria-label={localeLabels[locale]}
            title={localeLabels[locale]}
            key={locale}
          >
            {locale.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
