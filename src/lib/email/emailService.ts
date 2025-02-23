// /lib/email/emailService.ts
import { Resend } from "resend";
import { TeamInviteEmail } from "./templates/teamInvite";

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  static async sendTeamInvite({
    email,
    inviterName,
    teamName,
    role,
    inviteUrl,
    expiresIn,
  }: {
    email: string;
    inviterName: string;
    teamName: string;
    role: string;
    inviteUrl: string;
    expiresIn: string;
  }) {
    try {
      await resend.emails.send({
        from: "Your App <team@yourdomain.com>",
        to: email,
        subject: `Join ${teamName} on our platform`,
        react: TeamInviteEmail({
          inviterName,
          teamName,
          role,
          inviteUrl,
          expiresIn,
        }),
      });
    } catch (error) {
      console.error("Failed to send invite email:", error);
      throw error;
    }
  }
}
