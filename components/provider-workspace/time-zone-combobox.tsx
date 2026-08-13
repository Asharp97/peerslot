"use client";

import { ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatTimeZoneLabel, getTimeZones } from "@/lib/time-zones";

export function TimeZoneCombobox({
  emptyLabel,
  label,
  locale,
  onChange,
  searchLabel,
  value,
}: {
  emptyLabel: string;
  label: string;
  locale: string;
  onChange: (value: string) => void;
  searchLabel: string;
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const timeZones = useMemo(
    () =>
      getTimeZones(value).map((timeZone) => ({
        label: formatTimeZoneLabel(timeZone, locale),
        value: timeZone,
      })),
    [locale, value],
  );
  const selectedLabel = formatTimeZoneLabel(value, locale);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className="mt-2 min-h-12 w-full justify-between rounded-xl border-black/10 bg-white px-4 font-normal text-vast-ink hover:bg-white focus-visible:border-black/10 focus-visible:ring-0"
          role="combobox"
          variant="outline"
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="opacity-45" size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <Command>
          <CommandInput aria-label={label} placeholder={searchLabel} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {timeZones.map((timeZone) => (
                <CommandItem
                  data-checked={timeZone.value === value}
                  key={timeZone.value}
                  onSelect={() => {
                    onChange(timeZone.value);
                    setOpen(false);
                  }}
                  value={`${timeZone.label} ${timeZone.value}`}
                >
                  {timeZone.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
