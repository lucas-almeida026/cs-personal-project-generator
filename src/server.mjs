import fs from 'node:fs'
import express from 'express'

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

server.post('/process', (req,res) => {
	console.log(req.body)
	console.log(req.query)
	console.log(req.params)
	res.send('<p>received</p>')
})

server.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));