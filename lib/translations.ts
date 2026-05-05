/**
 * Словарь переводов названий команд и лиг на русский язык
 */

export const translations = {
  // Футбольные лиги
  leagues: {
    'Premier League': 'Премьер-лига',
    'La Liga': 'Ла Лига',
    'Serie A': 'Серия А',
    'Bundesliga': 'Бундеслига',
    'Ligue 1': 'Лига 1',
    'Champions League': 'Лига чемпионов',
    'Europa League': 'Лига Европы',
    'World Cup': 'Чемпионат мира',
    'Euro': 'Чемпионат Европы',
    'Copa America': 'Кубок Америки',
    'FA Cup': 'Кубок Англии',
    'Copa del Rey': 'Кубок Испании',
    'DFB-Pokal': 'Кубок Германии',
    'Coppa Italia': 'Кубок Италии',
    'Coupe de France': 'Кубок Франции',
    'English Premier League': 'Английская Премьер-лига',
    'Spanish La Liga': 'Испанская Ла Лига',
    'Italian Serie A': 'Итальянская Серия А',
    'German Bundesliga': 'Немецкая Бундеслига',
    'French Ligue 1': 'Французская Лига 1',
    'UEFA Champions League': 'Лига чемпионов УЕФА',
    'UEFA Europa League': 'Лига Европы УЕФА',
    'FIFA World Cup': 'Чемпионат мира ФИФА',
    'UEFA European Championship': 'Чемпионат Европы УЕФА',
    'Russian Premier League': 'Российская Премьер-лига',
    'RPL': 'РПЛ',
  },

  // Футбольные команды
  teams: {
    // Английские клубы
    'Manchester United': 'Манчестер Юнайтед',
    'Manchester City': 'Манчестер Сити',
    'Liverpool': 'Ливерпуль',
    'Chelsea': 'Челси',
    'Arsenal': 'Арсенал',
    'Tottenham': 'Тоттенхэм',
    'Tottenham Hotspur': 'Тоттенхэм Хотспур',
    'Leicester City': 'Лестер Сити',
    'West Ham': 'Вест Хэм',
    'West Ham United': 'Вест Хэм Юнайтед',
    'Everton': 'Эвертон',
    'Newcastle': 'Ньюкасл',
    'Newcastle United': 'Ньюкасл Юнайтед',
    'Aston Villa': 'Астон Вилла',
    'Brighton': 'Брайтон',

    // Испанские клубы
    'Real Madrid': 'Реал Мадрид',
    'Barcelona': 'Барселона',
    'Atletico Madrid': 'Атлетико Мадрид',
    'Sevilla': 'Севилья',
    'Valencia': 'Валенсия',
    'Villarreal': 'Вильярреал',
    'Real Sociedad': 'Реал Сосьедад',
    'Athletic Bilbao': 'Атлетик Бильбао',
    'Real Betis': 'Реал Бетис',

    // Итальянские клубы
    'Juventus': 'Ювентус',
    'Inter': 'Интер',
    'Inter Milan': 'Интер Милан',
    'AC Milan': 'Милан',
    'Milan': 'Милан',
    'Napoli': 'Наполи',
    'Roma': 'Рома',
    'AS Roma': 'Рома',
    'Lazio': 'Лацио',
    'Atalanta': 'Аталанта',
    'Fiorentina': 'Фиорентина',

    // Немецкие клубы
    'Bayern Munich': 'Бавария Мюнхен',
    'Bayern': 'Бавария',
    'Borussia Dortmund': 'Боруссия Дортмунд',
    'Dortmund': 'Дортмунд',
    'RB Leipzig': 'РБ Лейпциг',
    'Leipzig': 'Лейпциг',
    'Bayer Leverkusen': 'Байер Леверкузен',
    'Leverkusen': 'Леверкузен',
    'Eintracht Frankfurt': 'Айнтрахт Франкфурт',
    'Frankfurt': 'Франкфурт',
    'Borussia Monchengladbach': 'Боруссия Менхенгладбах',

    // Французские клубы
    'Paris Saint-Germain': 'Пари Сен-Жермен',
    'PSG': 'ПСЖ',
    'Marseille': 'Марсель',
    'Lyon': 'Лион',
    'Monaco': 'Монако',
    'Lille': 'Лилль',
    'Nice': 'Ницца',
    'Rennes': 'Ренн',

    // Российские клубы
    'Zenit': 'Зенит',
    'Spartak Moscow': 'Спартак Москва',
    'CSKA Moscow': 'ЦСКА Москва',
    'Lokomotiv Moscow': 'Локомотив Москва',
    'Dynamo Moscow': 'Динамо Москва',
    'Krasnodar': 'Краснодар',
    'Rostov': 'Ростов',
    'Rubin Kazan': 'Рубин Казань',

    // Сборные
    'England': 'Англия',
    'Spain': 'Испания',
    'Germany': 'Германия',
    'France': 'Франция',
    'Italy': 'Италия',
    'Portugal': 'Португалия',
    'Netherlands': 'Нидерланды',
    'Belgium': 'Бельгия',
    'Brazil': 'Бразилия',
    'Argentina': 'Аргентина',
    'Russia': 'Россия',
    'Croatia': 'Хорватия',
    'Poland': 'Польша',
    'Ukraine': 'Украина',
    'Turkey': 'Турция',
    'Switzerland': 'Швейцария',
    'Austria': 'Австрия',
    'Denmark': 'Дания',
    'Sweden': 'Швеция',
    'Norway': 'Норвегия',
    'Serbia': 'Сербия',
    'Czech Republic': 'Чехия',
    'Slovakia': 'Словакия',
    'Romania': 'Румыния',
    'Greece': 'Греция',
    'Hungary': 'Венгрия',
    'Scotland': 'Шотландия',
    'Wales': 'Уэльс',
    'Ireland': 'Ирландия',
    'Northern Ireland': 'Северная Ирландия',
  },
}

/**
 * Функция для перевода названия команды или лиги
 */
export function translate(text: string, type: 'team' | 'league' = 'team', enabled: boolean = true): string {
  if (!text || !enabled) return text

  const dictionary = type === 'team' ? translations.teams : translations.leagues

  // Точное совпадение
  if (dictionary[text]) {
    return dictionary[text]
  }

  // Поиск частичного совпадения (для случаев типа "FC Barcelona" -> "Барселона")
  for (const [key, value] of Object.entries(dictionary)) {
    if (text.includes(key) || key.includes(text)) {
      return value
    }
  }

  // Если перевод не найден, возвращаем оригинал
  return text
}

/**
 * Функция для перевода названия лиги
 */
export function translateLeague(leagueName: string, enabled: boolean = true): string {
  return translate(leagueName, 'league', enabled)
}

/**
 * Функция для перевода названия команды
 */
export function translateTeam(teamName: string, enabled: boolean = true): string {
  return translate(teamName, 'team', enabled)
}
