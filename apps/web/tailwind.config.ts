import type { Config } from 'tailwindcss';
import { createRequire } from 'node:module';
import tailwindcssAnimate from 'tailwindcss-animate';

// Load tailwindcss-motion via require so its CJS build (dist/index.cjs) is used.
// Its ESM build does `import flattenColorPalette from 'tailwindcss/lib/util/...'`,
// which under Node's native ESM/CJS interop yields the exports object instead of
// the function, crashing the build with "flattenColorPalette is not a function".
const requireCjs = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tailwindcssMotion = requireCjs('tailwindcss-motion');

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'act-gradient': 'var(--act-gradient)',
      },
      animation: {
        scrollX: 'scrollX 7s linear infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        kenburns: {
          '0%': {
            transform: 'scale(1)',
          },
          '50%': {
            transform: 'scale(1.1)',
          },
          '100%': {
            transform: 'scale(1)',
          },
        },
        scrollX: {
          '0%': {
            transform: 'translateX(0)',
          },
          '100%': {
            transform: 'translateX(-100%)',
          },
        },
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      fontSize: {
        'heading-1': [
          '64px',
          {
            lineHeight: '83px',
            letterSpacing: '0px',
          },
        ],
        'heading-2': [
          '48px',
          {
            lineHeight: '62px',
            letterSpacing: '0px',
          },
        ],
        'heading-3': [
          '36px',
          {
            lineHeight: '47px',
            letterSpacing: '0px',
          },
        ],
        'heading-4': [
          '24px',
          {
            lineHeight: '83px',
            letterSpacing: '0px',
          },
        ],
        'heading-5': [
          '16px',
          {
            lineHeight: '21px',
            letterSpacing: '0px',
          },
        ],
      },
      colors: {
        'violet-blue': '#221b2d',
        'act-base-dark': '#0E0C15',
        'black-200': '#15131D',
        'black-300': '#252134',
        'gray-100': '#757185',
        'gray-200': '#ADA8C3',
        'gray-300': '#CAC6DD',
        'gray-400': '#717171',
        'gray-450': '#57575F',
        'gray-500': '#808080',
        white: '#FFFFFF',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        act: {
          turquoise: '#89f9e8',
          gold: '#facb7b',
          purple: '#d77fec',
          blue: '#9397fb',
          'base-dark': '#0e0c15',
          surface: '#181424',
          elevated: '#221b2d',
          border: '#2a2438',
          'border-gray': '#999999',
        },
        'act-2': {
          purple: '#837ED5',
          'purple-light': '#9C98DD',
          'purple-lighter': '#E1E0F5',
          'midnight-blue': '#000816',
          'gray-dark': '#333A45',
          'gray-medium': '#666B73',
          'gray-light': '#999CA2',
          'dark-blue-gray': '#2b2b3a',
          'dark-gray-100': '#1C1C1C00',
          'dark-gray-200': '#393939',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sora: ['var(--font-sora)'],
        sourceCodePro: ['var(--font-source-code-pro)'],
        spaceGrotesk: ['var(--font-space-grotesk)'],
        onest: ['var(--font-onest)'],
        geist: ['var(--font-geist)'],
        geistMono: ['var(--font-geist-mono)'],
        exeroeFuturistic: ['var(--font-exeroe-futuristic)'],
      },
      boxShadow: {
        'custom-dual': '0px 3.5px 19px 0px #484052, 1px 1px 2px 0px rgba(0,0,0,0.25) inset',
      },
    },
  },
  plugins: [tailwindcssAnimate, tailwindcssMotion],
} satisfies Config;
