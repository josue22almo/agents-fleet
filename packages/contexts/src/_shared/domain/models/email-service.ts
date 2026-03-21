import type { Mail } from "./mail";

export interface EmailService {
  send(mail: Mail): Promise<void>;
}
