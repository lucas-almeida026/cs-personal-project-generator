import fs from 'node:fs'
import express from 'express'
import { ollamaApi } from './api.mjs'
import env from './env.mjs'
import { parseCustomFormat } from './parser.mjs'

const server = express()
const PORT = process.env.PORT ?? 8080

server.use(express.json())
server.use(express.urlencoded({ extended: true }))
server.use('/assets', express.static('./src/assets'))

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
	const {  area, topics, problems, dreams, time } = req.body
	const response = await ollamaApi.generateSuggestion({ area, topics, problems, dreams, time })
	if (!response || typeof response !== 'string') {
		return res.status(500).send({
			error: 'No response from model',
		})
	}
fs.writeFileSync('./response.txt', response, 'utf-8')
	const r = parseCustomFormat(response)
	fs.writeFileSync('./parsed.json', JSON.stringify(r, null, 2), 'utf-8')
	const { name, description, tasks } = r
	const html = `<div class="container mx-auto p-4">
	<h1 class="text-2xl font-bold">${name}</h1>
	<h3 class="text-slate-700">${description}</h3><br/>
	<h4 class="text-lg font-bold">Tasks:</h4>
	<div class="grid grid-cols-1 gap-4">
		${tasks?.map(task => `
			<div class="border border-gray-300 rounded-md p-4">
				<h5 class="text-md font-semibold ">${task?.name}</h5>
				<p class="text-slate-700 text-sm">${task?.description}</p>
				<ul class="list-disc ml-5">
					${task?.related_topics?.map(topic => `<li class="text-slate-700">${topic}</li>`).join('')}
				</ul>
			</div>`).join('')}
	</div>
	</div>`
	res.send(html)
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