import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                card: "hsl(var(--card))",
                "card-foreground": "hsl(var(--card-foreground))",
                popover: "hsl(var(--popover))",
                "popover-foreground": "hsl(var(--popover-foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
                DEFAULT: "0",
                none: "0",
                full: "0", // Force rounded-full to be square too if desired, or leave it for avatars. 
                // User asked for "all rounded borders to no border radius", implying structural elements.
                // But usually avatars (rounded-full) are exceptions.
                // I will stick to overriding standard sizes and 'DEFAULT'. 
                // Actually the user said "change all the rounded borders to no border radius".
                // I'll assume they mean the UI elements (cards, buttons), but maybe not circular avatars.
                // I will keep 'full' as is for now for avatars, but set others to 0.
            },
        },
        // To be absolutely sure, I can override the default theme
        borderRadius: {
            'none': '0',
            'sm': '0',
            DEFAULT: '0',
            'md': '0',
            'lg': '0',
            'xl': '0',
            '2xl': '0',
            '3xl': '0',
            'full': '9999px', // Keep avatars circular
        }
    },
    plugins: [],
};
export default config;
