export const tankTypesRu: { [key: string]: string } = {
  'lightTank': 'Лёгкий танк',
  'mediumTank': 'Средний танк',
  'heavyTank': 'Тяжёлый танк',
  'AT-SPG': 'ПТ-САУ',
  'SPG': 'САУ'
};

export function getFlagUrl(nation: string): string {
  const nationToIso: { [key: string]: string } = {
    'usa': 'us',
    'germany': 'de',
    'uk': 'gb',
    'japan': 'jp',
    'china': 'cn',
    'france': 'fr',
    'ussr': 'ru',
    'poland': 'pl',
    'italy': 'it',
    'czechoslovakia': 'cz',
    'sweden': 'se'
  };

  const isoCode = nationToIso[nation] || 'unknown';
  return `https://flagcdn.com/h40/${isoCode}.png`;
}
