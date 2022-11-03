const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://coddee.dev',
  generateRobotsTxt: true,
  exclude: ['/404', '/500'],
  robotsTxtOptions: {
    policies: [{ userAgent: '*', disallow: ['/404', '/500'] }]
  },
  additionalPaths: async () => {
    const { data, error } = await supabase.from('rooms').select('id')
    if (error) return []
    return data.map((item) => ({
      loc: `/room/${item.id}`,
      changefreq: 'daily',
      priority: 0.7,
      lastmod: new Date().toISOString()
    }))
  }
}
