import * as cheerio from 'cheerio'

export const getText = (value: string) =>
  cheerio.load(value, null, false).text()
