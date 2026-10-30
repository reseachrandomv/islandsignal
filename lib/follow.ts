import { Category, Post } from "./types";
const K = "islandsignal-follows";
export interface Follows { islands: string[]; categories: Category[]; notify: boolean }
export const getFollows = (): Follows => {
  try { return { islands: [], categories: [], notify: false, ...JSON.parse(localStorage.getItem(K) || "{}") }; }
  catch { return { islands: [], categories: [], notify: false }; }
};
export const setFollows = (f: Follows) => localStorage.setItem(K, JSON.stringify(f));
export const matches = (f: Follows, p: Post) =>
  (f.islands.length === 0 || f.islands.includes(p.island_id)) && (f.categories.length === 0 || f.categories.includes(p.category));
