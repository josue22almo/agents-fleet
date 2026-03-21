import { describe, it, expect } from "vitest";
import { SmtpEmailService } from "./smtp-email.service";
import { Mail } from "../domain/models/mail";

const hasCredentials = !!process.env.SMTP_USERNAME && !!process.env.SMTP_PASSWORD;

const config = {
  host: process.env.SMTP_HOST ?? "mail.smtp2go.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  username: process.env.SMTP_USERNAME ?? "",
  password: process.env.SMTP_PASSWORD ?? "",
  from: process.env.SMTP_FROM ?? "noreply@multasapp.com",
};

describe.skipIf(!hasCredentials)("SmtpEmailService (integration)", () => {
  it("sends a real email", async () => {
    const service = new SmtpEmailService(config);
    const mail = Mail.create({
      to: config.from,
      subject: "SmtpEmailService integration test",
      body: "<p>If you received this, the test passed.</p>",
    });

    await expect(service.send(mail)).resolves.toBeUndefined();
  });
});
