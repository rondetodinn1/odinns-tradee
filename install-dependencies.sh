#!/bin/bash

echo "🚀 Установка зависимостей для ODINNS Trading Platform..."

# Основные зависимости Next.js и React
npm install next@latest react@latest react-dom@latest

# TypeScript
npm install -D typescript @types/node @types/react @types/react-dom

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npm install tailwindcss-animate

# shadcn/ui компоненты
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio
npm install @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible
npm install @radix-ui/react-context-menu @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-hover-card @radix-ui/react-label @radix-ui/react-menubar
npm install @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress
npm install @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select
npm install @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-switch
npm install @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-toggle
npm install @radix-ui/react-toggle-group @radix-ui/react-tooltip

# Иконки Lucide React
npm install lucide-react

# Утилиты
npm install class-variance-authority clsx tailwind-merge
npm install date-fns

# Supabase для базы данных
npm install @supabase/supabase-js

# Уведомления
npm install sonner

# Графики и чарты
npm install recharts

# Дополнительные утилиты
npm install embla-carousel-react
npm install vaul
npm install cmdk
npm install input-otp

echo "✅ Все зависимости установлены!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Настройте переменные окружения в .env.local:"
echo "   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
echo ""
echo "2. Запустите проект:"
echo "   npm run dev"
echo ""
echo "3. Выполните SQL скрипты для создания таблиц в Supabase"
echo ""
echo "🎉 ODINNS Trading Platform готов к работе!"
