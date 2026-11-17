/** A story split into parts for the picture-book layout: [first sentence, end) for each part, with a picture before each. */
export function partsOf(count: number): [number, number][] {
  const n = count < 6 ? 1 : Math.min(4, Math.ceil(count / 5));
  return Array.from({ length: n }, (_, i) => [Math.round((i * count) / n), Math.round(((i + 1) * count) / n)]);
}

/** Bump to make every picture again, e.g. after changing the prompt or provider order. */
export const PICTURE_VERSION = 1;

export const pictureUrl = (lang: string, id: string, part: number) =>
  `/api/picture?lang=${lang}&id=${encodeURIComponent(id)}&part=${part}&v=${PICTURE_VERSION}`;
