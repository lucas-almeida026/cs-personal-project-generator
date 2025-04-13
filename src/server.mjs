import fs from 'node:fs'
import express from 'express'
import { ollamaApi } from './api.mjs'
import env from './env.mjs'
import { parseCustomFormat } from './parser.mjs'

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
	if (!response || typeof response !== 'string') {
		return res.status(500).send({
			error: 'No response from model',
		})
	}
// 	const response = `
// [item-start](project)
// [string](name) AutoPlanilha
// [string](description) uma solução de automação que permita levar foto do papel e preencher planilhas digitais automaticamente, usando tecnologias como OCR (Leitura Óptica) e scripts de automação.
// [list-start](tasks)
// [item-start](task1)
// [string](name) Pesquisa de bibliotecas de OCR
// [string](description) pesquisar e escolher uma biblioteca de OCR adequada para o projeto, como Tesseract ou OpenCV.
// [list-start](related_topics)
// [string] tesseract
// [string] opencv
// [string] python
// [list-end]
// [item-end]
// [item-start](task2)
// [string](name) Desenvolvimento de um script de automação com Python
// [string](description) criar um script que leia a foto do papel e preencha a planilha digital automaticamente, utilizando a biblioteca de OCR escolhida.
// [list-start](related_topics)
// [string] python
// [string] opencv
// [string] pandas
// [list-end]
// [item-end]
// [item-start](task3)
// [string](name) Implementação da interface de usuário
// [string](description) criar uma interface de usuário amigável e intuitiva para que o usuário possa carregar a foto do papel, escolher a planilha digital e executar o script de utomação.
// [list-start](related_topics)
// [string] tkinter ou PyQt para criar a interface
// [list-end]
// [item-end]
// [item-start](task4)
// [string](name) Testes e Debug
// [string](description) realizar testes e debug para garantir que o script de automação funcione corretamente com diferentes tipos de planilhas e imagens.
// [list-start](related_topics)
// [string] testes unitários e integrais
// [list-end]
// [item-end]
// [item-start](task5)
// [string](name) Reforço e otimização do script de automação
// [string](description) reforçar e otimizar o script de automação para que ele seja mais rápido, eficiente e escalável.
// [list-start](related_topics)
// [string] otimização de desempenho
// [string] uso de bibliotecas adicionais
// [list-end]
// [item-end]
// [item-start](task6)
// [string](name) Desenvolvimento de uma aplicação web ou mobile para compartilhar o script de automação
// [string](description) criar uma aplicação web ou mobile que permita aos usuários executar o script de automação e compartilhar suas experiências.
// [list-start](related_topics)
// [string] desenvolvimento web ou móvel com tecnologias como Flask, Django ou React Native
// [list-end]
// [item-end]
// [item-start](task7)
// [string](name) Colaboração e apoio
// [string](description) encontrar recursos de aprendizado, comunidades e mentors para ajudar a melhorar o projeto e compartilhar conhecimentos.
// [list-start](related_topics)
// [string] comunidades de desenvolvimento
// [string] cursos online ou presenciais
// [list-end]
// [item-end]
// [item-start](task8)
// [string](name) Documentação e divulgação do projeto
// [string](description) criar uma documentação clara e concisa sobre o projeto, incluindo como funciona, como instalar e como executar.
// [list-start](related_topics)
// [string] escrita de texto e criação de conteúdo
// [list-end]
// [item-end]
// [item-start](task9)
// [string](name) Revisão e melhoria contínua do projeto
// [string](description) revisar regularmente o projeto para garantir que ele esteja sempre atualizado, melhorando a funcionalidade e a eficiência.
// [list-start](related_topics)
// [string] gestão de vários problemas e erros.
// [list-end]
// [item-end]
// [item-start](task10)
// [string](name) Lançamento do projeto
// [string](description) apresentar o projeto a uma plateia ou público, compartilhando as conquistas e aprendizados alcançados durante o desenvolvimento.
// [list-start](related_topics)
// [string] comunicação eficaz e apresentação de projetos
// [list-end]
// [item-end]
// [list-end]
// [item-end]`
fs.writeFileSync('./response.txt', response, 'utf-8')
	const r = parseCustomFormat(response)
	fs.writeFileSync('./parsed.json', JSON.stringify(r, null, 2), 'utf-8')
	const { name, description, tasks } = r
	// const lines = response.split('\n')
	const html = `<div class="container mx-auto p-4">
	<h1 class="text-2xl font-bold">${name}</h1>
	<h3>${description}</h3>
	<h4 class="text-lg font-semibold">Tasks:</h4>
	<div class="grid grid-cols-1 gap-4">
		${tasks?.map(task => `
			<div class="border border-gray-300 p-4">
				<h5 class="text-lg font-medium">${task?.name}</h5>
				<p>${task?.description}</p>
				<ul class="list-disc ml-5">
					${task?.related_topics?.map(topic => `<li>${topic}</li>`).join('')}
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