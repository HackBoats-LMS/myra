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
        <Container style={{ backgroundColor: '#ffffff', border: '1px solid #B6925B', borderTop: '4px solid #4A3B2C', padding: '45px' }}>
          <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#4A3B2C', marginBottom: '24px', textAlign: 'center', fontFamily: 'serif', letterSpacing: '0.05em' }}>
            Myra Shopping Mall
          </Text>
          <Text style={{ fontSize: '18px', fontWeight: 'bold', color: '#B6925B', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
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
                  backgroundColor: '#4A3B2C',
                  color: '#fff',
                  padding: '14px 28px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  display: 'inline-block',
                  border: '1px solid #B6925B'
                }}
              >
                {cta.text}
              </EmailLink>
            </div>
          )}
          
          <Text style={{ fontSize: '12px', color: '#777', marginTop: '32px', borderTop: '1px solid #eaeaea', paddingTop: '16px' }}>
            {footerText || 'If you have any questions, reply to this email or contact us at support@myra.com.'}
          </Text>
          <Text style={{ fontSize: '10px', color: '#888', marginTop: '48px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            &copy; {new Date().getFullYear()} Myra Shopping Mall. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}