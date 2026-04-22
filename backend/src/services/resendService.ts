import { Resend } from "resend";

const getOptionalEnv = (name: string) => process.env[name]?.trim();

const getRequiredEnv = (name: string) => {
  const value = getOptionalEnv(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const getResendClient = () => new Resend(getRequiredEnv("RESEND_API_KEY"));

const isDevelopmentMode = () => {
  return (process.env.NODE_ENV || "development") !== "production";
};

const getFromAddress = () => {
  if (isDevelopmentMode()) {
    const devFromEmail =
      getOptionalEnv("RESEND_DEV_FROM_EMAIL") || "onboarding@resend.dev";
    const devFromName =
      getOptionalEnv("RESEND_DEV_FROM_NAME") || "Michelin Hackathon";
    return `${devFromName} <${devFromEmail}>`;
  }

  const fromEmail = getRequiredEnv("RESEND_FROM_EMAIL");
  const fromName = getOptionalEnv("RESEND_FROM_NAME") || "Michelin Hackathon";
  return `${fromName} <${fromEmail}>`;
};

const getRecipientList = (to: string) => {
  if (isDevelopmentMode()) {
    const devRecipient = getOptionalEnv("RESEND_DEV_TO_EMAIL") || to;
    return [devRecipient];
  }

  return [to];
};

const getReplyTo = () => {
  if (isDevelopmentMode()) {
    return getOptionalEnv("RESEND_DEV_REPLY_TO") || undefined;
  }

  return getOptionalEnv("RESEND_REPLY_TO") || undefined;
};

const shouldFallbackToConsole = () => isDevelopmentMode();

export const sendPasswordResetCodeEmail = async ({
  to,
  code,
  expiresInMinutes,
}: {
  to: string;
  code: string;
  expiresInMinutes: number;
}) => {
  try {
    const resend = getResendClient();
    const recipients = getRecipientList(to);

    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: recipients,
      subject: "Code de reinitialisation de votre mot de passe",
      replyTo: getReplyTo(),
      text: [
        "Bonjour,",
        "",
        `Votre code de reinitialisation est : ${code}`,
        `Ce code expire dans ${expiresInMinutes} minutes.`,
        "",
        "Si vous n'avez pas demande cette operation, ignorez simplement cet email.",
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
          <h2 style="margin-bottom: 16px;">Reinitialisation du mot de passe</h2>
          <p>Bonjour,</p>
          <p>Voici votre code de reinitialisation :</p>
          <div style="margin: 24px 0; font-size: 28px; font-weight: 700; letter-spacing: 6px;">
            ${code}
          </div>
          <p>Ce code expire dans ${expiresInMinutes} minutes.</p>
          <p>Si vous n'avez pas demande cette operation, ignorez simplement cet email.</p>
        </div>
      `,
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log(
      `[RESEND] Code envoye a ${recipients.join(", ")} pour la demande de ${to}`,
    );

    if (isDevelopmentMode()) {
      console.log(`[DEV INFO] Code de reinitialisation pour ${to}: ${code}`);
    }
  } catch (error: any) {
    if (shouldFallbackToConsole()) {
      console.warn(
        `[DEV FALLBACK] Impossible d'envoyer l'email via Resend pour ${to}: ${error.message}`,
      );
      console.warn(`[DEV FALLBACK] Code de reinitialisation pour ${to}: ${code}`);
      return;
    }

    throw error;
  }
};
