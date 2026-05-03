/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
        body:    ['var(--font-body)', 'sans-serif'],
      },
      colors: {
        bg:      '#07090d',
        surface: '#0d1117',
        s2:      '#131b24',
        border:  '#1e2d3d',
        accent:  '#00e5ff',
        a2:      '#ff6b35',
        a3:      '#39ff14',
        warn:    '#ffcc00',
        danger:  '#ff2d55',
        dim:     '#4a6274',
        bright:  '#eaf4fb',
      },
      animation: {
        'fade-up':    'fadeUp .6s ease forwards',
        'fade-in':    'fadeIn .5s ease forwards',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'scan':       'scanLine 8s linear infinite',
        'float':      'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:    { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        glowPulse: { '0%,100%': { opacity: .4 }, '50%': { opacity: 1 } },
        scanLine:  { '0%': { top: '-4px' }, '100%': { top: '100vh' } },
        float:     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
      },
    },
  },
  plugins: [],
}
