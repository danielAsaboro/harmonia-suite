// /lib/email/templates/teamInvite.tsx
import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Link,
  Preview,
  Button,
} from "@react-email/components";

interface TeamInviteEmailProps {
  inviterName: string;
  teamName: string;
  role: string;
  inviteUrl: string;
  expiresIn: string;
}

export const TeamInviteEmail = ({
  inviterName,
  teamName,
  role,
  inviteUrl,
  expiresIn,
}: TeamInviteEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Join {teamName} on our platform</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", padding: "20px 0" }}>
        <Container>
          <Text>
            {inviterName} has invited you to join {teamName} as a {role}.
          </Text>
          <Button href={inviteUrl}>Accept Invitation</Button>
          <Text style={{ fontSize: "14px", color: "#666" }}>
            This invite will expire in {expiresIn}
          </Text>
          <Text style={{ fontSize: "12px", color: "#999" }}>
            If you're having trouble clicking the button, copy and paste this
            URL into your browser: {inviteUrl}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};
