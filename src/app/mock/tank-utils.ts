export function getVehicleTypeIconUrl(type: string): string {
  const typeToIconUrl: { [key: string]: string } = {
    'lightTank': 'https://glossary-wot.eu/static/1.161.0/images/icons/vehicle-type/lt.svg',
    'mediumTank': 'https://glossary-wot.eu/static/1.161.0/images/icons/vehicle-type/mt.svg',
    'heavyTank': 'https://glossary-wot.eu/static/1.161.0/images/icons/vehicle-type/ht.svg',
    'AT-SPG': 'https://glossary-wot.eu/static/1.161.0/images/icons/vehicle-type/at.svg',
    'SPG': 'https://glossary-wot.eu/static/1.161.0/images/icons/vehicle-type/spg.svg',
  };

  return typeToIconUrl[type] || '';
}


export function getFlagUrl(nation: string): string {
  const flagUrls: { [key: string]: string } = {
    'usa': '/images/flags/usa-middle.png',
    'germany': '/images/flags/de-middle.png',
    'uk': '/images/flags/gb-middle.png',
    'japan': '/images/flags/jp-middle.png',
    'china': '/images/flags/ch-middle.png',
    'france': '/images/flags/fr-middle.png',
    'ussr': '/images/flags/ussr-middle.png',
    'poland': '/images/flags/pl-middle.png',
    'italy': '/images/flags/it-middle.png',
    'czechoslovakia': '/images/flags/cz-middle.png',
    'sweden': '/images/flags/sw-middle.png',
    'european': '/images/flags/eu-middle.png',
    'other': '/images/flags/wg-middle.png'
  };

  return flagUrls[nation] || 'unknown';
}
