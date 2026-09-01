import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './EmailLayout';

interface OrderDeliveredEmailProps {
  orderId: string;
}

export default function OrderDeliveredEmail({ orderId }: OrderDeliveredEmailProps) {
  const shortOrderId = orderId.split('-')[0].toUpperCase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  return (
    <EmailLayout
      previewText={`Your order has been delivered! (Order #${shortOrderId})`}
      title="Package Delivered!"
      cta={{
        text: "Write a Review",
        href: `${appUrl}/account`
      }}
      footerText="If there's any issue with your order or it hasn't actually arrived, please reply to this email immediately or contact us at support@myra.com."
    >
      <Text style={{ fontSize: '16px', color: '#555', marginTop: '16px' }}>
        Your order <strong>#{shortOrderId}</strong> has been successfully delivered. We hope you love your new items!
      </Text>
    </EmailLayout>
  );
}
