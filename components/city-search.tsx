"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search, MapPin, Star, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface City {
  name: string
  country: string
  country_code: string
  state?: string
  population?: number
  lat?: number
  lng?: number
  is_popular?: boolean
}

interface CitySearchProps {
  onCitySelect: (city: City) => void
  placeholder?: string
  className?: string
  value?: string
}

// РАСШИРЕННАЯ база городов мира с Камянец-Подольским
const CITIES_DATABASE: City[] = [
  // Украина
  { name: "Киев", country: "Украина", country_code: "UA", population: 2884000, is_popular: true },
  { name: "Харьков", country: "Украина", country_code: "UA", population: 1421000, is_popular: true },
  { name: "Одесса", country: "Укра��на", country_code: "UA", population: 1017000, is_popular: true },
  { name: "Днепр", country: "Украина", country_code: "UA", population: 980000, is_popular: true },
  { name: "Львов", country: "Украина", country_code: "UA", population: 717000, is_popular: true },
  { name: "Запорожье", country: "Украина", country_code: "UA", population: 722000 },
  { name: "Кривой Рог", country: "Украина", country_code: "UA", population: 612000 },
  { name: "Николаев", country: "Украина", country_code: "UA", population: 476000 },
  { name: "Мариуполь", country: "Украина", country_code: "UA", population: 431000 },
  { name: "Луганск", country: "Украина", country_code: "UA", population: 399000 },
  { name: "Винница", country: "Украина", country_code: "UA", population: 372000 },
  { name: "Макеевка", country: "Украина", country_code: "UA", population: 340000 },
  { name: "Симферополь", country: "Украина", country_code: "UA", population: 332000 },
  { name: "Херсон", country: "Украина", country_code: "UA", population: 283000 },
  { name: "Полтава", country: "Украина", country_code: "UA", population: 283000 },
  { name: "Чернигов", country: "Украина", country_code: "UA", population: 285000 },
  { name: "Черкассы", country: "Украина", country_code: "UA", population: 272000 },
  { name: "Житомир", country: "Украина", country_code: "UA", population: 263000 },
  { name: "Сумы", country: "Украина", country_code: "UA", population: 259000 },
  { name: "Хмельницкий", country: "Украина", country_code: "UA", population: 253000 },
  { name: "Черновцы", country: "Украина", country_code: "UA", population: 236000 },
  { name: "Горловка", country: "Украина", country_code: "UA", population: 241000 },
  { name: "Ровно", country: "Украина", country_code: "UA", population: 245000 },
  { name: "Каменец-Подольский", country: "Украина", country_code: "UA", population: 99000, lat: 48.6844, lng: 26.5858 },
  { name: "Камянец-Подольский", country: "Украина", country_code: "UA", population: 99000, lat: 48.6844, lng: 26.5858 },
  { name: "Kamenets-Podolsky", country: "Украина", country_code: "UA", population: 99000, lat: 48.6844, lng: 26.5858 },
  { name: "Тернополь", country: "Украина", country_code: "UA", population: 225000 },
  { name: "Ивано-Франковск", country: "Украина", country_code: "UA", population: 218000 },
  { name: "Кременчуг", country: "Украина", country_code: "UA", population: 217000 },
  { name: "Белая Церковь", country: "Украина", country_code: "UA", population: 200000 },
  { name: "Енакиево", country: "Украина", country_code: "UA", population: 177000 },
  { name: "Краматорск", country: "Украина", country_code: "UA", population: 150000 },
  { name: "Мелитополь", country: "Украина", country_code: "UA", population: 150000 },
  { name: "Керчь", country: "Украина", country_code: "UA", population: 147000 },
  { name: "Никополь", country: "Украина", country_code: "UA", population: 107000 },
  { name: "Славянск", country: "Украина", country_code: "UA", population: 106000 },
  { name: "Ужгород", country: "Украина", country_code: "UA", population: 115000 },
  { name: "Бердянск", country: "Украина", country_code: "UA", population: 107000 },
  { name: "Северодонецк", country: "Украина", country_code: "UA", population: 101000 },
  { name: "Павлоград", country: "Украина", country_code: "UA", population: 100000 },
  { name: "Лисичанск", country: "Украина", country_code: "UA", population: 95000 },
  { name: "Каменское", country: "Украина", country_code: "UA", population: 229000 },
  { name: "Александрия", country: "Украина", country_code: "UA", population: 77000 },
  { name: "Конотоп", country: "Украина", country_code: "UA", population: 84000 },
  { name: "Умань", country: "Украина", country_code: "UA", population: 83000 },
  { name: "Мукачево", country: "Украина", country_code: "UA", population: 85000 },
  { name: "Луцк", country: "Украина", country_code: "UA", population: 217000 },
  { name: "Бровары", country: "Украина", country_code: "UA", population: 100000 },
  { name: "Евпатория", country: "Украина", country_code: "UA", population: 106000 },
  { name: "Лозовая", country: "Украина", country_code: "UA", population: 54000 },
  { name: "Дрогобыч", country: "Украина", country_code: "UA", population: 75000 },

  // Россия
  { name: "Москва", country: "Россия", country_code: "RU", population: 12506000, is_popular: true },
  { name: "Санкт-Петербург", country: "Россия", country_code: "RU", population: 5384000, is_popular: true },
  { name: "Новосибирск", country: "Россия", country_code: "RU", population: 1625000, is_popular: true },
  { name: "Екатеринбург", country: "Россия", country_code: "RU", population: 1493000, is_popular: true },
  { name: "Казань", country: "Россия", country_code: "RU", population: 1257000 },
  { name: "Нижний Новгород", country: "Россия", country_code: "RU", population: 1252000 },
  { name: "Челябинск", country: "Россия", country_code: "RU", population: 1196000 },
  { name: "Самара", country: "Россия", country_code: "RU", population: 1156000 },
  { name: "Омск", country: "Россия", country_code: "RU", population: 1154000 },
  { name: "Ростов-на-Дону", country: "Россия", country_code: "RU", population: 1137000 },
  { name: "Уфа", country: "Россия", country_code: "RU", population: 1128000 },
  { name: "Красноярск", country: "Россия", country_code: "RU", population: 1093000 },
  { name: "Воронеж", country: "Россия", country_code: "RU", population: 1058000 },
  { name: "Пермь", country: "Россия", country_code: "RU", population: 1049000 },
  { name: "Волгоград", country: "Россия", country_code: "RU", population: 1008000 },

  // США
  { name: "Нью-Йорк", country: "США", country_code: "US", population: 8336000, is_popular: true },
  { name: "Лос-Анджелес", country: "США", country_code: "US", population: 3979000, is_popular: true },
  { name: "Чикаго", country: "США", country_code: "US", population: 2693000, is_popular: true },
  { name: "Хьюстон", country: "США", country_code: "US", population: 2320000, is_popular: true },
  { name: "Феникс", country: "США", country_code: "US", population: 1680000 },
  { name: "Филадельфия", country: "США", country_code: "US", population: 1584000 },
  { name: "Сан-Антонио", country: "США", country_code: "US", population: 1547000 },
  { name: "Сан-Диего", country: "США", country_code: "US", population: 1423000 },
  { name: "Даллас", country: "США", country_code: "US", population: 1343000 },
  { name: "Сан-Хосе", country: "США", country_code: "US", population: 1021000 },
  { name: "Остин", country: "США", country_code: "US", population: 978000 },
  { name: "Джексонвилл", country: "США", country_code: "US", population: 911000 },
  { name: "Форт-Уэрт", country: "США", country_code: "US", population: 909000 },
  { name: "Колумбус", country: "США", country_code: "US", population: 898000 },
  { name: "Сан-Франциско", country: "США", country_code: "US", population: 881000 },
  { name: "Шарлотт", country: "США", country_code: "US", population: 885000 },
  { name: "Индианаполис", country: "США", country_code: "US", population: 876000 },
  { name: "Сиэтл", country: "США", country_code: "US", population: 753000 },
  { name: "Денвер", country: "США", country_code: "US", population: 715000 },
  { name: "Вашингтон", country: "США", country_code: "US", population: 705000 },
  { name: "Бостон", country: "США", country_code: "US", population: 685000 },
  { name: "Эль-Пасо", country: "США", country_code: "US", population: 681000 },
  { name: "Детройт", country: "США", country_code: "US", population: 670000 },
  { name: "Нашвилл", country: "США", country_code: "US", population: 670000 },
  { name: "Портланд", country: "США", country_code: "US", population: 650000 },
  { name: "Мемфис", country: "США", country_code: "US", population: 651000 },
  { name: "Оклахома-Сити", country: "США", country_code: "US", population: 695000 },
  { name: "Лас-Вегас", country: "США", country_code: "US", population: 651000 },
  { name: "Луисвилл", country: "США", country_code: "US", population: 617000 },
  { name: "Балтимор", country: "США", country_code: "US", population: 593000 },
  { name: "Милуоки", country: "США", country_code: "US", population: 590000 },
  { name: "Альбукерке", country: "США", country_code: "US", population: 560000 },
  { name: "Тусон", country: "США", country_code: "US", population: 548000 },
  { name: "Фресно", country: "США", country_code: "US", population: 542000 },
  { name: "Сакраменто", country: "США", country_code: "US", population: 513000 },
  { name: "Канзас-Сити", country: "США", country_code: "US", population: 495000 },
  { name: "Меса", country: "США", country_code: "US", population: 518000 },
  { name: "Атланта", country: "США", country_code: "US", population: 498000 },
  { name: "Колорадо-Спрингс", country: "США", country_code: "US", population: 478000 },
  { name: "Омаха", country: "США", country_code: "US", population: 478000 },
  { name: "Роли", country: "США", country_code: "US", population: 474000 },
  { name: "Майами", country: "США", country_code: "US", population: 470000 },
  { name: "Лонг-Бич", country: "США", country_code: "US", population: 462000 },
  { name: "Вирджиния-Бич", country: "США", country_code: "US", population: 459000 },
  { name: "Окленд", country: "США", country_code: "US", population: 433000 },
  { name: "Миннеаполис", country: "США", country_code: "US", population: 429000 },
  { name: "Тампа", country: "США", country_code: "US", population: 399000 },
  { name: "Толедо", country: "США", country_code: "US", population: 276000 },
  { name: "Новый Орлеан", country: "США", country_code: "US", population: 390000 },
  { name: "Уичита", country: "США", country_code: "US", population: 389000 },
  { name: "Кливленд", country: "США", country_code: "US", population: 383000 },
  { name: "Арлингтон", country: "США", country_code: "US", population: 398000 },

  // Германия
  { name: "Берлин", country: "Германия", country_code: "DE", population: 3669000, is_popular: true },
  { name: "Гамбург", country: "Германия", country_code: "DE", population: 1899000, is_popular: true },
  { name: "Мюнхен", country: "Германия", country_code: "DE", population: 1488000, is_popular: true },
  { name: "Кёльн", country: "Германия", country_code: "DE", population: 1085000 },
  { name: "Франкфурт-на-Майне", country: "Германия", country_code: "DE", population: 753000 },
  { name: "Штутгарт", country: "Германия", country_code: "DE", population: 630000 },
  { name: "Дюссельдорф", country: "Германия", country_code: "DE", population: 619000 },
  { name: "Лейпциг", country: "Германия", country_code: "DE", population: 593000 },
  { name: "Дортмунд", country: "Германия", country_code: "DE", population: 588000 },
  { name: "Эссен", country: "Германия", country_code: "DE", population: 583000 },
  { name: "Бремен", country: "Германия", country_code: "DE", population: 567000 },
  { name: "Дрезден", country: "Германия", country_code: "DE", population: 554000 },
  { name: "Ганновер", country: "Германия", country_code: "DE", population: 538000 },
  { name: "Нюрнберг", country: "Германия", country_code: "DE", population: 518000 },
  { name: "Дуйсбург", country: "Германия", country_code: "DE", population: 498000 },
  { name: "Бохум", country: "Германия", country_code: "DE", population: 364000 },
  { name: "Вупперталь", country: "Германия", country_code: "DE", population: 354000 },
  { name: "Билефельд", country: "Германия", country_code: "DE", population: 334000 },
  { name: "Бонн", country: "Германия", country_code: "DE", population: 327000 },
  { name: "Мюнстер", country: "Германия", country_code: "DE", population: 315000 },

  // Франция
  { name: "Париж", country: "Франция", country_code: "FR", population: 2161000, is_popular: true },
  { name: "Марсель", country: "Франция", country_code: "FR", population: 870000, is_popular: true },
  { name: "Лион", country: "Франция", country_code: "FR", population: 518000, is_popular: true },
  { name: "Тулуза", country: "Франция", country_code: "FR", population: 479000 },
  { name: "Ницца", country: "Франция", country_code: "FR", population: 342000 },
  { name: "Нант", country: "Франция", country_code: "FR", population: 309000 },
  { name: "Монпелье", country: "Франция", country_code: "FR", population: 285000 },
  { name: "Страсбург", country: "Франция", country_code: "FR", population: 280000 },
  { name: "Бордо", country: "Франция", country_code: "FR", population: 254000 },
  { name: "Лилль", country: "Франция", country_code: "FR", population: 232000 },
  { name: "Ренн", country: "Франция", country_code: "FR", population: 217000 },
  { name: "Реймс", country: "Франция", country_code: "FR", population: 184000 },
  { name: "Сент-Этьен", country: "Франция", country_code: "FR", population: 171000 },
  { name: "Тулон", country: "Франция", country_code: "FR", population: 171000 },
  { name: "Гавр", country: "Франция", country_code: "FR", population: 170000 },
  { name: "Гренобль", country: "Франция", country_code: "FR", population: 158000 },
  { name: "Дижон", country: "Франция", country_code: "FR", population: 156000 },
  { name: "Анже", country: "Франция", country_code: "FR", population: 154000 },
  { name: "Вильёрбан", country: "Фра��ция", country_code: "FR", population: 149000 },
  { name: "Нанси", country: "Франция", country_code: "FR", population: 104000 },

  // Великобритания
  { name: "Лондон", country: "Великобритания", country_code: "GB", population: 9304000, is_popular: true },
  { name: "Бирмингем", country: "Великобритания", country_code: "GB", population: 1141000, is_popular: true },
  { name: "Манчестер", country: "Великобритания", country_code: "GB", population: 547000, is_popular: true },
  { name: "Глазго", country: "Великобритания", country_code: "GB", population: 635000 },
  { name: "Ливерпуль", country: "Великобритания", country_code: "GB", population: 498000 },
  { name: "Лидс", country: "Великобритания", country_code: "GB", population: 789000 },
  { name: "Шеффилд", country: "Великобритания", country_code: "GB", population: 582000 },
  { name: "Эдинбург", country: "Великобритания", country_code: "GB", population: 518000 },
  { name: "Бристоль", country: "Великобритания", country_code: "GB", population: 463000 },
  { name: "Лестер", country: "Великобритания", country_code: "GB", population: 355000 },
  { name: "Ковентри", country: "Великобритания", country_code: "GB", population: 371000 },
  { name: "Кингстон-апон-Халл", country: "Великобритания", country_code: "GB", population: 260000 },
  { name: "Брэдфорд", country: "Великобритания", country_code: "GB", population: 537000 },
  { name: "Кардифф", country: "Великобритания", country_code: "GB", population: 364000 },
  { name: "Белфаст", country: "Великобритания", country_code: "GB", population: 343000 },
  { name: "Сток-он-Трент", country: "Великобритания", country_code: "GB", population: 270000 },
  { name: "Ву��верхэмптон", country: "Великобритания", country_code: "GB", population: 263000 },
  { name: "Плимут", country: "Великобритания", country_code: "GB", population: 262000 },
  { name: "Дерби", country: "Великобритания", country_code: "GB", population: 257000 },
  { name: "Суонси", country: "Великобритания", country_code: "GB", population: 246000 },

  // Италия
  { name: "Рим", country: "Италия", country_code: "IT", population: 2873000, is_popular: true },
  { name: "Милан", country: "Италия", country_code: "IT", population: 1396000, is_popular: true },
  { name: "Неаполь", country: "Италия", country_code: "IT", population: 967000, is_popular: true },
  { name: "Турин", country: "Италия", country_code: "IT", population: 870000 },
  { name: "Палермо", country: "Италия", country_code: "IT", population: 673000 },
  { name: "Генуя", country: "Италия", country_code: "IT", population: 583000 },
  { name: "Болонья", country: "Италия", country_code: "IT", population: 389000 },
  { name: "Флоренция", country: "Италия", country_code: "IT", population: 383000 },
  { name: "Бари", country: "Италия", country_code: "IT", population: 320000 },
  { name: "Катания", country: "Италия", country_code: "IT", population: 311000 },
  { name: "Венеция", country: "Италия", country_code: "IT", population: 261000 },
  { name: "Верона", country: "Италия", country_code: "IT", population: 259000 },
  { name: "Мессина", country: "Италия", country_code: "IT", population: 238000 },
  { name: "Падуя", country: "Италия", country_code: "IT", population: 214000 },
  { name: "Триест", country: "Италия", country_code: "IT", population: 204000 },
  { name: "Таранто", country: "Италия", country_code: "IT", population: 200000 },
  { name: "Брешиа", country: "Италия", country_code: "IT", population: 196000 },
  { name: "Реджо-ди-Калабрия", country: "Италия", country_code: "IT", population: 180000 },
  { name: "Модена", country: "Италия", country_code: "IT", population: 185000 },
  { name: "Прато", country: "Италия", country_code: "IT", population: 195000 },

  // Испания
  { name: "Мадрид", country: "Испания", country_code: "ES", population: 3223000, is_popular: true },
  { name: "Барселона", country: "Испания", country_code: "ES", population: 1620000, is_popular: true },
  { name: "Валенсия", country: "Испания", country_code: "ES", population: 791000, is_popular: true },
  { name: "Севилья", country: "Испания", country_code: "ES", population: 688000 },
  { name: "Сарагоса", country: "Испания", country_code: "ES", population: 675000 },
  { name: "Малага", country: "Испания", country_code: "ES", population: 574000 },
  { name: "Мурсия", country: "Испания", country_code: "ES", population: 453000 },
  { name: "Пальма", country: "Испания", country_code: "ES", population: 416000 },
  { name: "Лас-Пальмас-де-Гран-Канария", country: "Испания", country_code: "ES", population: 379000 },
  { name: "Бильбао", country: "Испания", country_code: "ES", population: 345000 },
  { name: "Аликанте", country: "Испания", country_code: "ES", population: 334000 },
  { name: "Кордова", country: "Испания", country_code: "ES", population: 326000 },
  { name: "Вальядолид", country: "Испания", country_code: "ES", population: 298000 },
  { name: "Виго", country: "Испания", country_code: "ES", population: 295000 },
  { name: "Хихон", country: "Испания", country_code: "ES", population: 271000 },
  { name: "Оспиталет-де-Льобрегат", country: "Испания", country_code: "ES", population: 254000 },
  { name: "Ла-Корунья", country: "Испания", country_code: "ES", population: 246000 },
  { name: "Гранада", country: "Испания", country_code: "ES", population: 232000 },
  { name: "Витория-Гастейс", country: "Испания", country_code: "ES", population: 249000 },
  { name: "Эльче", country: "Испания", country_code: "ES", population: 230000 },

  // Польша
  { name: "Варшава", country: "Польша", country_code: "PL", population: 1790000, is_popular: true },
  { name: "Краков", country: "Польша", country_code: "PL", population: 779000, is_popular: true },
  { name: "Лодзь", country: "Польша", country_code: "PL", population: 679000 },
  { name: "Вроцлав", country: "Польша", country_code: "PL", population: 643000 },
  { name: "Познань", country: "Польша", country_code: "PL", population: 538000 },
  { name: "Гданьск", country: "Польша", country_code: "PL", population: 470000 },
  { name: "Щецин", country: "Польша", country_code: "PL", population: 401000 },
  { name: "Быдгощ", country: "Польша", country_code: "PL", population: 350000 },
  { name: "Люблин", country: "Польша", country_code: "PL", population: 339000 },
  { name: "Катовице", country: "Польша", country_code: "PL", population: 294000 },
  { name: "Белосток", country: "Польша", country_code: "PL", population: 297000 },
  { name: "Гдыня", country: "Польша", country_code: "PL", population: 246000 },
  { name: "Ченстохова", country: "Польша", country_code: "PL", population: 220000 },
  { name: "Радом", country: "Польша", country_code: "PL", population: 213000 },
  { name: "Сосновец", country: "Польша", country_code: "PL", population: 202000 },
  { name: "Торунь", country: "Польша", country_code: "PL", population: 202000 },
  { name: "Кельце", country: "Польша", country_code: "PL", population: 196000 },
  { name: "Гливице", country: "Польша", country_code: "PL", population: 179000 },
  { name: "Забже", country: "Польша", country_code: "PL", population: 173000 },
  { name: "Ольштын", country: "Польша", country_code: "PL", population: 172000 },

  // Канада
  { name: "Торонто", country: "Канада", country_code: "CA", population: 2930000, is_popular: true },
  { name: "Монреаль", country: "Канада", country_code: "CA", population: 1780000, is_popular: true },
  { name: "Ванкувер", country: "Канада", country_code: "CA", population: 675000, is_popular: true },
  { name: "Калгари", country: "Канада", country_code: "CA", population: 1336000 },
  { name: "Эдмонтон", country: "Канада", country_code: "CA", population: 981000 },
  { name: "Оттава", country: "Канада", country_code: "CA", population: 994000 },
  { name: "Виннипег", country: "Канада", country_code: "CA", population: 749000 },
  { name: "Квебек", country: "Канада", country_code: "CA", population: 540000 },
  { name: "Гамильтон", country: "Канада", country_code: "CA", population: 579000 },
  { name: "Китченер", country: "Канада", country_code: "CA", population: 523000 },
  { name: "Лондон", country: "Канада", country_code: "CA", population: 422000 },
  { name: "Виктория", country: "Канада", country_code: "CA", population: 367000 },
  { name: "Галифакс", country: "Канада", country_code: "CA", population: 431000 },
  { name: "Ошава", country: "Канада", country_code: "CA", population: 166000 },
  { name: "Виндзор", country: "Канада", country_code: "CA", population: 217000 },
  { name: "Саскатун", country: "Канада", country_code: "CA", population: 273000 },
  { name: "Реджайна", country: "Канада", country_code: "CA", population: 230000 },
  { name: "Шербрук", country: "Канада", country_code: "CA", population: 161000 },
  { name: "Барри", country: "Канада", country_code: "CA", population: 147000 },
  { name: "Келоуна", country: "Канада", country_code: "CA", population: 132000 },

  // Япония
  { name: "Токио", country: "Япония", country_code: "JP", population: 13960000, is_popular: true },
  { name: "Осака", country: "Япония", country_code: "JP", population: 2691000, is_popular: true },
  { name: "Нагоя", country: "Япония", country_code: "JP", population: 2296000 },
  { name: "Саппоро", country: "Япония", country_code: "JP", population: 1973000 },
  { name: "Фукуока", country: "Япония", country_code: "JP", population: 1581000 },
  { name: "Кобе", country: "Япония", country_code: "JP", population: 1518000 },
  { name: "Киото", country: "Япония", country_code: "JP", population: 1475000 },
  { name: "Кавасаки", country: "Япония", country_code: "JP", population: 1539000 },
  { name: "Сайтама", country: "Япония", country_code: "JP", population: 1324000 },
  { name: "Хиросима", country: "Япония", country_code: "JP", population: 1196000 },
  { name: "Сендай", country: "Япония", country_code: "JP", population: 1096000 },
  { name: "Китакюсю", country: "Япония", country_code: "JP", population: 940000 },
  { name: "Тиба", country: "Япония", country_code: "JP", population: 980000 },
  { name: "Сакаи", country: "Япония", country_code: "JP", population: 828000 },
  { name: "Ниигата", country: "Япония", country_code: "JP", population: 800000 },
  { name: "Хамамацу", country: "Япония", country_code: "JP", population: 797000 },
  { name: "Кумамото", country: "Япония", country_code: "JP", population: 740000 },
  { name: "Сагамихара", country: "Япония", country_code: "JP", population: 723000 },
  { name: "Окаяма", country: "Япония", country_code: "JP", population: 720000 },
  { name: "Хатиодзи", country: "Япония", country_code: "JP", population: 577000 },

  // Китай
  { name: "Шанхай", country: "Китай", country_code: "CN", population: 24870000, is_popular: true },
  { name: "Пекин", country: "Китай", country_code: "CN", population: 21540000, is_popular: true },
  { name: "Чунцин", country: "Китай", country_code: "CN", population: 15872000 },
  { name: "Тяньцзинь", country: "Китай", country_code: "CN", population: 13866000 },
  { name: "Гуанчжоу", country: "Китай", country_code: "CN", population: 13080000 },
  { name: "Шэньчжэнь", country: "Китай", country_code: "CN", population: 12357000 },
  { name: "Ухань", country: "Китай", country_code: "CN", population: 8896000 },
  { name: "Дунгуань", country: "Китай", country_code: "CN", population: 8220000 },
  { name: "Чэнду", country: "Китай", country_code: "CN", population: 8813000 },
  { name: "Нанкин", country: "Китай", country_code: "CN", population: 8245000 },
  { name: "Сиань", country: "Китай", country_code: "CN", population: 8705000 },
  { name: "Шэньян", country: "Китай", country_code: "CN", population: 8294000 },
  { name: "Ханчжоу", country: "Китай", country_code: "CN", population: 8700000 },
  { name: "Фошань", country: "Китай", country_code: "CN", population: 7236000 },
  { name: "Циндао", country: "Китай", country_code: "CN", population: 7379000 },
  { name: "Далянь", country: "Китай", country_code: "CN", population: 5930000 },
  { name: "Чжэнчжоу", country: "Китай", country_code: "CN", population: 7020000 },
  { name: "Цзинань", country: "Китай", country_code: "CN", population: 6814000 },
  { name: "Куньмин", country: "Китай", country_code: "CN", population: 6626000 },
  { name: "Харбин", country: "Китай", country_code: "CN", population: 5878000 },

  // Индия
  { name: "Мумбаи", country: "Индия", country_code: "IN", population: 20411000, is_popular: true },
  { name: "Дели", country: "Индия", country_code: "IN", population: 16787000, is_popular: true },
  { name: "Бангалор", country: "Индия", country_code: "IN", population: 8443000, is_popular: true },
  { name: "Хайдарабад", country: "Индия", country_code: "IN", population: 6809000 },
  { name: "Ахмадабад", country: "Индия", country_code: "IN", population: 5570000 },
  { name: "Ченнаи", country: "Индия", country_code: "IN", population: 4681000 },
  { name: "Колката", country: "Индия", country_code: "IN", population: 4496000 },
  { name: "Сурат", country: "Индия", country_code: "IN", population: 4467000 },
  { name: "Пуна", country: "Индия", country_code: "IN", population: 3124000 },
  { name: "Джайпур", country: "Индия", country_code: "IN", population: 3073000 },
  { name: "Лакхнау", country: "Индия", country_code: "IN", population: 2817000 },
  { name: "Канпур", country: "Индия", country_code: "IN", population: 2767000 },
  { name: "Нагпур", country: "Индия", country_code: "IN", population: 2405000 },
  { name: "Индор", country: "Индия", country_code: "IN", population: 1964000 },
  { name: "Тхане", country: "Индия", country_code: "IN", population: 1841000 },
  { name: "Бхопал", country: "Индия", country_code: "IN", population: 1798000 },
  { name: "Вишакхапатнам", country: "Индия", country_code: "IN", population: 1730000 },
  { name: "Патна", country: "Индия", country_code: "IN", population: 1684000 },
  { name: "Вадодара", country: "Индия", country_code: "IN", population: 1666000 },
  { name: "Газиабад", country: "Индия", country_code: "IN", population: 1636000 },

  // Бразилия
  { name: "Сан-Паулу", country: "Бразилия", country_code: "BR", population: 12325000, is_popular: true },
  { name: "Рио-де-Жанейро", country: "Бразилия", country_code: "BR", population: 6748000, is_popular: true },
  { name: "Бразилиа", country: "Бразилия", country_code: "BR", population: 3055000 },
  { name: "Салвадор", country: "Бразилия", country_code: "BR", population: 2887000 },
  { name: "Форталеза", country: "Бразилия", country_code: "BR", population: 2669000 },
  { name: "Белу-Оризонти", country: "Бразилия", country_code: "BR", population: 2521000 },
  { name: "Манаус", country: "Бразилия", country_code: "BR", population: 2219000 },
  { name: "Куритиба", country: "Бразилия", country_code: "BR", population: 1948000 },
  { name: "Ресифи", country: "Бразилия", country_code: "BR", population: 1653000 },
  { name: "Порту-Алегри", country: "Бразилия", country_code: "BR", population: 1488000 },
  { name: "Белен", country: "Бразилия", country_code: "BR", population: 1499000 },
  { name: "Гояния", country: "Бразилия", country_code: "BR", population: 1536000 },
  { name: "Гуарульюс", country: "Бразилия", country_code: "BR", population: 1392000 },
  { name: "Кампинас", country: "Бразилия", country_code: "BR", population: 1213000 },
  { name: "Сан-Луис", country: "Бразилия", country_code: "BR", population: 1108000 },
  { name: "Сан-Гонсалу", country: "Бразилия", country_code: "BR", population: 1084000 },
  { name: "Масейо", country: "Бразилия", country_code: "BR", population: 1025000 },
  { name: "Дуки-ди-Кашиас", country: "Бразилия", country_code: "BR", population: 924000 },
  { name: "Терезина", country: "Бразилия", country_code: "BR", population: 868000 },
  { name: "Натал", country: "Бразилия", country_code: "BR", population: 890000 },

  // Австралия
  { name: "Сидней", country: "Австралия", country_code: "AU", population: 5312000, is_popular: true },
  { name: "Мельбурн", country: "Австралия", country_code: "AU", population: 5078000, is_popular: true },
  { name: "Брисбен", country: "Австралия", country_code: "AU", population: 2560000 },
  { name: "Перт", country: "Австралия", country_code: "AU", population: 2085000 },
  { name: "Аделаида", country: "Австралия", country_code: "AU", population: 1359000 },
  { name: "Голд-Кост", country: "Австралия", country_code: "AU", population: 679000 },
  { name: "Ньюкасл", country: "Австралия", country_code: "AU", population: 322000 },
  { name: "Канберра", country: "Австралия", country_code: "AU", population: 431000 },
  { name: "Саншайн-Кост", country: "Австралия", country_code: "AU", population: 346000 },
  { name: "Вуллонгонг", country: "Австралия", country_code: "AU", population: 302000 },
  { name: "Хобарт", country: "Австралия", country_code: "AU", population: 238000 },
  { name: "Джилонг", country: "Австралия", country_code: "AU", population: 253000 },
  { name: "Таунсвилл", country: "Австралия", country_code: "AU", population: 180000 },
  { name: "Кэрнс", country: "Австралия", country_code: "AU", population: 153000 },
  { name: "Дарвин", country: "Австралия", country_code: "AU", population: 148000 },
  { name: "Токовумба", country: "Австралия", country_code: "AU", population: 138000 },
  { name: "Баллarat", country: "Австралия", country_code: "AU", population: 109000 },
  { name: "Бендиго", country: "Австралия", country_code: "AU", population: 100000 },
  { name: "Олбери", country: "Австралия", country_code: "AU", population: 53000 },
  { name: "Лонсестон", country: "Австралия", country_code: "AU", population: 87000 },
]

export function CitySearch({ onCitySelect, placeholder = "Поиск города...", className, value }: CitySearchProps) {
  const [query, setQuery] = useState(value || "")
  const [suggestions, setSuggestions] = useState<City[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Поиск в локальной базе
  const searchLocalCities = (searchQuery: string): City[] => {
    if (!searchQuery.trim()) return []

    const normalizedQuery = searchQuery.toLowerCase().trim()

    return CITIES_DATABASE.filter((city) => {
      const cityName = city.name.toLowerCase()
      const countryName = city.country.toLowerCase()

      return (
        cityName.includes(normalizedQuery) ||
        countryName.includes(normalizedQuery) ||
        cityName.startsWith(normalizedQuery) ||
        countryName.startsWith(normalizedQuery)
      )
    })
      .sort((a, b) => {
        // Сначала популярные города
        if (a.is_popular && !b.is_popular) return -1
        if (!a.is_popular && b.is_popular) return 1

        // Потом по населению
        if (a.population && b.population) {
          return b.population - a.population
        }

        // Потом по алфавиту
        return a.name.localeCompare(b.name)
      })
      .slice(0, 10) // Показываем только топ 10
  }

  // Поиск через API как резерв
  const searchAPI = async (searchQuery: string): Promise<City[]> => {
    try {
      const response = await fetch(`/api/google-places?query=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data.success && data.places) {
        return data.places.map((place: any) => ({
          name: place.name,
          country:
            place.country_code === "UA"
              ? "Украина"
              : place.country_code === "RU"
                ? "Россия"
                : place.country_code === "US"
                  ? "США"
                  : place.country_code === "DE"
                    ? "Германия"
                    : place.country_code === "FR"
                      ? "Франция"
                      : place.country_code === "GB"
                        ? "Великобритания"
                        : place.country_code === "IT"
                          ? "Италия"
                          : place.country_code === "ES"
                            ? "Испания"
                            : place.country_code === "PL"
                              ? "Польша"
                              : place.country_code === "CA"
                                ? "Канада"
                                : place.country_code === "JP"
                                  ? "Япония"
                                  : place.country_code === "CN"
                                    ? "Китай"
                                    : place.country_code === "IN"
                                      ? "Индия"
                                      : place.country_code === "BR"
                                        ? "Бразилия"
                                        : place.country_code === "AU"
                                          ? "Австралия"
                                          : "Другая страна",
          country_code: place.country_code,
          state: place.state,
          lat: place.lat,
          lng: place.lng,
        }))
      }
      return []
    } catch (error) {
      console.error("API search error:", error)
      return []
    }
  }

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)

    // Сначала ищем в локальной базе
    const localResults = searchLocalCities(searchQuery)
    setSuggestions(localResults)
    setIsOpen(true)

    // Если локальных результатов мало, дополняем через API
    if (localResults.length < 5) {
      try {
        const apiResults = await searchAPI(searchQuery)
        const combinedResults = [...localResults]

        // Добавляем уникальные результаты из API
        apiResults.forEach((apiCity) => {
          const exists = combinedResults.some(
            (localCity) =>
              localCity.name.toLowerCase() === apiCity.name.toLowerCase() &&
              localCity.country_code === apiCity.country_code,
          )
          if (!exists && combinedResults.length < 10) {
            combinedResults.push(apiCity)
          }
        })

        setSuggestions(combinedResults)
      } catch (error) {
        console.error("Error in API search:", error)
      }
    }

    setIsLoading(false)
    setSelectedIndex(-1)
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleCitySelect = (city: City) => {
    setQuery(`${city.name}, ${city.country}`)
    setIsOpen(false)
    setSuggestions([])
    onCitySelect(city)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleCitySelect(suggestions[selectedIndex])
        }
        break
      case "Escape":
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (
      inputRef.current &&
      !inputRef.current.contains(e.target as Node) &&
      suggestionsRef.current &&
      !suggestionsRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4 z-10" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10 bg-white/10 border-white/20 text-white rounded-xl backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4 animate-spin" />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 z-50 max-h-80 overflow-y-auto"
        >
          {suggestions.map((city, index) => (
            <button
              key={`${city.name}-${city.country_code}-${index}`}
              onClick={() => handleCitySelect(city)}
              className={cn(
                "w-full px-4 py-3 text-left hover:bg-purple-500/20 transition-colors border-b border-white/10 last:border-b-0 flex items-center justify-between",
                selectedIndex === index && "bg-purple-500/20",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  {city.is_popular && <Star className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                </div>
                <div>
                  <div className="text-white font-medium">{city.name}</div>
                  <div className="text-white/60 text-sm">{city.country}</div>
                </div>
              </div>
              {city.population && (
                <div className="text-white/40 text-xs">{(city.population / 1000000).toFixed(1)}M</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
