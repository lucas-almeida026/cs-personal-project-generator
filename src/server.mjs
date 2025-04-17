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

server.post('/process', async (req, res) => {
	console.log('[POST] /process')
	const { area, topics, problems, dreams, time } = req.body
	const response = await ollamaApi.projectSuggestor.generate({ area, topics, problems, dreams, time })
	if (!response || typeof response !== 'string') {
		return res.status(500).send({
			error: 'No response from model',
		})
	}
	fs.writeFileSync('./project.txt', response, 'utf-8')
	try {
		let {name, description, epics} = parseCustomFormat(response)
		const cleanEpics = await ollamaApi.epicShrinker.generate(epics ?? [])
		epics = cleanEpics
		fs.writeFileSync('./project.json', JSON.stringify({name, description, epics}, null, 2), 'utf-8')

		console.log({cleanEpics})
		const firstepic = epics?.[0]
		if (!firstepic || !('original' in firstepic) || !('summarized' in firstepic)) {
			throw new Error('No epics found')
		}
		let contextualEpic = firstepic.summarized
		if (contextualEpic !== firstepic.original) {
			contextualEpic += ` (${firstepic.original})`
		}
		const firstEpicTasks = await ollamaApi.taskGenerator.generate({ name, description, epic: contextualEpic })
		fs.writeFileSync('./tasks1.txt', firstEpicTasks, 'utf-8')
		const tasks = parseCustomFormat(firstEpicTasks)
		fs.writeFileSync('./tasks1.json', JSON.stringify(tasks, null, 2), 'utf-8')
	} catch (e) {
		console.error('Error:', e)
	}
	// const html = `<div class="container mx-auto p-4">
	// <h1 class="text-2xl font-bold">${name}</h1>
	// <h3 class="text-slate-700">${description}</h3><br/>
	// <h4 class="text-lg font-bold">Tasks:</h4>
	// <div class="grid grid-cols-1 gap-4">
	// 	${tasks?.map(task => `
	// 		<div class="border border-gray-300 rounded-md p-4">
	// 			<h5 class="text-md font-semibold ">${task?.name}</h5>
	// 			<p class="text-slate-700 text-sm">${task?.description}</p>
	// 			<ul class="list-disc ml-5">
	// 				${task?.related_topics?.map(topic => `<li class="text-slate-700">${topic}</li>`).join('')}
	// 			</ul>
	// 		</div>`).join('')}
	// </div>
	// </div>`
	res.send('<p>ok</p>')
})

server.post('/ollama', async (req, res) => {
	const path = req.query.path || '/';
	const tag = req.query.tag || 'unknown';
	const {system, prompt} = req.body;

	const logEntry = {
		timestamp: new Date(),
		tag: tag,
		request: {
			system,
			prompt
		}
	}
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
		logEntry.response = data?.response;
		res.send(data);
	} catch (error) {
		console.error('Error[OllamaProxy]:', error);
		logEntry.error = error.message;
		res.status(500).send({
			error: 'Failed to connect to OLLAMA API',
			message: error.message,
		});
	} finally {
		const logFilePath = `./llama.log`;
		const logEntryString = `time: ${logEntry.timestamp.toISOString()}
tag: ${logEntry.tag}
request: ${logEntry.request.prompt.replaceAll(/[\r\n]+/g, '//')}
response: ${logEntry.response || 'none'}
error: ${logEntry.error || 'none'}
--------------------\n`;
		fs.appendFile(logFilePath, logEntryString, (err) => {
			if (err) {
				console.error('Error writing to log file:', err);
			}
		});
	}
});

server.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));