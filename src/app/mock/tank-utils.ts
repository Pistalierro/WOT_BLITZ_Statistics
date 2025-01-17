export function tankTypes(type: string): string {
  const icons: { [key: string]: string } = {
    'lightTank': '/images/tank-types/light-tank.png',
    'mediumTank': '/images/tank-types/medium-tank.png',
    'heavyTank': '/images/tank-types/heavy-tank.png',
    'AT-SPG': '/images/tank-types/at-spg.png',
  };

  return icons[type] || 'unknown';
}

export function getFlagUrl(nation: string): string {
  const flagUrls: { [key: string]: string } = {
    'usa': '/images/flags/usa-large.png',
    'germany': '/images/flags/de-large.png',
    'uk': '/images/flags/gb-large.png',
    'japan': '/images/flags/jp-large.png',
    'china': '/images/flags/ch-large.png',
    'france': '/images/flags/fr-large.png',
    'ussr': '/images/flags/ussr-large.png',
    'poland': '/images/flags/pl-large.png',
    'italy': '/images/flags/it-large.png',
    'czechoslovakia': '/images/flags/cz-large.png',
    'sweden': '/images/flags/sw-large.png',
    'european': '/images/flags/eu-large.png',
    'other': '/images/flags/wg-large.png'
  };

  return flagUrls[nation] || 'unknown';
}

export const COLUMNS_NAMES: string[] = ['mainInfo', 'win_rate', 'battles', 'damage'];

export function toRoman(num: number): string {
  const romanNumerals: { [key: number]: string } = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
    5: 'V',
    6: 'VI',
    7: 'VII',
    8: 'VIII',
    9: 'IX',
    10: 'X',
  };

  return romanNumerals[num] || num.toString(); // Возвращаем римскую цифру или исходное число, если оно больше 10
}

