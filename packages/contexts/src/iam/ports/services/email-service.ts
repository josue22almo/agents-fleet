export interface EmailService {
  sendInvitation(params: {
    to: string;
    organizationName: string;
    invitedByName: string;
    token: string;
  }): Promise<void>;
}
