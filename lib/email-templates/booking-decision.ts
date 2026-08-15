import {
  appointmentDateTime,
  emailText,
  type EmailLocale,
  type EmailTemplate,
  renderPeerSlotEmail,
} from "./shared";

type BookingDecisionTemplateInput = {
  decision: "accept" | "decline";
  endsAt: Date;
  locale: EmailLocale;
  providerName: string;
  startsAt: Date;
  studentName: string;
  timeZone: string;
  viewUrl: string;
};

export function bookingDecisionTemplate(
  input: BookingDecisionTemplateInput,
): EmailTemplate {
  const { date, time } = appointmentDateTime(
    input.startsAt,
    input.endsAt,
    input.timeZone,
    input.locale,
  );
  const copy = copies[input.locale][input.decision];
  const layout = {
    eyebrow: copy.eyebrow,
    title: copy.title,
    greeting: copy.greeting(input.studentName),
    intro: copy.intro(input.providerName),
    details: [
      { label: copy.provider, value: input.providerName },
      { label: copy.date, value: date },
      { label: copy.time, value: `${time} · ${input.timeZone}` },
      { label: copy.status, value: copy.statusValue },
    ],
    notice: copy.notice,
    cta: { label: copy.cta, url: input.viewUrl },
    footer: copy.footer,
  };

  return {
    subject: copy.subject(input.providerName),
    html: renderPeerSlotEmail(layout),
    text: emailText(layout),
  };
}

const copies = {
  en: {
    accept: {
      eyebrow: "Confirmed",
      title: "Your appointment is confirmed.",
      greeting: (name: string) => `Hello ${name},`,
      intro: (provider: string) =>
        `${provider} accepted your appointment request. Your selected time is now confirmed.`,
      provider: "Provider",
      date: "Date",
      time: "Time",
      status: "Status",
      statusValue: "Confirmed",
      notice:
        "Please arrive on time. Keep this email for your appointment details.",
      cta: "Open PeerSlot",
      footer:
        "This confirmation was sent because you requested an appointment through PeerSlot.",
      subject: (provider: string) => `Appointment confirmed with ${provider}`,
    },
    decline: {
      eyebrow: "Request update",
      title: "Your appointment request was declined.",
      greeting: (name: string) => `Hello ${name},`,
      intro: (provider: string) =>
        `${provider} could not accept this appointment request. You can return to PeerSlot and choose another available time.`,
      provider: "Provider",
      date: "Requested date",
      time: "Requested time",
      status: "Status",
      statusValue: "Declined",
      notice: "No appointment was created for this time.",
      cta: "Choose another time",
      footer:
        "This update was sent because you requested an appointment through PeerSlot.",
      subject: (provider: string) =>
        `Update about your request with ${provider}`,
    },
  },
  tr: {
    accept: {
      eyebrow: "Onaylandı",
      title: "Randevunuz onaylandı.",
      greeting: (name: string) => `Merhaba ${name},`,
      intro: (provider: string) =>
        `${provider} randevu talebinizi kabul etti. Seçtiğiniz saat artık onaylandı.`,
      provider: "Sağlayıcı",
      date: "Tarih",
      time: "Saat",
      status: "Durum",
      statusValue: "Onaylandı",
      notice:
        "Lütfen zamanında hazır olun. Randevu ayrıntıları için bu e-postayı saklayın.",
      cta: "PeerSlot'u aç",
      footer:
        "Bu onay, PeerSlot üzerinden randevu talep ettiğiniz için gönderildi.",
      subject: (provider: string) => `${provider} ile randevunuz onaylandı`,
    },
    decline: {
      eyebrow: "Talep güncellemesi",
      title: "Randevu talebiniz reddedildi.",
      greeting: (name: string) => `Merhaba ${name},`,
      intro: (provider: string) =>
        `${provider} bu randevu talebini kabul edemedi. PeerSlot'a dönerek başka bir uygun saat seçebilirsiniz.`,
      provider: "Sağlayıcı",
      date: "Talep edilen tarih",
      time: "Talep edilen saat",
      status: "Durum",
      statusValue: "Reddedildi",
      notice: "Bu saat için randevu oluşturulmadı.",
      cta: "Başka bir saat seç",
      footer:
        "Bu güncelleme, PeerSlot üzerinden randevu talep ettiğiniz için gönderildi.",
      subject: (provider: string) =>
        `${provider} ile talebiniz hakkında güncelleme`,
    },
  },
} as const;
