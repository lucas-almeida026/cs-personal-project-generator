import fs from 'node:fs'
import express from 'express'
import { ollamaApi } from './api.mjs'
import env from './env.mjs'

const server = express()
const PORT = process.env.PORT ?? 8080

server.use(express.json())
server.use(express.urlencoded({ extended: true }))

server.get('/', (req, res) => {
	const html = fs.readFileSync('./src/templates/index.html', 'utf-8')
	res.send(html)
})

server.get('/info', (_, res) => {
	res.send({
		version: '0.1.0',
	});
})

server.post('/process', async (req,res) => {
	const {  area, problems, dreams, time } = req.body
	const response = await ollamaApi.generateSuggestion({ area, problems, dreams, time })
	res.send(`<p>${response}</p>`)
})

server.post('/ollama', async (req, res) => {
	const path = req.query.path || '/';
	try {
		const response = await fetch(env.OLLAMA_HOST + path, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(req.body),
			timeout: 60000,
		});
		const data = await response.json();
		res.send(data);
	} catch (error) {
		console.error('Error[OllamaProxy]:', error);
		res.status(500).send({
			error: 'Failed to connect to OLLAMA API',
			message: error.message,
		});
	}
});

server.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));