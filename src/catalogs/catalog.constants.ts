export const DEFAULT_CATEGORY_ID = 1;
export const DEFAULT_STORAGE_LOCATION_ID = 1;

export const PRESET_CATEGORIES: { id: number; name: string }[] = [
  { id: DEFAULT_CATEGORY_ID, name: 'Без категории' },
  { id: 2, name: 'Молочные' },
  { id: 3, name: 'Мясо и рыба' },
  { id: 4, name: 'Овощи' },
  { id: 5, name: 'Фрукты' },
  { id: 6, name: 'Выпечка' },
  { id: 7, name: 'Напитки' },
  { id: 8, name: 'Заморозка' },
  { id: 9, name: 'Бакалея' },
  { id: 10, name: 'Другое' },
];

export const PRESET_STORAGE_LOCATIONS: { id: number; name: string }[] = [
  { id: DEFAULT_STORAGE_LOCATION_ID, name: 'Не указано' },
  { id: 2, name: 'Холодильник' },
  { id: 3, name: 'Морозилка' },
  { id: 4, name: 'Кухонный шкаф' },
  { id: 5, name: 'Кладовая' },
  { id: 6, name: 'Другое' },
];
