import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({

      // Enable dark mode based on a class (e.g., <html class="dark">)
  darkMode: 'class', // This is crucial for our theme toggle
  theme: {
    extend: {
      // Define custom font families here
      fontFamily: {
        // 'inter' will map to the 'Inter' font loaded via CDN
        inter: ['Inter', 'sans-serif'],
        // 'poppins' will map to the 'Poppins' font loaded via CDN
        poppins: ['Poppins', 'sans-serif'],
        // 'playfair' will map to the 'Playfair Display' font loaded via CDN
        playfair: ['"Playfair Display"', 'serif'],
      },
      // You can add custom utilities or extend existing ones here if needed later
    },
},
  plugins: [
    tailwindcss(),

    
  ],
})