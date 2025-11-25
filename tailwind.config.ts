import type { Config } from "tailwindcss";

const config: Config = {
  // Garantir que ele procure os componentes e páginas
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Definimos o preto puro para o bg-black (garante o visual cyberpunk)
      colors: {
        'black': '#000000', 
      },
      // Configurações de fontes (pode ser ajustado)
      fontFamily: {
        mono: ['var(--font-geist-mono)'], 
      },
      // Estilos de sombra customizados para o neon
      boxShadow: {
        'neon-sm': '0 0 5px rgba(16, 185, 129, 0.5)',
        'neon-lg': '0 0 10px rgba(16, 185, 129, 0.7)',
      }
    },
  },
  // 🚨 O FIX DO ANIMATE-IN ESTÁ AQUI: Registramos o plugin
  plugins: [
    require('tailwindcss-animate'),
  ],
};

export default config;