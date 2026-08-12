import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './EmailLayout';

export default function WelcomeEmail({ name }: { name: string }) {
  return (
    <EmailLayout
      previewText="Welcome to Myra Shopping Mall!"
      title="Welcome to Myra Shopping Mall!"
      cta={{
        text: "Start Shopping",
        href: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      }}
    >
      <Text style={{ fontSize: '18px', color: '#333', fontWeight: 'bold' }}>
        Welcome, {name}!
      </Text>
      <Text style={{ fontSize: '16px', color: '#333' }}>
        We&rsquo;re thrilled to have you here. Get ready to discover amazing collections and exclusive deals.
      </Text>
    </EmailLayout>
  );
}