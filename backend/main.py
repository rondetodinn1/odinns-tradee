from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import pandas as pd
import numpy as np
import ta
import os
from typing import Optional, Dict, Any
import asyncio
from datetime import datetime, timedelta
import json

app = FastAPI(title="ODINNS AI Crypto Analysis", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your-gemini-api-key")
COINMARKETCAP_API_KEY = os.getenv("COINMARKETCAP_API_KEY", "your-coinmarketcap-api-key")
BINANCE_API_URL = "https://api.binance.com/api/v3"
COINMARKETCAP_API_URL = "https://pro-api.coinmarketcap.com/v1"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

class AnalysisRequest(BaseModel):
    query: str
    symbol: Optional[str] = "BTC"
    timeframe: Optional[str] = "1h"

class TechnicalData(BaseModel):
    price: float
    change_24h: float
    change_percent_24h: float
    volume_24h: float
    market_cap: float
    rsi: float
    macd: str
    macd_signal: float
    macd_histogram: float
    sma_20: float
    sma_50: float
    ema_12: float
    ema_26: float
    bollinger_upper: float
    bollinger_lower: float
    support_level: float
    resistance_level: float
    fear_greed_index: Optional[int] = None

class AnalysisResponse(BaseModel):
    success: bool
    analysis: str
    recommendation: str
    confidence: int
    risk_level: str
    timeframe: str
    technical_data: TechnicalData
    market_sentiment: str
    key_levels: Dict[str, float]
    timestamp: str

async def get_market_data(symbol: str) -> Dict[str, Any]:
    """Получение рыночных данных с CoinMarketCap"""
    try:
        headers = {
            'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
            'Accept': 'application/json'
        }
        
        async with httpx.AsyncClient() as client:
            # Получаем основные данные
            response = await client.get(
                f"{COINMARKETCAP_API_URL}/cryptocurrency/quotes/latest",
                headers=headers,
                params={'symbol': symbol, 'convert': 'USD'}
            )
            
            if response.status_code == 200:
                data = response.json()
                crypto_data = data['data'][symbol]
                
                return {
                    'price': crypto_data['quote']['USD']['price'],
                    'change_24h': crypto_data['quote']['USD']['percent_change_24h'],
                    'volume_24h': crypto_data['quote']['USD']['volume_24h'],
                    'market_cap': crypto_data['quote']['USD']['market_cap'],
                    'circulating_supply': crypto_data['circulating_supply'],
                    'total_supply': crypto_data['total_supply'],
                    'last_updated': crypto_data['last_updated']
                }
    except Exception as e:
        print(f"Error fetching CoinMarketCap data: {e}")
        # Fallback to Binance
        return await get_binance_data(symbol)

async def get_binance_data(symbol: str) -> Dict[str, Any]:
    """Fallback: получение данных с Binance"""
    try:
        binance_symbol = f"{symbol}USDT"
        
        async with httpx.AsyncClient() as client:
            # 24hr ticker statistics
            ticker_response = await client.get(
                f"{BINANCE_API_URL}/ticker/24hr",
                params={'symbol': binance_symbol}
            )
            
            if ticker_response.status_code == 200:
                ticker_data = ticker_response.json()
                
                return {
                    'price': float(ticker_data['lastPrice']),
                    'change_24h': float(ticker_data['priceChangePercent']),
                    'volume_24h': float(ticker_data['volume']),
                    'market_cap': 0,  # Binance не предоставляет market cap
                    'high_24h': float(ticker_data['highPrice']),
                    'low_24h': float(ticker_data['lowPrice']),
                    'last_updated': datetime.now().isoformat()
                }
    except Exception as e:
        print(f"Error fetching Binance data: {e}")
        return None

async def get_historical_data(symbol: str, interval: str = "1h", limit: int = 200) -> pd.DataFrame:
    """Получение исторических данных для технического анализа"""
    try:
        binance_symbol = f"{symbol}USDT"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BINANCE_API_URL}/klines",
                params={
                    'symbol': binance_symbol,
                    'interval': interval,
                    'limit': limit
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                
                df = pd.DataFrame(data, columns=[
                    'timestamp', 'open', 'high', 'low', 'close', 'volume',
                    'close_time', 'quote_asset_volume', 'number_of_trades',
                    'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore'
                ])
                
                # Конвертируем в нужные типы
                df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
                for col in ['open', 'high', 'low', 'close', 'volume']:
                    df[col] = df[col].astype(float)
                
                return df[['timestamp', 'open', 'high', 'low', 'close', 'volume']]
                
    except Exception as e:
        print(f"Error fetching historical data: {e}")
        return pd.DataFrame()

def calculate_technical_indicators(df: pd.DataFrame) -> Dict[str, float]:
    """Расчет технических индикаторов"""
    if df.empty or len(df) < 50:
        return {}
    
    try:
        # RSI
        rsi = ta.momentum.RSIIndicator(df['close']).rsi().iloc[-1]
        
        # MACD
        macd_indicator = ta.trend.MACD(df['close'])
        macd = macd_indicator.macd().iloc[-1]
        macd_signal = macd_indicator.macd_signal().iloc[-1]
        macd_histogram = macd_indicator.macd_diff().iloc[-1]
        
        # Moving Averages
        sma_20 = ta.trend.SMAIndicator(df['close'], window=20).sma_indicator().iloc[-1]
        sma_50 = ta.trend.SMAIndicator(df['close'], window=50).sma_indicator().iloc[-1]
        ema_12 = ta.trend.EMAIndicator(df['close'], window=12).ema_indicator().iloc[-1]
        ema_26 = ta.trend.EMAIndicator(df['close'], window=26).ema_indicator().iloc[-1]
        
        # Bollinger Bands
        bollinger = ta.volatility.BollingerBands(df['close'])
        bollinger_upper = bollinger.bollinger_hband().iloc[-1]
        bollinger_lower = bollinger.bollinger_lband().iloc[-1]
        
        # Support and Resistance (простой расчет на основе минимумов и максимумов)
        recent_data = df.tail(50)
        support_level = recent_data['low'].min()
        resistance_level = recent_data['high'].max()
        
        return {
            'rsi': rsi,
            'macd': macd,
            'macd_signal': macd_signal,
            'macd_histogram': macd_histogram,
            'sma_20': sma_20,
            'sma_50': sma_50,
            'ema_12': ema_12,
            'ema_26': ema_26,
            'bollinger_upper': bollinger_upper,
            'bollinger_lower': bollinger_lower,
            'support_level': support_level,
            'resistance_level': resistance_level
        }
        
    except Exception as e:
        print(f"Error calculating technical indicators: {e}")
        return {}

async def get_fear_greed_index() -> Optional[int]:
    """Получение индекса страха и жадности"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("https://api.alternative.me/fng/")
            if response.status_code == 200:
                data = response.json()
                return int(data['data'][0]['value'])
    except Exception as e:
        print(f"Error fetching Fear & Greed Index: {e}")
    return None

async def analyze_with_gemini(query: str, market_data: Dict, technical_data: Dict) -> Dict[str, Any]:
    """Анализ с помощью Gemini AI"""
    try:
        # Подготавливаем контекст для AI
        context = f"""
        Пользователь спрашивает: "{query}"
        
        Текущие рыночные данные:
        - Цена: ${market_data.get('price', 0):.2f}
        - Изменение за 24ч: {market_data.get('change_24h', 0):.2f}%
        - Объем торгов: ${market_data.get('volume_24h', 0):,.0f}
        - Рыночная капитализация: ${market_data.get('market_cap', 0):,.0f}
        
        Технические индикаторы:
        - RSI: {technical_data.get('rsi', 0):.1f}
        - MACD: {technical_data.get('macd', 0):.4f}
        - MACD Signal: {technical_data.get('macd_signal', 0):.4f}
        - SMA 20: ${technical_data.get('sma_20', 0):.2f}
        - SMA 50: ${technical_data.get('sma_50', 0):.2f}
        - Поддержка: ${technical_data.get('support_level', 0):.2f}
        - Сопротивление: ${technical_data.get('resistance_level', 0):.2f}
        
        Проанализируй эти данные и дай профессиональный совет. Включи:
        1. Детальный анализ текущей ситуации
        2. Конкретную рекомендацию (покупать/продавать/ждать)
        3. Уровень уверенности в процентах (0-100)
        4. Оценку риска (низкий/средний/высокий)
        5. Временной горизонт для рекомендации
        6. Ключевые уровни для входа/выхода
        
        Отвечай на русском языке, будь конкретным и профессиональным.
        """
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": context
                }]
            }]
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                json=payload,
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result['candidates'][0]['content']['parts'][0]['text']
                
                # Парсим ответ AI для извлечения структурированных данных
                return parse_ai_response(ai_response)
            else:
                print(f"Gemini API error: {response.status_code} - {response.text}")
                return generate_fallback_analysis(market_data, technical_data)
                
    except Exception as e:
        print(f"Error with Gemini AI: {e}")
        return generate_fallback_analysis(market_data, technical_data)

def parse_ai_response(ai_response: str) -> Dict[str, Any]:
    """Парсинг ответа AI для извлечения структурированных данных"""
    try:
        # Простой парсинг ключевых слов (можно улучшить с помощью regex)
        confidence = 75  # По умолчанию
        risk_level = "medium"
        recommendation = "HOLD"
        timeframe = "1-7 дней"
        
        # Ищем уверенность в процентах
        import re
        confidence_match = re.search(r'(\d+)%', ai_response)
        if confidence_match:
            confidence = int(confidence_match.group(1))
        
        # Определяем рекомендацию
        if any(word in ai_response.lower() for word in ['покупать', 'покупка', 'buy', 'покупай']):
            recommendation = "BUY"
        elif any(word in ai_response.lower() for word in ['продавать', 'продажа', 'sell', 'продавай']):
            recommendation = "SELL"
        elif any(word in ai_response.lower() for word in ['ждать', 'наблюдать', 'hold', 'держать']):
            recommendation = "HOLD"
        
        # Определяем уровень риска
        if any(word in ai_response.lower() for word in ['высокий риск', 'рискованно', 'опасно']):
            risk_level = "high"
        elif any(word in ai_response.lower() for word in ['низкий риск', 'безопасно', 'стабильно']):
            risk_level = "low"
        
        return {
            'analysis': ai_response,
            'recommendation': recommendation,
            'confidence': confidence,
            'risk_level': risk_level,
            'timeframe': timeframe
        }
        
    except Exception as e:
        print(f"Error parsing AI response: {e}")
        return {
            'analysis': ai_response,
            'recommendation': "HOLD",
            'confidence': 70,
            'risk_level': "medium",
            'timeframe': "1-7 дней"
        }

def generate_fallback_analysis(market_data: Dict, technical_data: Dict) -> Dict[str, Any]:
    """Fallback анализ если AI недоступен"""
    price = market_data.get('price', 0)
    change_24h = market_data.get('change_24h', 0)
    rsi = technical_data.get('rsi', 50)
    
    # Простая логика для fallback
    if rsi > 70:
        recommendation = "SELL"
        risk_level = "high"
        analysis = f"Технический анализ показывает перекупленность (RSI: {rsi:.1f}). Рекомендуется фиксация прибыли."
    elif rsi < 30:
        recommendation = "BUY"
        risk_level = "medium"
        analysis = f"Технический анализ показывает перепроданность (RSI: {rsi:.1f}). Возможна коррекция вверх."
    else:
        recommendation = "HOLD"
        risk_level = "low" if abs(change_24h) < 2 else "medium"
        analysis = f"Рынок находится в нейтральной зоне. RSI: {rsi:.1f}, изменение за 24ч: {change_24h:.2f}%."
    
    confidence = max(60, min(90, int(80 - abs(change_24h) * 2)))
    
    return {
        'analysis': analysis,
        'recommendation': recommendation,
        'confidence': confidence,
        'risk_level': risk_level,
        'timeframe': "1-3 дня"
    }

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_crypto(request: AnalysisRequest):
    """Основной endpoint для анализа криптовалют"""
    try:
        symbol = request.symbol.upper()
        
        # Получаем рыночные данные
        market_data = await get_market_data(symbol)
        if not market_data:
            raise HTTPException(status_code=400, detail="Unable to fetch market data")
        
        # Получаем исторические данные
        historical_df = await get_historical_data(symbol, request.timeframe)
        
        # Рассчитываем технические индикаторы
        technical_indicators = calculate_technical_indicators(historical_df)
        
        # Получаем индекс страха и жадности
        fear_greed = await get_fear_greed_index()
        
        # Анализируем с помощью AI
        ai_analysis = await analyze_with_gemini(request.query, market_data, technical_indicators)
        
        # Определяем настроение рынка
        market_sentiment = "Neutral"
        if market_data.get('change_24h', 0) > 3:
            market_sentiment = "Bullish"
        elif market_data.get('change_24h', 0) < -3:
            market_sentiment = "Bearish"
        
        # Формируем технические данные
        technical_data = TechnicalData(
            price=market_data.get('price', 0),
            change_24h=market_data.get('change_24h', 0),
            change_percent_24h=market_data.get('change_24h', 0),
            volume_24h=market_data.get('volume_24h', 0),
            market_cap=market_data.get('market_cap', 0),
            rsi=technical_indicators.get('rsi', 50),
            macd="Bullish" if technical_indicators.get('macd_histogram', 0) > 0 else "Bearish",
            macd_signal=technical_indicators.get('macd_signal', 0),
            macd_histogram=technical_indicators.get('macd_histogram', 0),
            sma_20=technical_indicators.get('sma_20', 0),
            sma_50=technical_indicators.get('sma_50', 0),
            ema_12=technical_indicators.get('ema_12', 0),
            ema_26=technical_indicators.get('ema_26', 0),
            bollinger_upper=technical_indicators.get('bollinger_upper', 0),
            bollinger_lower=technical_indicators.get('bollinger_lower', 0),
            support_level=technical_indicators.get('support_level', 0),
            resistance_level=technical_indicators.get('resistance_level', 0),
            fear_greed_index=fear_greed
        )
        
        # Ключевые уровни
        key_levels = {
            "support": technical_indicators.get('support_level', 0),
            "resistance": technical_indicators.get('resistance_level', 0),
            "sma_20": technical_indicators.get('sma_20', 0),
            "sma_50": technical_indicators.get('sma_50', 0)
        }
        
        return AnalysisResponse(
            success=True,
            analysis=ai_analysis['analysis'],
            recommendation=ai_analysis['recommendation'],
            confidence=ai_analysis['confidence'],
            risk_level=ai_analysis['risk_level'],
            timeframe=ai_analysis['timeframe'],
            technical_data=technical_data,
            market_sentiment=market_sentiment,
            key_levels=key_levels,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        print(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/supported-symbols")
async def get_supported_symbols():
    """Получение списка поддерживаемых символов"""
    return {
        "symbols": [
            "BTC", "ETH", "BNB", "ADA", "SOL", "XRP", "DOT", "DOGE", 
            "AVAX", "SHIB", "MATIC", "LTC", "UNI", "LINK", "ATOM"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
