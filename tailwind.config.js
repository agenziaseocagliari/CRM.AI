/** @type {import('tailwindcss').Config} */  
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{html,js,ts,jsx,tsx,mdx}",
    "./public/**/*.html",
  ],
  safelist: [
    // Core layout classes
    'bg-primary', 'bg-sidebar', 'bg-sidebar-hover', 'bg-background', 'bg-card',
    'text-white', 'text-text-primary', 'text-text-secondary',
    'dark:bg-dark-primary', 'dark:bg-dark-sidebar', 'dark:bg-dark-sidebar-hover', 
    'dark:bg-dark-background', 'dark:bg-dark-card', 'dark:text-dark-text-primary', 'dark:text-dark-text-secondary',
    
    // Common utility classes
    'rounded-lg', 'rounded-md', 'rounded-xl', 
    'shadow-md', 'shadow-lg', 'shadow-xl',
    'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-7', 'p-8',
    'px-1', 'px-2', 'px-3', 'px-4', 'px-5', 'px-6', 'px-8',
    'py-1', 'py-2', 'py-3', 'py-4', 'py-5', 'py-6', 'py-8',
    'm-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-8',
    'mx-1', 'mx-2', 'mx-3', 'mx-4', 'mx-5', 'mx-6', 'mx-8', 'mx-auto',
    'my-1', 'my-2', 'my-3', 'my-4', 'my-5', 'my-6', 'my-8',
    'mb-1', 'mb-2', 'mb-3', 'mb-4', 'mb-5', 'mb-6', 'mb-8',
    'mt-1', 'mt-2', 'mt-3', 'mt-4', 'mt-5', 'mt-6', 'mt-8',
    'ml-1', 'ml-2', 'ml-3', 'ml-4', 'ml-5', 'ml-6', 'ml-8',
    'mr-1', 'mr-2', 'mr-3', 'mr-4', 'mr-5', 'mr-6', 'mr-8',
    
    // Flexbox and layout
    'flex', 'flex-col', 'flex-row', 'flex-wrap', 'flex-nowrap',
    'items-start', 'items-center', 'items-end', 'items-stretch',
    'justify-start', 'justify-center', 'justify-end', 'justify-between', 'justify-around', 'justify-evenly',
    'space-x-1', 'space-x-2', 'space-x-3', 'space-x-4', 'space-x-6', 'space-x-8',
    'space-y-1', 'space-y-2', 'space-y-3', 'space-y-4', 'space-y-6', 'space-y-8',
    
    // Typography
    'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl',
    'font-normal', 'font-medium', 'font-semibold', 'font-bold',
    'text-left', 'text-center', 'text-right',
    'leading-tight', 'leading-normal', 'leading-relaxed',
    
    // Common colors
    'text-gray-50', 'text-gray-100', 'text-gray-200', 'text-gray-300', 'text-gray-400', 'text-gray-500', 'text-gray-600', 'text-gray-700', 'text-gray-800', 'text-gray-900',
    'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-gray-300', 'bg-gray-400', 'bg-gray-500', 'bg-gray-600', 'bg-gray-700', 'bg-gray-800', 'bg-gray-900',
    'text-red-500', 'text-red-600', 'text-green-500', 'text-green-600', 'text-blue-500', 'text-blue-600',
    'bg-red-50', 'bg-red-500', 'bg-red-600', 'bg-green-50', 'bg-green-500', 'bg-green-600', 'bg-blue-50', 'bg-blue-500', 'bg-blue-600',
    
    // Borders
    'border', 'border-2', 'border-t', 'border-b', 'border-l', 'border-r',
    'border-gray-200', 'border-gray-300', 'border-gray-400', 'border-gray-500',
    'border-red-300', 'border-green-300', 'border-blue-300',
    
    // Interactive states
    'hover:bg-primary', 'hover:bg-sidebar-hover', 'hover:bg-gray-100', 'hover:bg-gray-200', 'hover:bg-gray-600',
    'hover:text-white', 'hover:text-gray-900',
    'focus:outline-none', 'focus:ring', 'focus:ring-primary', 'focus:border-primary',
    'active:bg-primary',
    'transition-colors', 'transition-all', 'duration-200', 'ease-in-out',
    
    // Sizing
    'w-4', 'w-5', 'w-6', 'w-8', 'w-10', 'w-12', 'w-16', 'w-20', 'w-24', 'w-32', 'w-48', 'w-64', 'w-full', 'w-auto',
    'h-4', 'h-5', 'h-6', 'h-8', 'h-10', 'h-12', 'h-16', 'h-20', 'h-24', 'h-32', 'h-48', 'h-64', 'h-full', 'h-screen',
    'min-h-screen', 'max-w-xs', 'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl', 'max-w-4xl', 'max-w-6xl',
    
    // Positioning
    'relative', 'absolute', 'fixed', 'sticky',
    'top-0', 'right-0', 'bottom-0', 'left-0',
    'z-10', 'z-20', 'z-30', 'z-40', 'z-50',
    
    // Display
    'block', 'inline', 'inline-block', 'hidden',
    'grid', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-6', 'grid-cols-12',
    'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-6', 'gap-8',
    
    // Overflow
    'overflow-hidden', 'overflow-auto', 'overflow-x-auto', 'overflow-y-auto',
    
    // Cursor
    'cursor-pointer', 'cursor-not-allowed',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5', // indigo-600
        sidebar: '#1f2937', // gray-800
        'sidebar-hover': '#374151', // gray-700
        background: '#f3f4f6', // gray-100
        card: '#ffffff', // white
        'text-primary': '#111827', // gray-900
        'text-secondary': '#4b5563', // gray-600
        
        // Dark mode colors
        dark: {
          primary: '#6366f1', // indigo-500
          sidebar: '#111827', // gray-900
          'sidebar-hover': '#1f2937', // gray-800
          background: '#1f2937', // gray-800
          card: '#374151', // gray-700
          'text-primary': '#f9fafb', // gray-50
          'text-secondary': '#d1d5db', // gray-300
        }
      }
    },
  },
  plugins: [],
}