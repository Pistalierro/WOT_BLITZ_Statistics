export function translateAchievementName(key: string): string {
  const translations: { [key: string]: string } = {
    markOfMastery: 'Знак классности "Мастер"',
    markOfMasteryI: 'Знак классности "1 степень"',
    markOfMasteryII: 'Знак классности "2 степень"',
    markOfMasteryIII: 'Знак классности "3 степень"',
    medalLafayettePool: 'Медаль Пула',
    medalRadleyWalters: 'Медаль Рэдли Уолтерса',
    medalKolobanov: 'Медаль Колобанова',
    medalOskin: 'Медаль Оськина',
    medalLehvaslaiho: 'Медаль Лехвеслайхо',
    warrior: 'Воин',
    mainGun: 'Основной калибр',
    titleSniper: 'Стрелок',
    supporter: 'Поддержка',
    camper: 'Танкист-снайпер',
    heroesOfRassenay: 'Медаль героев Расейняя',
    medalHalonen: 'Медаль Халонена',
    steelwall: 'Стальная стена',
    defender: 'Защитник',
    invader: 'Захватчик',
    invicible: 'Невозмутимый',
    evileye: 'Дозорный',
    medalKnispel: 'Медаль Книспеля I степени',
    diehard: ':Живучий',
    scout: 'Разведчик',
    ironMan: 'Невозмутимый',
    huntsman: 'Егерь',
    medalCrucialContribution: 'Решающий вклад',
    medalBrothersInArms: 'Братья по оружию',
    kamikaze: 'Камикадзе',
    handOfDeath: 'Коса смерти',
    sturdy: 'Спартанец',
    spartan: 'Спартанец',
    mousebane: 'Гроза мышей',
    pattonValley: 'Долина Паттонов',
    beasthunter: 'Зверобой',
    sinai: 'Лев Синая',
    armorPiercer: 'Бронебойщик',
    sharpshooter: 'Стрелок',
    cadet: 'Кадет',
    firstBlood: 'Первая кровь',
    firstVictory: 'Первая победа',
    mechanicEngineer4: 'Инженер-механик: Франция',
    medalKay: 'Медаль Кея I степени',
    medalEkins: 'Медаль Экинса I степени',
    medalCarius: 'Медаль Кариуса II степени',
    jointVictory: 'Совместная победа II степени',
    medalPoppel: 'Медаль Попеля II степени',
    medalAbrams: 'Медаль Абрамса II степени',
    medalLavrinenko: 'Медаль Лавриненко II степени',
    punisher: 'Мститель III степени',
    medalSupremacy: 'Медаль Превосходство III степени',
    medalLeClerc: 'Медаль Леклерка III степени',
    newbieShermanWin: '"Sherman Easy 8": первая победа',
    newbieTigerWin: '"Tiger I": первая победа',
    newbieT3485Win: '"T-34-85": первая победа',
  };

  return translations[key] || `Неизвестная награда (${key})`;
}

export function getAchievementIcon(key: string): string {
  const basePath = '/images/achievements';
  return `${basePath}/${key}.png`;
}

// export function getAchievementIcon(key: string): string {
//   const icons: { [key: string]: string } = {
//     markOfMastery: '/images/achievements/markOfMastery.png'
//   };
//   return icons[key] || 'path_to_icons/default.png';
// }
