import { Logo } from '@/components/ui/logo';
import { Facebook, Instagram, MessageCircle, Send, Twitter } from 'lucide-react';
import Link from 'next/link';

const footerLinks = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/contact', label: 'Contact' },
  { href: '/about', label: 'About' },
];

const socialLinks = [
  { href: '#discord', icon: MessageCircle, label: 'Discord' },
  { href: '#twitter', icon: Twitter, label: 'Twitter' },
  { href: '#instagram', icon: Instagram, label: 'Instagram' },
  { href: '#telegram', icon: Send, label: 'Telegram' },
  { href: '#facebook', icon: Facebook, label: 'Facebook' },
];

export function Footer() {
  return (
    <footer className="border-t bg-act-base-dark backdrop-blur supports-[backdrop-filter]:bg-act-base-dark/60 z-10">
      <div className="container mx-auto px-4">
        {/* Upper Footer */}
        <div className="flex flex-col md:flex-row py-8 md:h-24 items-center justify-between gap-6 md:gap-0">
          {/* Logo - Left */}
          <div>
            <Logo />
          </div>

          {/* Links - Right */}
          <nav className="flex flex-wrap items-center justify-center md:justify-end gap-4 md:gap-8">
            {footerLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="button-text text-white opacity-50 hover:opacity-100 hover:gradient-Text transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Lower Footer */}
        <div className="flex flex-col-reverse md:flex-row py-6 md:h-20 items-center justify-between gap-4 md:gap-0">
          {/* Copyright */}
          <div className="text-sm text-center md:text-left text-muted-foreground">
            © {new Date().getFullYear()} Act Flow. All rights reserved.
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700 transition-colors"
                aria-label={link.label}
              >
                <link.icon className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
