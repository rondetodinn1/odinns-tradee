#!/bin/bash

echo "🚀 Установка библиотек для криптоанализа и торговли..."

# Основные библиотеки для криптоанализа
npm install ccxt@latest                    # Криптобиржи API
npm install technicalindicators@latest     # Технические индикаторы
npm install talib@latest                   # TA-Lib для технического анализа
npm install tulind@latest                  # Tulip Indicators
npm install lightweight-charts@latest      # Графики TradingView

# WebSocket для реального времени
npm install ws@latest                      # WebSocket клиент
npm install socket.io-client@latest       # Socket.IO клиент

# Математические библиотеки
npm install ml-matrix@latest               # Матричные вычисления
npm install simple-statistics@latest       # Статистика
npm install d3@latest                      # Визуализация данных

# Дополнительные криптобиблиотеки
npm install crypto-js@latest               # Криптография
npm install bignumber.js@latest            # Точные вычисления
npm install moment@latest                  # Работа с датами
npm install lodash@latest                  # Утилиты

# API клиенты для бирж
npm install binance-api-node@latest        # Binance API
npm install node-binance-api@latest        # Альтернативный Binance API
npm install coinbase-pro@latest            # Coinbase Pro API

# Анализ и прогнозирование
npm install regression@latest              # Регрессионный анализ
npm install ml-regression@latest           # Машинное обучение
npm install brain.js@latest                # Нейронные сети

# Уведомления и алерты
npm install node-telegram-bot-api@latest   # Telegram бот
npm install nodemailer@latest              # Email уведомления

# Дополнительные утилиты
npm install axios@latest                   # HTTP клиент
npm install dotenv@latest                  # Переменные окружения
npm install express@latest                 # Веб-сервер
npm install cors@latest                    # CORS

echo "✅ Все библиотеки установлены!"
echo "📊 Доступные возможности:"
echo "   - Подключение к 100+ криптобиржам"
echo "   - 40+ технических индикаторов"
echo "   - Реальное время через WebSocket"
echo "   - Машинное обучение и прогнозы"
echo "   - Telegram и Email уведомления"
echo "   - Профессиональные графики"
