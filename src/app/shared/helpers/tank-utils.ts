export function tankTypes(type: string, row?: any, shouldColorize: boolean = true): string {
  // console.log('Tank Data', row);
  const basePath = '/images/tank-types/';
  let suffix = '';

  if (shouldColorize && row) {
    if (row.is_collectible) {
      suffix = '-blue.png';
    } else if (row.is_premium) {
      suffix = '-gold.png';
    } else {
      suffix = '.png';
    }
  } else {
    suffix = '.png';
  }

  const icons: { [key: string]: string } = {
    'lightTank': `${basePath}light-tank${suffix}`,
    'mediumTank': `${basePath}medium-tank${suffix}`,
    'heavyTank': `${basePath}heavy-tank${suffix}`,
    'AT-SPG': `${basePath}at-spg${suffix}`,
  };

  return icons[type] || `${basePath}unknown.png`;
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

export const COLUMNS_NAMES: string[] = ['mainInfo', 'battles', 'win_rate', 'damage'];

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

export function getShellType(type: string): string {
  const shellTypes: Record<string, string> = {
    armor_piercing: 'Бронебойный:',
    armor_piercing_cr: 'Подкалиберный:',
    high_explosive: 'Осколочно-фугасный:',
    hollow_charge: 'Кумулятивный:',
    hesh: 'Хэш-фугасный:',
    premium_ap: 'Премиум бронебойный:',
    premium_apcr: 'Премиум подкалиберный:',
    premium_heat: 'Премиум кумулятивный:',
    premium_he: 'Премиум фугасный:',
  };

  const normalizedType = type.toLowerCase(); // Приводим к нижнему регистру

  return shellTypes[normalizedType] || `Неизвестный тип (${type})`;
}



