package config

import "os"

type Config struct {
	Port         string
	MySQLDSN     string
	LLMAPIKey    string
	LLMAPIURL    string
	LLMModel     string
	LLMModelFast string
}

func Load() *Config {
	return &Config{
		Port:         getEnv("PORT", "8080"),
		MySQLDSN:     os.Getenv("MYSQL_DSN"),
		LLMAPIKey:    getEnv("LLM_API_KEY", "sk-ebef646e1c7840c1aebb5dbdd38b7ff4"),
		LLMAPIURL:    getEnv("LLM_API_URL", "https://api.deepseek.com/v1"),
		LLMModel:     getEnv("LLM_MODEL", "deepseek-chat"),
		LLMModelFast: getEnv("LLM_MODEL_FAST", "deepseek-chat"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}