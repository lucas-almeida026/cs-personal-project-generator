import dotenv from 'dotenv'
dotenv.config()

const required = [
	'OLLAMA_HOST'
]

const missing = required.filter((key) => !process.env[key])
if (missing.length) {
	throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
}

const env = {
	// Server
	PORT: process.env.PORT ?? 8080,

	OLLAMA_HOST: process.env.OLLAMA_HOST
}

export default env