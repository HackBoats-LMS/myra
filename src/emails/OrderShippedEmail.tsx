import { Text, Link as EmailLink } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './EmailLayout';

interface OrderShippedEmailProps {
  orderId: string;
  trackingUrl?: string;
}

export default function OrderShippedEmail({ orderId, trackingUrl }: OrderShippedEmailProps) {
  const shortOrderId = orderId.split('-')[0].toUpperCase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  return (
    <EmailLayout
      previewText={`Your order is on its way! (Order #${shortOrderId})`}
      title="Your order has shipped!"
      cta={{
        text: "View Order Status",
        href: `${appUrl}/account`
      }}
      footerText="If you have any questions, reply to this email or contact us at support@myra.com."
    >
      <Text style={{ fontSize: '16px', color: '#555', marginTop: '16px' }}>
        Great news! Your order <strong>#{shortOrderId}</strong> has been shipped and is on its way to you.
      </Text>
      
      {trackingUrl && (
        <Text style={{ fontSize: '14px', color: '#555', textAlign: 'center', marginTop: '24px' }}>
          Track your package: <EmailLink href={trackingUrl}>{trackingUrl}</EmailLink>
        </Text>
      )}
    </EmailLayout>
  );
}