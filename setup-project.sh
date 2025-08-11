#!/bin/bash

echo "🚀 Настройка ODINNS Trading Platform..."

# Создаем структуру папок
mkdir -p components/ui
mkdir -p components/dashboard
mkdir -p components/bitcoin
mkdir -p components/activity
mkdir -p lib
mkdir -p app/api
mkdir -p hooks
mkdir -p types
mkdir -p scripts
mkdir -p styles

echo "📁 Структура папок создана"

# Устанавливаем все необходимые зависимости
echo "📦 Установка зависимостей..."

npm install @supabase/supabase-js
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio
npm install @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible
npm install @radix-ui/react-context-menu @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-hover-card @radix-ui/react-label @radix-ui/react-menubar
npm install @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress
npm install @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select
npm install @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-switch
npm install @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-toggle
npm install @radix-ui/react-toggle-group @radix-ui/react-tooltip
npm install lucide-react
npm install class-variance-authority clsx tailwind-merge
npm install date-fns
npm install sonner
npm install recharts
npm install embla-carousel-react
npm install vaul
npm install cmdk
npm install input-otp
npm install tailwindcss-animate

echo "✅ Все зависимости установлены!"

# Создаем файл переменных окружения
cat > .env.local << EOL
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=ODINNS Trading Platform

# API Keys (добавьте свои ключи)
CRYPTOCOMPARE_API_KEY=your_cryptocompare_key
BINANCE_API_KEY=your_binance_key
COINGECKO_API_KEY=your_coingecko_key
EOL

echo "📝 Файл .env.local создан"

echo ""
echo "🎉 ПРОЕКТ ГОТОВ К РАБОТЕ!"
echo ""
echo "📋 СЛЕДУЮЩИЕ ШАГИ:"
echo "1. Настройте Supabase (создайте проект на supabase.com)"
echo "2. Обновите .env.local с вашими ключами"
echo "3. Запустите: npm run dev"
echo "4. Откройте: http://localhost:3000"
