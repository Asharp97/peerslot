"use client";

import { format } from "date-fns";
import { enUS, tr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DateTimeWindowPicker({
  copy,
  date,
  endsAt,
  locale,
  minimumDate,
  onDateChange,
  onEndsAtChange,
  onStartsAtChange,
  startsAt,
}: {
  copy: { date: string; startsAt: string; endsAt: string };
  date: string;
  endsAt: string;
  locale: "en" | "tr";
  minimumDate: string;
  onDateChange: (value: string) => void;
  onEndsAtChange: (value: string) => void;
  onStartsAtChange: (value: string) => void;
  startsAt: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = localDate(date);
  const earliest = localDate(minimumDate);
  const dateLocale = locale === "tr" ? tr : enUS;

  return (
    <div className="mt-7 space-y-4">
      <div>
        <Label className="text-xs font-bold text-white/60">{copy.date}</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              className="mt-2 min-h-12 w-full justify-start rounded-xl border-white/15 bg-white/8 px-4 text-left font-normal text-white hover:bg-white/12 hover:text-white"
              variant="outline"
            >
              <CalendarIcon size={16} />
              {format(selected, "PPP", { locale: dateLocale })}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              disabled={{ before: earliest }}
              locale={dateLocale}
              mode="single"
              onSelect={(nextDate) => {
                if (!nextDate) return;
                onDateChange(format(nextDate, "yyyy-MM-dd"));
                setOpen(false);
              }}
              selected={selected}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TimeInput
          label={copy.startsAt}
          onChange={onStartsAtChange}
          value={startsAt}
        />
        <TimeInput
          label={copy.endsAt}
          onChange={onEndsAtChange}
          value={endsAt}
        />
      </div>
    </div>
  );
}

function TimeInput({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div>
      <Label className="text-xs font-bold text-white/60">{label}</Label>
      <Input
        className="mt-2 min-h-12 rounded-xl border-white/15 bg-white/8 px-4 text-white scheme-dark"
        onChange={(event) => onChange(event.target.value)}
        required
        type="time"
        value={value}
      />
    </div>
  );
}

function localDate(value: string) {
  return new Date(`${value}T12:00:00`);
}
