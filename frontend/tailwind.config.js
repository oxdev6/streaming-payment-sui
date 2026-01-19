/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'void': '#050508',
        'deep': '#0a0b10',
        'surface': '#111318',
        'elevated': '#1a1c24',
        'cyan': '#00e5ff',
        'cyan-dim': '#00b8d4',
      },
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
