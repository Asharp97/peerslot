import {
  appointmentDateTime,
  emailText,
  type EmailLocale,
  type EmailTemplate,
  renderPeerSlotEmail,
} from "./shared";

type NewBookingRequestTemplateInput = {
  comment?: string | null;
  endsAt: Date;
  locale: EmailLocale;
  providerName: string;
  reviewUrl: string;
  startsAt: Date;
  studentEmail: string;
  studentName: string;
  timeZone: string;
};

export function newBookingRequestTemplate(
  input: NewBookingRequestTemplateInput,
): EmailTemplate {
  const { date, time } = appointmentDateTime(
    input.startsAt,
    input.endsAt,
    input.timeZone,
    input.locale,
  );
  const copy = input.locale === "tr" ? turkishCopy : englishCopy;
  const layout = {
    eyebrow: copy.eyebrow,
    title: copy.title,
    greeting: copy.greeting(input.providerName),
    intro: copy.intro(input.studentName),
    details: [
      { label: copy.student, value: input.studentName },
      { label: copy.email, value: input.studentEmail },
      { label: copy.date, value: date },
      { label: copy.time, value: `${time} · ${input.timeZone}` },
      ...(input.comment ? [{ label: copy.comment, value: input.comment }] : []),
    ],
    notice: copy.notice,
    cta: { label: copy.cta, url: input.reviewUrl },
    footer: copy.footer,
  };

  return {
    subject: copy.subject(input.studentName),
    html: renderPeerSlotEmail(layout),
    text: emailText(layout),
  };
}

const englishCopy = {
  eyebrow: "New request",
  title: "A student chose one of your times.",
  greeting: (name: string) => `Hello ${name},`,
  intro: (name: string) =>
    `${name} sent a new appointment request. Review the details and accept or decline it from your dashboard.`,
  student: "Student",
  email: "Email",
  date: "Date",
  time: "Time",
  comment: "Comment",
  notice: "This time remains pending until you make a decision.",
  cta: "Review request",
  footer:
    "You received this because this request was made through your PeerSlot booking page.",
  subject: (name: string) => `New booking request from ${name}`,
};

const turkishCopy = {
  eyebrow: "Yeni talep",
  title: "Bir öğrenci uygun saatlerinizden birini seçti.",
  greeting: (name: string) => `Merhaba ${name},`,
  intro: (name: string) =>
    `${name} yeni bir randevu talebi gönderdi. Ayrıntıları inceleyip panelinizden kabul veya reddedebilirsiniz.`,
  student: "Öğrenci",
  email: "E-posta",
  date: "Tarih",
  time: "Saat",
  comment: "Not",
  notice: "Siz karar verene kadar bu saat beklemede kalır.",
  cta: "Talebi incele",
  footer:
    "Bu iletiyi, talep PeerSlot rezervasyon sayfanız üzerinden gönderildiği için aldınız.",
  subject: (name: string) => `${name} adlı öğrenciden yeni randevu talebi`,
};
