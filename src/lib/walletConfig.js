// Configuración centralizada del sistema de wallet
export const WALLET_CONFIG = {
  VIP_PRICE_CREDITS: 50,
  TOKEN_EXPIRY_SECONDS: 60,
  TEST_MODE: false,
  ROULETTE_VERIFY_URL: process.env.REACT_APP_ROULETTE_URL || "https://ruleta-app.com/verify",
};