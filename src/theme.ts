export const theme = {
  colors: {
    primary: {
      from: "pink-600",
      to: "purple-600",
      hover: {
        from: "pink-700",
        to: "purple-700",
      },
      disabled: {
        from: "pink-400",
        to: "purple-400",
      },
      text: "pink-600",
      ring: "pink-500",
    },
    warning: {
      base: "red-600",
      hover: "red-700",
      ring: "red-500",
    },
    background: {
      main: "gray-50",
      card: "white/80",
      hover: "gray-50/50",
    },
    border: {
      main: "gray-200",
      card: "white/20",
    },
    text: {
      primary: "gray-900",
      secondary: "gray-600",
      muted: "gray-500",
    },
  },
  gradients: {
    primary: "bg-gradient-to-r from-pink-600 to-purple-600",
    hover: "hover:from-pink-700 hover:to-purple-700",
    disabled: "disabled:from-pink-400 disabled:to-purple-400",
    text: "bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent",
  },
  components: {
    input:
      "block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all",
    button: {
      primary:
        "items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all transform hover:scale-[1.02]",
      secondary:
        "items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all transform hover:scale-[1.02]",
      warning:
        "items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all transform hover:scale-[1.02]",
    },
    card: "bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm",
  },
} as const;
