import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './EmailLayout';

export default function ResetPasswordEmail({ resetUrl }: { resetUrl: string }) {
  return (
    <EmailLayout
      previewText="Reset your Myra password"
      title="Reset Your Password"
      cta={{
        text: "Reset Password",
        href: resetUrl
      }}
      footerText="If you did not request this, you can safely ignore this email. Your password will not change."
    >
      <Text style={{ fontSize: '16px', color: '#333' }}>
        We received a request to reset your password.
      </Text>
    </EmailLayout>
  );
}