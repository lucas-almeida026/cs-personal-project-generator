import axios from 'axios'
import env from './env.mjs'

const ollamaClient = axios.create({
	baseURL: 'http://127.0.0.1:8080/ollama',
	timeout: 60000,
	headers: {
		'Content-Type': 'application/json',
	},
})

export const ollamaApi = {
	system: "Você é um assistente de IA ajudando estudantes de ciência da computação a planejar e executar um projeto pessoal significativo para aplicar seus aprendizados por meio da prática.\n\nCom base nas respostas do estudante a um formulário, seu objetivo é:\n1. Entender que tipo de desenvolvimento eles têm interesse (web, mobile ou sistemas),\n2. Identificar seus interesses pessoais e frustrações do dia a dia,\n3. Sugerir uma ideia de projeto personalizada que combine seus interesses e frustrações para maximizar a motivação,\n4. Dividir a ideia escolhida em histórias de usuário e um backlog de tarefas claras e acionáveis.\n\nSua resposta deve seguir uma **formatação estrita** como um arquivo **YAML válido**, estruturado nos seguintes campos:\nproject_title: string\nproject_description: parágrafo curto explicando por que este projeto é adequado\nuser_stories: # lista de strings\n  - \"Como um [tipo de usuário], eu quero [fazer algo] para que [motivo]\" # exemplo de formato de história de usuário\ntasks:\n  - title: título curto da tarefa descrevendo o que precisa ser feito\n    description: 1 explicação do que a tarefa envolve e, potencialmente, suas subtarefas\n    related_topics: # lista de tópicos que o usuário pode pesquisar caso fique travado\n      - tipos de dados # apenas um exemplo\n      - classes em python # apenas um exemplo\nDiretrizes:\n- Evite tom de conversa e saudações pessoais.\n- Não inclua estimativas de duração.\n- Faça tarefas pequenas e incrementais.\n- Prefira um escopo concreto que se encaixe em ~5–10 horas/semana de trabalho.\n- Use uma linguagem amigável para iniciantes e explique claramente cada tarefa.\n- Escolha um projeto que ajude o estudante a aplicar tópicos que provavelmente estão aprendendo no primeiro ou segundo ano de um curso de ciência da computação.\n- Inclua apenas o arquivo YAML em sua resposta.\n- Sempre responda em português brasileiro\n- Não inclua informações pessoais ou confidenciais.\n- Não inclua informações irrelevantes ou não solicitadas.\n- Não inclua informações sobre você mesmo ou sua identidade.\n- Não inclua informações sobre o que você pode fazer ou não fazer.\n- Não inclua informações sobre o que você é ou não é.\n- Não inclua informações sobre o que você pode ou não pode fazer.\n- Não inclua informações sobre o que você pode ou não pode fazer com os dados do usuário.\n- Não inclua informações sobre o que você pode ou não pode fazer com os dados do usuário sem o consentimento deles.",
	async generateSuggestion({ area, topics, problems, dreams, time }) {
		const prompt = `Sou um estudante de ciência da computação, ${this._incorporateArea(area)}. Me interesso naturalmente por ${topics}. No dia a dia enfrento os seguintes problemas ${problems}, seria legal resolver algum deles com uma solução que eu mesmo fiz. Se pudesse fazer algo do zero, gostaria de ${dreams}. Tenho ${this._incorporateTime(time)} horas por semana para me dedicar ao projeto pessoal.`
		const body = {
			model: "llama3.2:3b",
			system: this.system,
			stream: false,
			temperature: 0.7,
			prompt: prompt,
		}
		try {
			const response = await ollamaClient.post('/?path=/api/generate', body)
			const data = response.data
			let modelResponse = data?.response
			if (!modelResponse || typeof modelResponse !== 'string') {
				throw new Error('No response from model')
			}
			console.log(modelResponse)
			if (modelResponse.startsWith('```yaml') || modelResponse.startsWith('```yml')) {
				modelResponse = modelResponse.replaceAll('```yaml', '').replaceAll('```yml', '').replaceAll('```', '')
			}
			if (!modelResponse) {
				throw new Error('Invalid response format')
			}
			const yamlResponse = modelResponse.trim()
			return yamlResponse
		} catch(error) {
			console.error('Error generating suggestion:', error)
			throw new Error('Failed to generate suggestion')
		}
	},
	_incorporateArea(area) {
		switch (area) {
			case 'web':
				return 'quero aprender sobre desenvolvimento web'
			case 'mobile':
				return 'quero aprender sobre desenvolvimento mobile'
			case 'systems':
				return 'quero aprender sobre desenvolvimento de sistemas desktop e scripts de automação'
			default:
				return 'ainda não decidi o que quero aprender'
		}
	},
	_incorporateTime(time) {
		switch (time) {
			case 'lt_2':
				return 'menos de duas'
			case 'bt_2-4':
				return 'entre duas e quatro'
			case 'bt_5-7':
				return 'entre cinco e sete'
			case 'mt_8':
				return 'mais de oito'
			default:
				return 'poucas'
		}
	}
}