"use client";

import { Check, LoaderCircle } from "lucide-react";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type BookingSlot = {
  startsAt: string;
  label: string;
  endsAtLabel: string;
};

export type BookingRequestCopy = {
  endsAt: string;
  requestTitle: string;
  requestBody: string;
  name: string;
  email: string;
  comment: string;
  commentPlaceholder: string;
  sendRequest: string;
  sending: string;
  requestedTitle: string;
  requestedBody: string;
  requestError: string;
};

export function BookingRequestPicker({
  slug,
  slots,
  copy,
}: {
  slug: string;
  slots: BookingSlot[];
  copy: BookingRequestCopy;
}) {
  const [selected, setSelected] = useState<BookingSlot | null>(null);
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/booking-pages/${slug}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          studentEmail,
          startsAt: selected.startsAt,
          comment: comment || undefined,
        }),
      });
      if (!response.ok) throw new Error(copy.requestError);
      setRequested(true);
    } catch {
      setError(copy.requestError);
    } finally {
      setSaving(false);
    }
  }

  function close(open: boolean) {
    if (open) return;
    setSelected(null);
    setRequested(false);
    setError("");
  }

  return (
    <>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {slots.map((slot) => (
          <button
            className="min-h-14 rounded-xl border-2 border-vast-ink bg-lumen-cream px-4 text-left text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-lavender-whisper"
            key={slot.startsAt}
            onClick={() => setSelected(slot)}
            type="button"
          >
            <span className="block">{slot.label}</span>
            <span className="mt-1 block text-xs font-medium text-black/45">
              {copy.endsAt.replace("{time}", slot.endsAtLabel)}
            </span>
          </button>
        ))}
      </div>

      <Dialog open={selected !== null} onOpenChange={close}>
        <DialogContent className="border-2 border-vast-ink bg-lumen-cream sm:max-w-lg">
          {requested ? (
            <div className="py-8 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-lavender-whisper">
                <Check size={20} />
              </span>
              <DialogTitle className="mt-5 font-display text-3xl">
                {copy.requestedTitle}
              </DialogTitle>
              <DialogDescription className="mt-2">
                {copy.requestedBody}
              </DialogDescription>
            </div>
          ) : (
            <form onSubmit={submit}>
              <DialogHeader>
                <DialogTitle className="font-display text-3xl">
                  {copy.requestTitle}
                </DialogTitle>
                <DialogDescription>
                  {selected?.label}. {copy.requestBody}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6 grid gap-4">
                <div>
                  <Label className="mb-2 font-bold" htmlFor="booking-name">
                    {copy.name}
                  </Label>
                  <Input
                    autoComplete="name"
                    id="booking-name"
                    minLength={2}
                    onChange={(event) => setStudentName(event.target.value)}
                    required
                    value={studentName}
                  />
                </div>
                <div>
                  <Label className="mb-2 font-bold" htmlFor="booking-email">
                    {copy.email}
                  </Label>
                  <Input
                    autoComplete="email"
                    id="booking-email"
                    onChange={(event) => setStudentEmail(event.target.value)}
                    required
                    type="email"
                    value={studentEmail}
                  />
                </div>
                <div>
                  <Label className="mb-2 font-bold" htmlFor="booking-comment">
                    {copy.comment}
                  </Label>
                  <Textarea
                    id="booking-comment"
                    maxLength={1000}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder={copy.commentPlaceholder}
                    value={comment}
                  />
                </div>
                {error ? (
                  <p className="text-sm font-semibold text-red-700">{error}</p>
                ) : null}
              </div>
              <DialogFooter className="mt-6">
                <Button
                  className="h-11 rounded-full bg-forest-ink px-5 text-white"
                  disabled={saving}
                  type="submit"
                >
                  {saving ? <LoaderCircle className="animate-spin" /> : null}
                  {saving ? copy.sending : copy.sendRequest}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
