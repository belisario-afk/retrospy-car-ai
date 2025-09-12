/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/index.html", "./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        neon: {
          green: "#39FF14",
          dim: "#19C70C"
        },
        crt: {
          bg: "#0a0f0a",
          text: "#c8ffcc"
        }
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "10%": { opacity: "0.2" },
          "50%": { opacity: "0.25" },
          "100%": { transform: "translateY(100%)", opacity: "0" }
        },
        glitch: {
          "0%": { clipPath: "inset(0 0 0 0)" },
          "20%": { clipPath: "inset(10% 0 15% 0)" },
          "40%": { clipPath: "inset(40% 0 10% 0)" },
          "60%": { clipPath: "inset(80% 0 5% 0)" },
          "80%": { clipPath: "inset(20% 0 30% 0)" },
          "100%": { clipPath: "inset(0 0 0 0)" }
        },
        pulseBar: {
          "0%,100%": { transform: "scaleY(0.85)" },
          "50%": { transform: "scaleY(1.15)" }
        }
      },
      animation: {
        scanline: "scanline 6s linear infinite",
        glitch: "glitch 2s infinite",
        pulseBar: "pulseBar 1.2s ease-in-out infinite"
      },
      dropShadow: {
        neon: "0 0 6px #39FF14, 0 0 14px #39FF14"
      }
    }
  },
  plugins: []
};