import {
  emailText,
  type EmailLocale,
  type EmailTemplate,
  renderPeerSlotEmail,
} from "./shared";

type VerifyEmailTemplateInput = {
  locale: EmailLocale;
  name: string;
  verificationUrl: string;
};

export function verifyEmailTemplate(
  input: VerifyEmailTemplateInput,
): EmailTemplate {
  const copy = input.locale === "tr" ? turkishCopy : englishCopy;
  const layout = {
    eyebrow: copy.eyebrow,
    title: copy.title,
    greeting: copy.greeting(input.name),
    intro: copy.intro,
    notice: copy.notice,
    cta: { label: copy.cta, url: input.verificationUrl },
    footer: copy.footer,
  };

  return {
    subject: copy.subject,
    html: renderPeerSlotEmail(layout),
    text: emailText(layout),
  };
}

const englishCopy = {
  eyebrow: "Email verification",
  title: "Confirm your email address.",
  greeting: (name: string) => `Hello ${name},`,
  intro:
    "Verify this email address to finish creating your PeerSlot account and continue securely.",
  notice:
    "This verification link expires in one hour. If you did not create this account, you can ignore this email.",
  cta: "Verify email",
  footer:
    "For your security, PeerSlot will never ask you to send your password by email.",
  subject: "Verify your PeerSlot email address",
};

const turkishCopy = {
  eyebrow: "E-posta doğrulama",
  title: "E-posta adresinizi doğrulayın.",
  greeting: (name: string) => `Merhaba ${name},`,
  intro:
    "PeerSlot hesabınızı oluşturmayı tamamlamak ve güvenli bir şekilde devam etmek için bu e-posta adresini doğrulayın.",
  notice:
    "Bu doğrulama bağlantısının süresi bir saat içinde dolar. Bu hesabı siz oluşturmadıysanız bu e-postayı yok sayabilirsiniz.",
  cta: "E-postayı doğrula",
  footer:
    "Güvenliğiniz için PeerSlot hiçbir zaman parolanızı e-posta ile göndermenizi istemez.",
  subject: "PeerSlot e-posta adresinizi doğrulayın",
};
