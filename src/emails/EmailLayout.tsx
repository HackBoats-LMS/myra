import { Html, Head, Body, Container, Text, Preview, Section, Link as EmailLink } from '@react-email/components';
import * as React from 'react';

interface EmailLayoutProps {
  previewText: string;
  title: string;
  children: React.ReactNode;
  cta?: {
    text: string;
    href: string;
  };
  footerText?: string;
}

export default function EmailLayout({ 
  previewText, 
  title, 
  children, 
  cta, 
  footerText 
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f6f9fc', padding: '20px 0' }}>
        <Container style={{ backgroundColor: '#ffffff', border: '1px solid #f0f0f0', borderRadius: '5px', padding: '45px' }}>
          <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#0D3B66', marginBottom: '24px', textAlign: 'center' }}>
            Myra Shopping Mall
          </Text>
          <Text style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', textAlign: 'center' }}>
            {title}
          </Text>
          
          <Section style={{ marginTop: '24px' }}>
            {children}
          </Section>
          
          {cta && (
            <div style={{ textAlign: 'center', marginTop: '32px', marginBottom: '32px' }}>
              <EmailLink
                href={cta.href}
                style={{
                  backgroundColor: '#0D3B66',
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  display: 'inline-block'
                }}
              >
                {cta.text}
              </EmailLink>
            </div>
          )}
          
          <Text style={{ fontSize: '14px', color: '#777', marginTop: '32px' }}>
            {footerText || 'If you have any questions, reply to this email or contact us at support@myra.com.'}
          </Text>
          <Text style={{ fontSize: '12px', color: '#888', marginTop: '48px', textAlign: 'center' }}>
            &copy; {new Date().getFullYear()} Myra Shopping Mall. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}