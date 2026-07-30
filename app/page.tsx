import Link from "next/link";
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

import styles from "./home.module.css";

const weekDays = [
  { day: "Mon", date: "21" },
  { day: "Tue", date: "22" },
  { day: "Wed", date: "23", active: true },
  { day: "Thu", date: "24" },
  { day: "Fri", date: "25" },
];

const principles = [
  {
    number: "01",
    icon: CalendarCheck,
    title: "Teacher opens the week",
    body: "Publish only the times that genuinely work. Every option students see is already safe to book.",
    tone: "cream",
  },
  {
    number: "02",
    icon: RefreshCw,
    title: "Student makes one move",
    body: "A student can choose a better open slot once—without sending a message or waiting for approval.",
    tone: "lavender",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "PeerSlot holds the line",
    body: "The 24-hour cutoff and one-change rule are enforced automatically, clearly, and consistently.",
    tone: "forest",
  },
] as const;

const guardrails = [
  {
    icon: RefreshCw,
    title: "One reschedule",
    body: "Enough flexibility for a real conflict, without turning the calendar into a moving target.",
  },
  {
    icon: Clock3,
    title: "24-hour protection",
    body: "Once a meeting is close, it stays put. Teachers and peers can plan around it with confidence.",
  },
  {
    icon: UsersRound,
    title: "Availability stays in charge",
    body: "Students can only move into times the teacher has explicitly made available.",
  },
];

function BrandMark() {
  return (
    <span className={styles.brandMark} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function AvailabilityBoard() {
  return (
    <div className={styles.boardShell}>
      <div className={styles.boardTopbar}>
        <div>
          <p className={styles.boardKicker}>September 21–25</p>
          <h3>Office hours</h3>
        </div>
        <div className={styles.teacherChip}>
          <span className={styles.avatar}>MA</span>
          <span>
            <strong>Ms. Aylin</strong>
            <small>Teacher</small>
          </span>
        </div>
      </div>

      <div className={styles.calendarFrame}>
        <div className={styles.calendarHeader}>
          <span className={styles.timeSpacer}>GMT+3</span>
          {weekDays.map((item) => (
            <div
              className={`${styles.dayHeading} ${
                item.active ? styles.activeDay : ""
              }`}
              key={item.day}
            >
              <span>{item.day}</span>
              <strong>{item.date}</strong>
            </div>
          ))}
        </div>

        <div className={styles.calendarBody}>
          <div className={styles.timeColumn} aria-hidden="true">
            <span>09:00</span>
            <span>10:00</span>
            <span>11:00</span>
            <span>12:00</span>
          </div>
          <div className={styles.calendarGrid} aria-label="Weekly availability preview">
            <span className={`${styles.slot} ${styles.slotLavender} ${styles.slotOne}`}>
              <small>09:30</small>
              Nadia
            </span>
            <span className={`${styles.slot} ${styles.slotCream} ${styles.slotTwo}`}>
              <small>10:00</small>
              Open
            </span>
            <span className={`${styles.slot} ${styles.slotTeal} ${styles.slotThree}`}>
              <small>11:00</small>
              Kareem
            </span>
            <span className={`${styles.slot} ${styles.slotOpen} ${styles.slotFour}`}>
              <small>11:30</small>
              Open
            </span>
            <span className={`${styles.nowDot} ${styles.nowDotOne}`} />
            <span className={`${styles.nowDot} ${styles.nowDotTwo}`} />
          </div>
        </div>
      </div>

      <div className={styles.rescheduleCard}>
        <div className={styles.rescheduleIcon}>
          <RefreshCw size={18} strokeWidth={2.2} aria-hidden="true" />
        </div>
        <div className={styles.rescheduleCopy}>
          <span className={styles.statusPill}>
            <Check size={13} strokeWidth={3} aria-hidden="true" />
            Eligible to change
          </span>
          <strong>Move Wednesday’s session?</strong>
          <p>Choose one of 3 open times before Tuesday at 10:00.</p>
        </div>
        <button type="button" className={styles.changeButton}>
          Choose a time
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>

      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Main navigation">
          <Link href="/" className={styles.brand} aria-label="PeerSlot home">
            <BrandMark />
            <span>PeerSlot</span>
          </Link>

          <div className={styles.navLinks}>
            <a href="#product">Product</a>
            <a href="#how-it-works">How it works</a>
            <a href="#guardrails">Guardrails</a>
            <a href="#for-teachers">For teachers</a>
          </div>

          <a href="#product" className={styles.navCta}>
            See the schedule
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </nav>
      </header>

      <main id="main-content">
        <section className={styles.hero}>
          <p className={styles.eyebrow}>
            <Sparkles size={15} aria-hidden="true" />
            Scheduling, with boundaries
          </p>

          <h1>
            <span>Plans change.</span>
            <span>
              Your calendar{" "}
              <em>
                stays calm.
                <svg
                  viewBox="0 0 330 16"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M3 11C62 2 120 15 179 8s96-2 148-4" />
                </svg>
              </em>
            </span>
          </h1>

          <p className={styles.heroCopy}>
            Give students one fair way to move a meeting—into a time you
            already approved, before the 24-hour window closes.
          </p>

          <div className={styles.heroActions}>
            <a href="#product" className={styles.primaryButton}>
              Watch the flow
              <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a href="#how-it-works" className={styles.secondaryButton}>
              How it works
            </a>
          </div>

          <div className={styles.ruleStrip} aria-label="PeerSlot scheduling rules">
            <span>
              <Check size={15} aria-hidden="true" />
              One change per student
            </span>
            <span>
              <Check size={15} aria-hidden="true" />
              24-hour cutoff
            </span>
            <span>
              <Check size={15} aria-hidden="true" />
              Teacher-controlled times
            </span>
          </div>
        </section>

        <section className={styles.productWrap} id="product">
          <div className={styles.darkChamber}>
            <div className={styles.productCopy}>
              <span className={styles.tealBadge}>
                <CalendarCheck size={15} aria-hidden="true" />
                Your week, protected
              </span>
              <h2>A humane way to say “yes, within the rules.”</h2>
              <p>
                PeerSlot turns your availability into a clear set of choices.
                Students get autonomy. Teachers stop negotiating the same
                calendar twice.
              </p>
              <a href="#guardrails" className={styles.darkButton}>
                Explore the guardrails
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            </div>

            <AvailabilityBoard />
          </div>
        </section>

        <section className={styles.stepsSection} id="how-it-works">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionLabel}>A three-step handoff</p>
            <h2>Rescheduling, minus the back-and-forth.</h2>
            <p>
              Everyone sees the same availability and the same boundaries, so
              moving a meeting takes one decision—not a conversation.
            </p>
          </div>

          <div className={styles.stepGrid}>
            {principles.map((principle) => {
              const Icon = principle.icon;

              return (
                <article
                  className={`${styles.stepCard} ${
                    styles[`stepCard${principle.tone}`]
                  }`}
                  key={principle.number}
                >
                  <div className={styles.stepMeta}>
                    <span>{principle.number}</span>
                    <Icon size={23} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <h3>{principle.title}</h3>
                  <p>{principle.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.guardrailSection} id="guardrails">
          <div className={styles.guardrailIntro}>
            <p className={styles.sectionLabel}>Fair by default</p>
            <h2>Good boundaries make flexibility possible.</h2>
            <p>
              The awkward “can I move it again?” conversation becomes a rule
              the product explains for you.
            </p>

            <div className={styles.miniNotice}>
              <span className={styles.noticeIcon}>
                <Clock3 size={20} aria-hidden="true" />
              </span>
              <span>
                <strong>This meeting is now locked</strong>
                <small>It starts in less than 24 hours.</small>
              </span>
            </div>
          </div>

          <div className={styles.guardrailList}>
            {guardrails.map((guardrail) => {
              const Icon = guardrail.icon;

              return (
                <article className={styles.guardrailItem} key={guardrail.title}>
                  <span className={styles.guardrailIcon}>
                    <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <div>
                    <h3>{guardrail.title}</h3>
                    <p>{guardrail.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.comparisonSection} id="for-teachers">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionLabel}>Less coordination</p>
            <h2>One choice beats nine messages.</h2>
          </div>

          <div className={styles.comparisonGrid}>
            <article className={styles.beforeCard}>
              <div className={styles.comparisonTopline}>
                <span>The group-chat way</span>
                <span className={styles.squareBadge}>Before</span>
              </div>
              <p className={styles.bigStat}>9</p>
              <p className={styles.statLabel}>messages to move one meeting</p>
              <div className={styles.messageStack} aria-hidden="true">
                <span>Can we do later?</span>
                <span>What times work?</span>
                <span>Thursday maybe?</span>
              </div>
            </article>

            <article className={styles.afterCard}>
              <div className={styles.comparisonTopline}>
                <span>The PeerSlot way</span>
                <span className={styles.statusPill}>
                  <Check size={13} strokeWidth={3} aria-hidden="true" />
                  Rescheduled
                </span>
              </div>
              <p className={styles.bigStat}>1</p>
              <p className={styles.statLabel}>clear choice from approved times</p>
              <div className={styles.confirmationRow}>
                <span className={styles.confirmationDate}>
                  <small>THU</small>
                  24
                </span>
                <span>
                  <strong>Session moved to 11:30</strong>
                  <small>Both calendars are up to date.</small>
                </span>
              </div>
            </article>
          </div>
        </section>

        <section className={styles.finalWrap}>
          <div className={styles.finalCta}>
            <div>
              <p className={styles.sectionLabel}>Make room for real life</p>
              <h2>Keep the meeting. Change the slot.</h2>
            </div>
            <div className={styles.finalAction}>
              <p>
                A quieter calendar for teachers, and a fair second chance for
                students.
              </p>
              <a href="#product" className={styles.inkButton}>
                Preview PeerSlot
                <ArrowRight size={18} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div>
            <Link href="/" className={styles.footerBrand}>
              <BrandMark />
              <span>PeerSlot</span>
            </Link>
            <p>Meetings that move without the mess.</p>
          </div>
          <div className={styles.footerLinks}>
            <a href="#product">Product</a>
            <a href="#how-it-works">How it works</a>
            <a href="#guardrails">Guardrails</a>
          </div>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} PeerSlot
          </p>
        </div>
      </footer>
    </div>
  );
}
