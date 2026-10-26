import type { Theme } from '../../types';
import { animals, drinks, foods, fruitsVeggies, movies, objects, professions } from './part1';
import { brands, characters, cities, countries, music, places, series, sports } from './part2';
import { body, celebrations, clothes, heroes, nature, school, sweets, technology, toysGames, vehicles } from './part3';
import { brazil, emotions, famous, fantasy, football, hobbies, rooms, space, tools, videogames } from './part4';

/** Temas que já vêm com o app. */
export const BUILT_IN_THEMES: Theme[] = [
  animals, professions, movies, foods, fruitsVeggies, drinks, objects, places, countries, cities, sports, brands,
  characters, series, music, body, clothes, vehicles, technology, nature, school, celebrations, heroes, toysGames,
  sweets, fantasy, tools, famous, videogames, emotions, hobbies, football, space, brazil, rooms,
];
