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
	let { name, description, epics } = parseCustomFormat(response)
	try {
		const cleanEpics = await ollamaApi.epicShrinker.generate(epics ?? [])
		epics = cleanEpics

		for (let i = 0; i < epics.length; i++) {
			const epic = epics[i]
			if (!epic || !('original' in epic) || !('summarized' in epic)) {
				throw new Error('No epics found')
			}

			let contextualEpic = epic.summarized
			if (contextualEpic !== epic.original) {
				contextualEpic += ` (${epic.original})`
			}

			const tasksResponse = await ollamaApi.taskGenerator.generate({ name, description, epic: contextualEpic })
			
			const { tasks } = parseCustomFormat(tasksResponse)
			epic.tasks = tasks
		}

		fs.writeFileSync('./project.json', JSON.stringify({ name, description, epics }, null, 2), 'utf-8')
	} catch (e) {
		console.error('Error:', e)
	}
	const flatTasks = []
	for (const epic of (epics ?? [])) {
		for (const task of epic.tasks) {
			flatTasks.push({
				name: task,
				epic: epic?.summarized
			})
		}
	}
	const html = `<div class="container mx-auto p-4">
	<h1 class="text-2xl font-bold">${name}</h1>
	<h3 class="text-slate-700">${description}</h3><br/>
	<h4 class="text-lg font-bold">Tasks:</h4><br/>
	<div class="grid grid-cols-1 gap-4">
		${flatTasks.map(({ name, epic }) => `
			<div class="max-w-sm min-h-[116px] p-4
				flex flex-col justify-between items-start
				border border-gray-300 rounded-md shadow-md">
				<h5 class="text-md font-semibold line-clamp-2">${name}</h5>
				<span class="inline-block bg-purple-200 text-purple-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">${epic}</span>
			</div>
		`).join('')}
	</div>
</div>`
	// ${tasks?.map(task => `
	// 	<div class="border border-gray-300 rounded-md p-4">
	// 		<h5 class="text-md font-semibold ">${task?.name}</h5>
	// 		<p class="text-slate-700 text-sm">${task?.description}</p>
	// 		<ul class="list-disc ml-5">
	// 			${task?.related_topics?.map(topic => `<li class="text-slate-700">${topic}</li>`).join('')}
	// 		</ul>
	// 	</div>`).join('')}
	// res.send(`
	// 	<div style="max-width: 1080px; margin: 0 auto; padding: 16px; overflow-x: auto;">
	// 		<pre style="white-space: pre-wrap; word-wrap: break-word;">
	// 			<code class="language-json">${JSON.stringify({ name, description, epics }, null, 2)}</code>
	// 		</pre>
	// 	</div>
	// `)
	return res.send(html)
})

server.post('/ollama', async (req, res) => {
	const path = req.query.path || '/';
	const tag = req.query.tag || 'unknown';
	const { system, prompt } = req.body;

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