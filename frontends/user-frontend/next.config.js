/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_TRANSACTION_API_URL: process.env.NEXT_PUBLIC_TRANSACTION_API_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    NEXT_PUBLIC_IS_CAPTCHA: process.env.NEXT_PUBLIC_IS_CAPTCHA,
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
  },
}

module.exports = nextConfig
