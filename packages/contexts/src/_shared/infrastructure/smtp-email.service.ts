import { createTransport, type Transporter } from "nodemailer";
import type { Mail } from "../domain/models/mail.js";
import type { EmailService } from "../domain/models/email-service.js";

export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  from: string;
}

export class SmtpEmailService implements EmailService {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: SmtpConfig) {
    this.from = config.from;
    this.transporter = createTransport({
      host: config.host,
      port: config.port,
      secure: false,
      auth: {
        user: config.username,
        pass: config.password,
      },
    });
  }

  async send(mail: Mail): Promise<void> {
    const primitives = mail.toPrimitives();
    await this.transporter.sendMail({
      from: this.from,
      to: primitives.to,
      subject: primitives.subject,
      html: primitives.body,
    });
  }
}
