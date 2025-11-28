import { type Locale, defaultLocale } from '@/i18n.config';

/**
 * Internationalized email templates
 * These templates support multiple languages and use the translation files
 */

// Email template types
export type EmailTemplateType =
  | 'welcome'
  | 'passwordReset'
  | 'verifyEmail'
  | 'paymentReceived'
  | 'verdictReady'
  | 'newRequest';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailData {
  welcome: { displayName?: string };
  passwordReset: { resetLink: string };
  verifyEmail: { verificationLink: string };
  paymentReceived: { amount: string; credits: number };
  verdictReady: { requestTitle: string; viewLink: string };
  newRequest: { category: string; tier: string; claimLink: string };
}

/**
 * Load email translations for a locale
 */
async function loadEmailTranslations(locale: Locale) {
  try {
    const messages = await import(`@/messages/${locale}.json`);
    return messages.Email?.subjects || {};
  } catch {
    // Fallback to default locale
    const messages = await import(`@/messages/${defaultLocale}.json`);
    return messages.Email?.subjects || {};
  }
}

/**
 * Get common email styles
 */
function getEmailStyles() {
  return `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { text-align: center; padding: 20px 0; }
      .logo { font-size: 24px; font-weight: bold; color: #4f46e5; }
      .content { padding: 20px 0; }
      .button {
        display: inline-block;
        padding: 12px 24px;
        background-color: #4f46e5;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 500;
      }
      .footer {
        padding: 20px 0;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        font-size: 12px;
        color: #6b7280;
      }
    </style>
  `;
}

/**
 * Generate welcome email
 */
async function generateWelcomeEmail(
  locale: Locale,
  data: EmailData['welcome']
): Promise<EmailTemplate> {
  const subjects = await loadEmailTranslations(locale);
  const name = data.displayName || 'there';

  // Localized content
  const content: Record<Locale, { greeting: string; intro: string; cta: string }> = {
    en: {
      greeting: `Hi ${name}`,
      intro: "Welcome to AskVerdict! We're excited to have you. Get honest feedback from real people on your dating profile, life decisions, or anything else you need a second opinion on.",
      cta: 'Get Started',
    },
    es: {
      greeting: `Hola ${name}`,
      intro: "¡Bienvenido a AskVerdict! Estamos emocionados de tenerte. Obtén comentarios honestos de personas reales sobre tu perfil de citas, decisiones de vida o cualquier otra cosa en la que necesites una segunda opinión.",
      cta: 'Comenzar',
    },
    de: {
      greeting: `Hallo ${name}`,
      intro: "Willkommen bei AskVerdict! Wir freuen uns, dass du dabei bist. Erhalte ehrliches Feedback von echten Menschen zu deinem Dating-Profil, Lebensentscheidungen oder allem anderen, worauf du eine zweite Meinung brauchst.",
      cta: 'Loslegen',
    },
    fr: {
      greeting: `Bonjour ${name}`,
      intro: "Bienvenue sur AskVerdict ! Nous sommes ravis de vous avoir. Obtenez des retours honnêtes de vraies personnes sur votre profil de rencontre, vos décisions de vie, ou tout ce sur quoi vous avez besoin d'un deuxième avis.",
      cta: 'Commencer',
    },
    ja: {
      greeting: `こんにちは ${name}さん`,
      intro: "AskVerdictへようこそ！ご参加いただきありがとうございます。マッチングプロフィール、人生の決断、その他セカンドオピニオンが必要なことについて、本物の人々から正直なフィードバックを受け取りましょう。",
      cta: '始める',
    },
    zh: {
      greeting: `你好 ${name}`,
      intro: "欢迎来到AskVerdict！很高兴有你加入。获取真人对你的约会资料、人生决定或任何其他需要第二意见的事情的诚实反馈。",
      cta: '开始',
    },
    ar: {
      greeting: `مرحباً ${name}`,
      intro: "مرحباً بك في AskVerdict! نحن متحمسون لانضمامك. احصل على تعليقات صادقة من أشخاص حقيقيين حول ملفك الشخصي للتعارف، أو قرارات الحياة، أو أي شيء آخر تحتاج فيه إلى رأي ثانٍ.",
      cta: 'ابدأ',
    },
    he: {
      greeting: `שלום ${name}`,
      intro: "ברוך הבא ל-AskVerdict! אנחנו שמחים שהצטרפת. קבל משוב כנה מאנשים אמיתיים על פרופיל ההיכרויות שלך, החלטות חיים, או כל דבר אחר שאתה צריך עליו דעה שנייה.",
      cta: 'התחל',
    },
  };

  const c = content[locale] || content.en;
  const dir = ['ar', 'he'].includes(locale) ? 'rtl' : 'ltr';

  const html = `
    <!DOCTYPE html>
    <html lang="${locale}" dir="${dir}">
    <head>${getEmailStyles()}</head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">AskVerdict</div>
        </div>
        <div class="content">
          <h1>${c.greeting}!</h1>
          <p>${c.intro}</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/start" class="button">${c.cta}</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} AskVerdict. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `${c.greeting}!\n\n${c.intro}\n\n${c.cta}: ${process.env.NEXT_PUBLIC_APP_URL}/start`;

  return {
    subject: subjects.welcome || 'Welcome to AskVerdict!',
    html,
    text,
  };
}

/**
 * Generate password reset email
 */
async function generatePasswordResetEmail(
  locale: Locale,
  data: EmailData['passwordReset']
): Promise<EmailTemplate> {
  const subjects = await loadEmailTranslations(locale);

  const content: Record<Locale, { title: string; intro: string; warning: string; cta: string }> = {
    en: {
      title: 'Reset Your Password',
      intro: "We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour.",
      warning: "If you didn't request this, you can safely ignore this email.",
      cta: 'Reset Password',
    },
    es: {
      title: 'Restablecer Tu Contraseña',
      intro: "Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña. Este enlace expirará en 1 hora.",
      warning: "Si no solicitaste esto, puedes ignorar este correo de forma segura.",
      cta: 'Restablecer Contraseña',
    },
    de: {
      title: 'Passwort Zurücksetzen',
      intro: "Wir haben eine Anfrage zum Zurücksetzen deines Passworts erhalten. Klicke auf den Button unten, um ein neues Passwort zu erstellen. Dieser Link läuft in 1 Stunde ab.",
      warning: "Wenn du dies nicht angefordert hast, kannst du diese E-Mail ignorieren.",
      cta: 'Passwort Zurücksetzen',
    },
    fr: {
      title: 'Réinitialiser Votre Mot de Passe',
      intro: "Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe. Ce lien expirera dans 1 heure.",
      warning: "Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email.",
      cta: 'Réinitialiser le Mot de Passe',
    },
    ja: {
      title: 'パスワードをリセット',
      intro: "パスワードリセットのリクエストを受け取りました。下のボタンをクリックして新しいパスワードを作成してください。このリンクは1時間で期限切れになります。",
      warning: "これをリクエストしていない場合は、このメールを無視してください。",
      cta: 'パスワードをリセット',
    },
    zh: {
      title: '重置密码',
      intro: "我们收到了重置您密码的请求。点击下面的按钮创建新密码。此链接将在1小时后过期。",
      warning: "如果您没有请求此操作，可以安全地忽略此电子邮件。",
      cta: '重置密码',
    },
    ar: {
      title: 'إعادة تعيين كلمة المرور',
      intro: "تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة. سينتهي هذا الرابط خلال ساعة واحدة.",
      warning: "إذا لم تطلب هذا، يمكنك تجاهل هذا البريد الإلكتروني بأمان.",
      cta: 'إعادة تعيين كلمة المرور',
    },
    he: {
      title: 'איפוס סיסמה',
      intro: "קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ על הכפתור למטה כדי ליצור סיסמה חדשה. קישור זה יפוג בעוד שעה.",
      warning: "אם לא ביקשת זאת, אתה יכול להתעלם מאימייל זה בבטחה.",
      cta: 'איפוס סיסמה',
    },
  };

  const c = content[locale] || content.en;
  const dir = ['ar', 'he'].includes(locale) ? 'rtl' : 'ltr';

  const html = `
    <!DOCTYPE html>
    <html lang="${locale}" dir="${dir}">
    <head>${getEmailStyles()}</head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">AskVerdict</div>
        </div>
        <div class="content">
          <h1>${c.title}</h1>
          <p>${c.intro}</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${data.resetLink}" class="button">${c.cta}</a>
          </p>
          <p style="color: #6b7280; font-size: 14px;">${c.warning}</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} AskVerdict. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `${c.title}\n\n${c.intro}\n\n${c.cta}: ${data.resetLink}\n\n${c.warning}`;

  return {
    subject: subjects.passwordReset || 'Reset your password',
    html,
    text,
  };
}

/**
 * Generate email verification email
 */
async function generateVerifyEmailTemplate(
  locale: Locale,
  data: EmailData['verifyEmail']
): Promise<EmailTemplate> {
  const subjects = await loadEmailTranslations(locale);

  const content: Record<Locale, { title: string; intro: string; cta: string }> = {
    en: {
      title: 'Verify Your Email',
      intro: "Thanks for signing up! Please click the button below to verify your email address.",
      cta: 'Verify Email',
    },
    es: {
      title: 'Verifica Tu Correo',
      intro: "¡Gracias por registrarte! Por favor haz clic en el botón de abajo para verificar tu dirección de correo.",
      cta: 'Verificar Correo',
    },
    de: {
      title: 'E-Mail Verifizieren',
      intro: "Danke für deine Anmeldung! Bitte klicke auf den Button unten, um deine E-Mail-Adresse zu verifizieren.",
      cta: 'E-Mail Verifizieren',
    },
    fr: {
      title: 'Vérifiez Votre Email',
      intro: "Merci de vous être inscrit ! Veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse email.",
      cta: 'Vérifier l\'Email',
    },
    ja: {
      title: 'メールアドレスを確認',
      intro: "ご登録ありがとうございます！下のボタンをクリックしてメールアドレスを確認してください。",
      cta: 'メールを確認',
    },
    zh: {
      title: '验证您的电子邮件',
      intro: "感谢您的注册！请点击下面的按钮验证您的电子邮件地址。",
      cta: '验证邮件',
    },
    ar: {
      title: 'تحقق من بريدك الإلكتروني',
      intro: "شكراً للتسجيل! يرجى النقر على الزر أدناه للتحقق من عنوان بريدك الإلكتروني.",
      cta: 'تحقق من البريد الإلكتروني',
    },
    he: {
      title: 'אמת את האימייל שלך',
      intro: "תודה שנרשמת! אנא לחץ על הכפתור למטה כדי לאמת את כתובת האימייל שלך.",
      cta: 'אמת אימייל',
    },
  };

  const c = content[locale] || content.en;
  const dir = ['ar', 'he'].includes(locale) ? 'rtl' : 'ltr';

  const html = `
    <!DOCTYPE html>
    <html lang="${locale}" dir="${dir}">
    <head>${getEmailStyles()}</head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">AskVerdict</div>
        </div>
        <div class="content">
          <h1>${c.title}</h1>
          <p>${c.intro}</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${data.verificationLink}" class="button">${c.cta}</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} AskVerdict. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `${c.title}\n\n${c.intro}\n\n${c.cta}: ${data.verificationLink}`;

  return {
    subject: subjects.verifyEmail || 'Verify your email address',
    html,
    text,
  };
}

/**
 * Generate payment received email
 */
async function generatePaymentReceivedEmail(
  locale: Locale,
  data: EmailData['paymentReceived']
): Promise<EmailTemplate> {
  const subjects = await loadEmailTranslations(locale);

  const content: Record<Locale, { title: string; intro: string; credited: string; cta: string }> = {
    en: {
      title: 'Payment Received',
      intro: `Thank you for your payment of ${data.amount}!`,
      credited: `${data.credits} credits have been added to your account.`,
      cta: 'View Your Credits',
    },
    es: {
      title: 'Pago Recibido',
      intro: `¡Gracias por tu pago de ${data.amount}!`,
      credited: `Se han agregado ${data.credits} créditos a tu cuenta.`,
      cta: 'Ver Tus Créditos',
    },
    de: {
      title: 'Zahlung Erhalten',
      intro: `Vielen Dank für deine Zahlung von ${data.amount}!`,
      credited: `${data.credits} Credits wurden deinem Konto gutgeschrieben.`,
      cta: 'Credits Anzeigen',
    },
    fr: {
      title: 'Paiement Reçu',
      intro: `Merci pour votre paiement de ${data.amount} !`,
      credited: `${data.credits} crédits ont été ajoutés à votre compte.`,
      cta: 'Voir Vos Crédits',
    },
    ja: {
      title: '支払いを受け取りました',
      intro: `${data.amount}のお支払いありがとうございます！`,
      credited: `${data.credits}クレジットがアカウントに追加されました。`,
      cta: 'クレジットを見る',
    },
    zh: {
      title: '收到付款',
      intro: `感谢您支付${data.amount}！`,
      credited: `已向您的账户添加${data.credits}积分。`,
      cta: '查看积分',
    },
    ar: {
      title: 'تم استلام الدفعة',
      intro: `شكراً لدفعتك البالغة ${data.amount}!`,
      credited: `تمت إضافة ${data.credits} رصيد إلى حسابك.`,
      cta: 'عرض رصيدك',
    },
    he: {
      title: 'התשלום התקבל',
      intro: `תודה על התשלום שלך בסך ${data.amount}!`,
      credited: `${data.credits} קרדיטים נוספו לחשבון שלך.`,
      cta: 'צפה בקרדיטים שלך',
    },
  };

  const c = content[locale] || content.en;
  const dir = ['ar', 'he'].includes(locale) ? 'rtl' : 'ltr';

  const html = `
    <!DOCTYPE html>
    <html lang="${locale}" dir="${dir}">
    <head>${getEmailStyles()}</head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">AskVerdict</div>
        </div>
        <div class="content">
          <h1>${c.title}</h1>
          <p>${c.intro}</p>
          <p><strong>${c.credited}</strong></p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/account" class="button">${c.cta}</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} AskVerdict. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `${c.title}\n\n${c.intro}\n${c.credited}\n\n${c.cta}: ${process.env.NEXT_PUBLIC_APP_URL}/account`;

  return {
    subject: subjects.paymentReceived || 'Payment received — credits added!',
    html,
    text,
  };
}

/**
 * Main function to generate email template
 */
export async function generateEmailTemplate<T extends EmailTemplateType>(
  templateType: T,
  locale: Locale,
  data: EmailData[T]
): Promise<EmailTemplate> {
  switch (templateType) {
    case 'welcome':
      return generateWelcomeEmail(locale, data as EmailData['welcome']);
    case 'passwordReset':
      return generatePasswordResetEmail(locale, data as EmailData['passwordReset']);
    case 'verifyEmail':
      return generateVerifyEmailTemplate(locale, data as EmailData['verifyEmail']);
    case 'paymentReceived':
      return generatePaymentReceivedEmail(locale, data as EmailData['paymentReceived']);
    default:
      throw new Error(`Unknown email template type: ${templateType}`);
  }
}

/**
 * Helper to get user's preferred locale from various sources
 */
export function getUserLocale(
  userPreference?: string,
  acceptLanguage?: string
): Locale {
  // First check user preference
  if (userPreference && ['en', 'es', 'de', 'fr', 'ja', 'zh', 'ar', 'he'].includes(userPreference)) {
    return userPreference as Locale;
  }

  // Then check Accept-Language header
  if (acceptLanguage) {
    const primaryLang = acceptLanguage.split(',')[0]?.split('-')[0]?.toLowerCase();
    if (primaryLang && ['en', 'es', 'de', 'fr', 'ja', 'zh', 'ar', 'he'].includes(primaryLang)) {
      return primaryLang as Locale;
    }
  }

  return defaultLocale;
}
