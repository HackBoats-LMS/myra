import { Text, Section } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './EmailLayout';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationEmailProps {
  orderId: string;
  totalAmount: number;
  items: OrderItem[];
  customerName?: string | null;
}

export default function OrderConfirmationEmail({ orderId, totalAmount, items = [] }: OrderConfirmationEmailProps) {
  const shortOrderId = orderId.split('-')[0].toUpperCase();
  
  return (
    <EmailLayout
      previewText={`Thank you for your order! (Order #${shortOrderId})`}
      title="Thank you for your order!"
      footerText="If you have any questions, reply to this email or contact us at support@myra.com."
    >
      <Text style={{ fontSize: '16px', color: '#555', marginTop: '16px' }}>
        We&rsquo;ve received your order <strong>#{shortOrderId}</strong> and we&rsquo;re getting it ready to be shipped. We will notify you when it&rsquo;s on the way.
      </Text>
      
      <Section style={{ marginTop: '32px', marginBottom: '32px', borderTop: '1px solid #eaeaea', paddingTop: '16px' }}>
        <Text style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>Order Summary</Text>
        
        {items.map((item, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <Text style={{ margin: 0, color: '#555' }}>{item.quantity}x {item.name}</Text>
            <Text style={{ margin: 0, color: '#333', fontWeight: 'bold' }}>₹{(item.price * item.quantity).toFixed(2)}</Text>
          </div>
        ))}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid #eaeaea', paddingTop: '16px' }}>
          <Text style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>Total</Text>
          <Text style={{ margin: 0, fontWeight: 'bold', fontSize: '18px', color: '#0D3B66' }}>₹{totalAmount.toFixed(2)}</Text>
        </div>
      </Section>
    </EmailLayout>
  );
}