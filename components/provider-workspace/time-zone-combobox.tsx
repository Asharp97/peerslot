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
import { getTimeZones } from "@/lib/time-zones";

export function TimeZoneCombobox({
  emptyLabel,
  label,
  onChange,
  searchLabel,
  value,
}: {
  emptyLabel: string;
  label: string;
  onChange: (value: string) => void;
  searchLabel: string;
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const timeZones = useMemo(() => getTimeZones(value), [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className="mt-2 min-h-12 w-full justify-between rounded-xl border-black/10 bg-white px-4 font-normal text-vast-ink hover:bg-white"
          role="combobox"
          variant="outline"
        >
          <span className="truncate">{value}</span>
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
                  data-checked={timeZone === value}
                  key={timeZone}
                  onSelect={() => {
                    onChange(timeZone);
                    setOpen(false);
                  }}
                  value={timeZone}
                >
                  {timeZone}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
