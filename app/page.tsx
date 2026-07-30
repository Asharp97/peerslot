import Link from "next/link";
import { clsx } from "clsx";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Clock3,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

import homeContent from "@/content/home.json";

const stepToneClasses = {
  cream: "bg-lumen-cream text-vast-ink",
  lavender: "bg-lavender-whisper text-vast-ink",
  forest: "bg-forest-ink text-lumen-cream",
} as const;

const iconMap = {
  calendarCheck: CalendarCheck,
  refresh: RefreshCw,
  shield: ShieldCheck,
  clock: Clock3,
  users: UsersRound,
} as const;

const messageVariantClasses = {
  lavender: "top-0 left-0 -rotate-2 bg-lavender-whisper",
  stone: "top-[38px] right-[3%] rotate-2 bg-lumen-stone",
  ember: "bottom-0 left-[16%] -rotate-1 bg-ember-glow",
} as const;

const buttonBase =
  "inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl border-2 border-vast-ink px-6 text-[15px] leading-none font-semibold transition duration-200 hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ember-glow motion-reduce:transition-none";

function BrandMark() {
  return (
    <span
      className="inline-flex h-6 w-6 items-end gap-0.75"
      aria-hidden="true">
      <span className="h-3 w-1.5 rounded-full border-2 border-current bg-lavender-whisper" />
      <span className="h-5.5 w-1.5 rounded-full border-2 border-current bg-lavender-whisper" />
      <span className="h-4 w-1.5 rounded-full border-2 border-current bg-ember-glow" />
    </span>
  );
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-ink px-3 py-2 text-[11px] leading-none font-semibold text-lumen-cream">
      {children}
    </span>
  );
}

function AvailabilityBoard() {
  const slotBase =
    "absolute z-10 flex flex-col items-start justify-center overflow-hidden rounded-[9px] border-[1.5px] border-vast-ink px-1.5 py-2 text-[10px] leading-none font-bold";

  return (
    <div className="relative min-w-0 rounded-[35px] border-2 border-lumen-cream bg-lumen-cream text-vast-ink">
      <div className="flex min-h-24 items-center justify-between gap-6 px-7 py-4.5 max-sm:min-h-20.5 max-sm:px-4 max-sm:py-3.5">
        <div>
          <p className="mb-1 text-[11px] font-bold tracking-[0.09em] text-[#6e6e64] uppercase">
            September 21–25
          </p>
          <h3 className="font-display text-[27px] leading-none font-normal tracking-[-0.02em]">
            Office hours
          </h3>
        </div>

        <div className="flex items-center gap-2.5 rounded-full border-[1.5px] border-vast-ink p-1.25 pr-3 max-sm:pr-1.75">
          <span className="grid size-8.5 place-items-center rounded-full bg-forest-ink text-[10px] font-bold text-lumen-cream">
            MA
          </span>
          <span className="flex flex-col leading-none max-sm:hidden">
            <strong className="text-xs">Ms. Aylin</strong>
            <small className="mt-1 text-[10px] text-[#6e6e64]">Teacher</small>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto border-y-[1.5px] border-vast-ink">
        <div className="grid min-w-140 grid-cols-[56px_repeat(5,1fr)] border-b border-lumen-stone">
          <span className="flex items-end justify-center pb-2 text-[8px] text-[#78786e]">
            GMT+3
          </span>
          {homeContent.weekDays.map((item) => (
            <div
              className="flex min-h-16.75 items-center justify-center gap-2 border-l border-lumen-stone"
              key={item.day}>
              <span className="text-[10px] font-semibold text-[#74746b] uppercase">
                {item.day}
              </span>
              <strong
                className={clsx(
                  "grid size-7.25 place-items-center rounded-full text-xs",
                  item.active && "bg-vast-ink text-lumen-cream",
                )}>
                {item.date}
              </strong>
            </div>
          ))}
        </div>

        <div className="grid min-w-140 grid-cols-[56px_1fr]">
          <div
            className="grid h-77.5 grid-rows-4 text-[9px] text-[#78786e]"
            aria-hidden="true">
            {["09:00", "10:00", "11:00", "12:00"].map((time) => (
              <span className="flex justify-center pt-2" key={time}>
                {time}
              </span>
            ))}
          </div>

          <div
            className="relative h-77.5 bg-[linear-gradient(to_right,var(--color-lumen-stone)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-lumen-stone)_1px,transparent_1px)] [background-size:20%_25%]"
            aria-label="Weekly availability preview">
            <span
              className={clsx(
                slotBase,
                "top-[19px] left-[1.4%] h-16.75 w-[17.2%] bg-lavender-whisper",
              )}>
              <small className="mb-1 text-[8px] font-medium">09:30</small>
              Nadia
            </span>
            <span
              className={clsx(
                slotBase,
                "top-23.25 left-[21.4%] h-16.75 w-[17.2%] bg-lumen-cream",
              )}>
              <small className="mb-1 text-[8px] font-medium">10:00</small>
              Open
            </span>
            <span
              className={clsx(
                slotBase,
                "top-39.25 left-[41.4%] h-16.75 w-[17.2%] bg-forest-ink text-lumen-cream",
              )}>
              <small className="mb-1 text-[8px] font-medium">11:00</small>
              Kareem
            </span>
            <span
              className={clsx(
                slotBase,
                "top-48.75 left-[81.4%] h-16.75 w-[17.2%] border-dashed bg-ember-glow",
              )}>
              <small className="mb-1 text-[8px] font-medium">11:30</small>
              Open
            </span>

            <span
              className="absolute top-30.75 left-0 z-0 w-full border-t border-ember-glow before:absolute before:-top-1 before:-left-1 before
              :size-[7px] before:rounded-full before:bg-ember-glow"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      <div className="absolute -right-6 -bottom-16 grid w-[min(470px,84%)] grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[18px] border-2 border-vast-ink bg-lavender-whisper p-3.5 max-sm:right-2.5 max-sm:-bottom-17.5 max-sm:w-[calc(100%-20px)] max-sm:grid-cols-[1fr]">
        <span className="grid size-10.5 place-items-center rounded-xl border-[1.5px] border-vast-ink bg-lumen-cream max-sm:hidden">
          <RefreshCw size={18} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col items-start">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-forest-ink px-2 py-1.5 text-[9px] leading-none font-semibold text-lumen-cream">
            <Check size={12} strokeWidth={3} aria-hidden="true" />
            Eligible to change
          </span>
          <strong className="text-xs">Move Wednesday’s session?</strong>
          <span className="mt-1 text-[9px] leading-[1.35] text-[#53534d]">
            Choose one of 3 open times before Tuesday at 10:00.
          </span>
        </span>
        <button
          type="button"
          className="inline-flex min-h-9.75 items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-vast-ink bg-vast-ink px-3 py-2 text-[10px] font-semibold text-lumen-cream max-sm:w-full">
          Choose a time
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-lumen-cream text-vast-ink">
      <a
        className="fixed top-3 left-3 z-50 -translate-y-[160%] rounded-xl border-2 border-vast-ink bg-lavender-whisper px-4 py-2.5 font-semibold transition-transform focus:translate-y-0"
        href="#main-content">
        Skip to content
      </a>

      <header className="relative z-20 mx-auto w-full max-w-[1240px] px-5 pt-6 max-sm:px-3 max-sm:pt-3">
        <nav
          className="flex min-h-[68px] items-center gap-8 rounded-full border-2 border-vast-ink bg-lumen-cream py-1.5 pr-[7px] pl-[22px] max-sm:min-h-[60px] max-sm:justify-between max-sm:pl-4"
          aria-label="Main navigation">
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2.5 text-[19px] font-bold tracking-[-0.4px] max-sm:text-[17px]"
            aria-label="PeerSlot home">
            <BrandMark />
            <span>PeerSlot</span>
          </Link>

          <div className="flex flex-1 items-center justify-center gap-[clamp(18px,2.4vw,34px)] max-lg:hidden">
            {homeContent.navigation.map((item) => (
              <a
                className="text-sm font-medium text-charcoal underline-offset-4 hover:underline"
                href={item.href}
                key={item.label}>
                {item.label}
              </a>
            ))}
          </div>

          <a
            href="#product"
            className="inline-flex min-h-13 items-center justify-center gap-2 rounded-3xl border-2 border-vast-ink bg-lavender-whisper px-4.5 text-sm leading-none font-semibold transition duration-200 hover:-translate-y-0.5 hover:bg-ember-glow max-sm:min-h-[42px] max-sm:px-3 max-sm:text-xs">
            See the schedule
            <ArrowRight
              size={16}
              className="max-sm:hidden"
              aria-hidden="true"
            />
          </a>
        </nav>
      </header>

      <main id="main-content">
        <section className="relative mx-auto flex min-h-172.5 w-full max-w-310 flex-col items-center px-5 pt-28 pb-26 text-center max-md:min-h-[640px] max-md:pt-[92px] max-sm:min-h-[650px] max-sm:px-3.5 max-sm:pt-20 max-sm:pb-20">
          <span
            className="pointer-events-none absolute top-30 -left-20.5 size-43.5 rounded-full border-2 border-vast-ink bg-forest-ink max-md:top-[75px] max-md:-left-[75px] max-md:size-[120px]"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute -right-10 bottom-18 size-28.75 rounded-full border-2 border-vast-ink bg-lavender-whisper max-md:right-[-30px] max-md:bottom-[90px] max-md:size-20"
            aria-hidden="true"
          />

          <p className="relative z-10 mb-7 inline-flex items-center gap-2 rounded-full border-[1.5px] border-vast-ink bg-lumen-cream px-3.5 py-2 text-[13px] font-bold tracking-[0.12em] uppercase max-sm:mb-5 max-sm:text-[10px]">
            <Sparkles size={15} aria-hidden="true" />
            Scheduling, with boundaries
          </p>

          <h1 className="relative z-10 max-w-[1080px] font-display text-[clamp(68px,9.2vw,118px)] leading-[0.84] font-normal tracking-[-0.045em] max-md:text-[clamp(57px,13vw,88px)] max-sm:text-[clamp(51px,15vw,72px)] max-sm:leading-[0.88]">
            <span className="block text-fog max-sm:inline">Plans change. </span>
            <span className="block max-sm:inline">
              Your calendar{" "}
              <em className="relative inline-block font-normal whitespace-nowrap not-italic max-sm:whitespace-normal">
                stays calm.
                <svg
                  className="absolute right-[1%] -bottom-3 h-4 w-[92%] overflow-visible"
                  viewBox="0 0 330 16"
                  preserveAspectRatio="none"
                  aria-hidden="true">
                  <path
                    d="M3 11C62 2 120 15 179 8s96-2 148-4"
                    fill="none"
                    stroke="var(--color-lavender-whisper)"
                    strokeLinecap="round"
                    strokeWidth="7"
                  />
                </svg>
              </em>
            </span>
          </h1>

          <p className="relative z-10 mt-10 max-w-[660px] text-[clamp(18px,2vw,21px)] leading-[1.45] max-sm:mt-8 max-sm:text-[17px]">
            Give students one fair way to move a meeting—into a time you already
            approved, before the 24-hour window closes.
          </p>

          <div className="relative z-10 mt-8 flex gap-3 max-sm:w-full max-sm:flex-col">
            <a
              href="#product"
              className={clsx(
                buttonBase,
                "bg-lavender-whisper hover:bg-ember-glow max-sm:w-full",
              )}>
              Watch the flow
              <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a
              href="#how-it-works"
              className={clsx(
                buttonBase,
                "bg-lumen-cream hover:bg-lumen-stone max-sm:w-full",
              )}>
              How it works
            </a>
          </div>

          <div
            className="relative z-10 mt-[52px] flex items-center justify-center gap-7 text-sm text-charcoal max-md:flex-wrap max-md:gap-x-5 max-md:gap-y-3 max-sm:grid max-sm:w-full max-sm:grid-cols-1 max-sm:justify-items-start max-sm:pl-2"
            aria-label="PeerSlot scheduling rules">
            {homeContent.schedulingRules.map((rule) => (
              <span className="inline-flex items-center gap-2" key={rule}>
                <Check
                  size={15}
                  className="rounded-full bg-forest-ink p-0.5 text-lumen-cream"
                  aria-hidden="true"
                />
                {rule}
              </span>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1440px] px-3" id="product">
          <div className="grid min-h-[760px] grid-cols-[minmax(300px,0.8fr)_minmax(600px,1.35fr)] items-center gap-[clamp(48px,6vw,88px)] rounded-[72px] bg-vast-ink p-[clamp(54px,6.7vw,96px)] text-lumen-cream max-lg:min-h-0 max-lg:grid-cols-1 max-lg:pb-[125px] max-md:rounded-[48px] max-md:px-7 max-md:pt-16 max-sm:rounded-[38px] max-sm:px-5 max-sm:pt-12 max-sm:pb-[116px]">
            <div className="flex flex-col items-start max-lg:max-w-[690px]">
              <StatusPill>
                <CalendarCheck size={15} aria-hidden="true" />
                Your week, protected
              </StatusPill>
              <h2 className="mt-7 max-w-[520px] font-display text-[clamp(50px,5.4vw,72px)] leading-[0.95] font-normal tracking-[-0.035em] max-sm:text-[46px]">
                A humane way to say “yes, within the rules.”
              </h2>
              <p className="mt-7 max-w-[520px] text-lg leading-[1.55] text-[#d9d9c9] max-sm:text-base">
                PeerSlot turns your availability into a clear set of choices.
                Students get autonomy. Teachers stop negotiating the same
                calendar twice.
              </p>
              <a
                href="#guardrails"
                className={clsx(
                  buttonBase,
                  "mt-9 border-lumen-cream bg-lumen-cream text-vast-ink hover:bg-lavender-whisper max-sm:w-full",
                )}>
                Explore the guardrails
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            </div>

            <div className="min-w-0 max-lg:mx-auto max-lg:w-full max-lg:max-w-[760px]">
              <AvailabilityBoard />
            </div>
          </div>
        </section>

        <section
          className="mx-auto w-full max-w-310 px-5 py-32 max-sm:px-3.5 max-sm:py-24"
          id="how-it-works">
          <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(280px,0.6fr)] gap-x-20 max-md:grid-cols-1">
            <p className="col-span-full mb-5 text-[13px] font-bold tracking-[0.12em] text-[#67675f] uppercase">
              A three-step handoff
            </p>
            <h2 className="max-w-195 font-display text-[clamp(54px,6.2vw,80px)] leading-[0.95] font-normal tracking-[-0.035em] max-sm:text-[51px]">
              Rescheduling, minus the back-and-forth.
            </h2>
            <p className="max-w-110 self-end text-lg leading-[1.55] text-[#54544d] max-md:mt-7">
              Everyone sees the same availability and the same boundaries, so
              moving a meeting takes one decision—not a conversation.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-5 max-md:grid-cols-1 max-sm:mt-11">
            {homeContent.principles.map((principle) => {
              const Icon =
                iconMap[principle.icon as keyof typeof iconMap];

              return (
                <article
                  className={clsx(
                    "flex min-h-[410px] flex-col rounded-[32px] border-2 border-vast-ink p-7 max-lg:min-h-[380px] max-md:min-h-[310px]",
                    stepToneClasses[
                      principle.tone as keyof typeof stepToneClasses
                    ],
                  )}
                  key={principle.number}>
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-full border-[1.5px] border-current text-[13px] font-bold">
                      {principle.number}
                    </span>
                    <Icon size={23} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <h3 className="mt-auto max-w-[250px] font-display text-[37px] leading-none font-normal tracking-[-0.03em]">
                    {principle.title}
                  </h3>
                  <p
                    className={clsx(
                      "mt-[18px] text-[15px] leading-[1.5]",
                      principle.tone === "forest"
                        ? "text-lumen-stone"
                        : "text-[#55554f]",
                    )}>
                    {principle.body}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section
          className="mx-auto grid w-full max-w-[1240px] grid-cols-[minmax(300px,0.8fr)_minmax(400px,1fr)] gap-[clamp(70px,10vw,148px)] px-5 pt-7 pb-32 max-md:grid-cols-1 max-sm:gap-20 max-sm:px-3.5 max-sm:pt-2 max-sm:pb-24"
          id="guardrails">
          <div className="flex flex-col items-start">
            <p className="mb-5 text-[13px] font-bold tracking-[0.12em] text-[#67675f] uppercase">
              Fair by default
            </p>
            <h2 className="max-w-[560px] font-display text-[clamp(54px,6.2vw,80px)] leading-[0.95] font-normal tracking-[-0.035em] max-sm:text-[51px]">
              Good boundaries make flexibility possible.
            </h2>
            <p className="mt-7 max-w-[440px] text-lg leading-[1.55] text-[#54544d]">
              The awkward “can I move it again?” conversation becomes a rule the
              product explains for you.
            </p>

            <div className="mt-12 flex w-full max-w-[450px] -rotate-[1.4deg] items-center gap-3.5 rounded-[18px] border-2 border-vast-ink bg-lavender-whisper p-3.5">
              <span className="grid size-12 shrink-0 place-items-center rounded-[13px] border-[1.5px] border-vast-ink bg-lumen-cream">
                <Clock3 size={20} aria-hidden="true" />
              </span>
              <span className="flex flex-col">
                <strong className="text-sm">This meeting is now locked</strong>
                <small className="mt-1 text-xs text-[#575750]">
                  It starts in less than 24 hours.
                </small>
              </span>
            </div>
          </div>

          <div className="border-t-2 border-vast-ink">
            {homeContent.guardrails.map((guardrail) => {
              const Icon =
                iconMap[guardrail.icon as keyof typeof iconMap];

              return (
                <article
                  className="grid min-h-[180px] grid-cols-[62px_1fr] items-start gap-5 border-b-2 border-vast-ink py-8 max-sm:grid-cols-[49px_1fr] max-sm:gap-4"
                  key={guardrail.title}>
                  <span className="grid size-14 place-items-center rounded-full border-[1.5px] border-vast-ink max-sm:size-[47px]">
                    <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-display text-[31px] leading-[1.1] font-normal tracking-[-0.02em] max-sm:text-[27px]">
                      {guardrail.title}
                    </h3>
                    <p className="mt-2.5 max-w-[490px] text-[15px] leading-[1.5] text-[#56564f]">
                      {guardrail.body}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section
          className="mx-auto w-full max-w-[1240px] px-5 pt-8 pb-32 max-sm:px-3.5 max-sm:py-24"
          id="for-teachers">
          <div>
            <p className="mb-5 text-[13px] font-bold tracking-[0.12em] text-[#67675f] uppercase">
              Less coordination
            </p>
            <h2 className="max-w-[830px] font-display text-[clamp(54px,6.2vw,80px)] leading-[0.95] font-normal tracking-[-0.035em] max-sm:text-[51px]">
              One choice beats nine messages.
            </h2>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-5 max-md:grid-cols-1">
            <article className="flex min-h-[520px] flex-col overflow-hidden rounded-[38px] border-2 border-vast-ink bg-lumen-cream p-[clamp(28px,4vw,48px)] max-sm:min-h-[460px] max-sm:rounded-[32px] max-sm:p-6">
              <div className="flex items-center justify-between gap-5 text-sm font-semibold">
                <span>The group-chat way</span>
                <span className="rounded-lg bg-vast-ink px-2.5 py-2 text-[10px] text-lumen-cream uppercase">
                  Before
                </span>
              </div>
              <p className="mt-12 font-display text-[clamp(100px,12vw,158px)] leading-[0.72] tracking-[-0.055em]">
                9
              </p>
              <p className="mt-6 max-w-[300px] font-display text-3xl leading-[1.05]">
                messages to move one meeting
              </p>
              <div className="relative mt-auto min-h-28" aria-hidden="true">
                {homeContent.comparisonMessages.map((message) => (
                  <span
                    className={clsx(
                      "absolute rounded-full border-[1.5px] border-vast-ink px-3.5 py-2.5 text-[11px] font-semibold",
                      messageVariantClasses[
                        message.variant as keyof typeof messageVariantClasses
                      ],
                    )}
                    key={message.text}>
                    {message.text}
                  </span>
                ))}
              </div>
            </article>

            <article className="flex min-h-[520px] flex-col overflow-hidden rounded-[38px] border-2 border-vast-ink bg-vast-ink p-[clamp(28px,4vw,48px)] text-lumen-cream max-sm:min-h-[460px] max-sm:rounded-[32px] max-sm:p-6">
              <div className="flex items-center justify-between gap-5 text-sm font-semibold">
                <span>The PeerSlot way</span>
                <StatusPill>
                  <Check size={13} strokeWidth={3} aria-hidden="true" />
                  Rescheduled
                </StatusPill>
              </div>
              <p className="mt-12 font-display text-[clamp(100px,12vw,158px)] leading-[0.72] tracking-[-0.055em]">
                1
              </p>
              <p className="mt-6 max-w-[300px] font-display text-3xl leading-[1.05]">
                clear choice from approved times
              </p>
              <div className="mt-auto flex items-center gap-4 rounded-[18px] border-[1.5px] border-lumen-cream bg-forest-ink p-3">
                <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-lumen-cream font-display text-2xl leading-[0.9] text-vast-ink">
                  <small className="mb-1 font-sans text-[8px] font-bold">
                    THU
                  </small>
                  24
                </span>
                <span className="flex flex-col">
                  <strong className="text-[13px]">
                    Session moved to 11:30
                  </strong>
                  <small className="mt-1 text-[10px] text-[#d5d5c3]">
                    Both calendars are up to date.
                  </small>
                </span>
              </div>
            </article>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1440px] px-3 py-3.5">
          <div className="grid min-h-[440px] grid-cols-[1.25fr_0.75fr] items-end gap-14 rounded-[72px] border-2 border-vast-ink bg-lavender-whisper p-[clamp(45px,7vw,96px)] max-md:min-h-[580px] max-md:grid-cols-1 max-md:content-end max-md:rounded-[48px] max-sm:min-h-[590px] max-sm:rounded-[38px] max-sm:px-6 max-sm:py-10">
            <div>
              <p className="mb-5 text-[13px] font-bold tracking-[0.12em] uppercase">
                Make room for real life
              </p>
              <h2 className="max-w-[730px] font-display text-[clamp(62px,7.5vw,96px)] leading-[0.88] font-normal tracking-[-0.035em] max-sm:text-[56px]">
                Keep the meeting. Change the slot.
              </h2>
            </div>
            <div className="flex flex-col items-start">
              <p className="max-w-[360px] text-[17px] leading-[1.5]">
                A quieter calendar for teachers, and a fair second chance for
                students.
              </p>
              <a
                href="#product"
                className={clsx(
                  buttonBase,
                  "mt-7 bg-vast-ink text-lumen-cream hover:bg-forest-ink",
                )}>
                Preview PeerSlot
                <ArrowRight size={18} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-vast-ink px-5 pt-16 pb-10 text-lumen-cream">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-[1fr_auto_auto] items-end gap-16 max-md:grid-cols-1 max-md:items-start max-md:gap-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-[19px] font-bold tracking-[-0.4px]">
              <BrandMark />
              <span>PeerSlot</span>
            </Link>
            <p className="mt-3.5 text-sm text-[#b9b9ab]">
              Meetings that move without the mess.
            </p>
          </div>
          <div className="flex gap-6 max-sm:flex-col max-sm:gap-4">
            {homeContent.footerLinks.map((item) => (
              <a
                className="text-sm font-medium underline-offset-4 hover:underline"
                href={item.href}
                key={item.label}>
                {item.label}
              </a>
            ))}
          </div>
          <p className="text-xs text-[#b9b9ab]">
            © {new Date().getFullYear()} PeerSlot
          </p>
        </div>
      </footer>
    </div>
  );
}
