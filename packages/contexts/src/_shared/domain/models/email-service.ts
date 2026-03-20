import type { Mail } from "./mail.js";

export interface EmailService {
  send(mail: Mail): Promise<void>;
}
