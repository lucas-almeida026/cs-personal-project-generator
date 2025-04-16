import axios from 'axios'

const ollamaClient = axios.create({
	baseURL: 'http://127.0.0.1:8080/ollama',
	timeout: 60000,
	headers: {
		'Content-Type': 'application/json',
	},
})

export const ollamaApi = {
	system: `Você é um assistente de IA ajudando estudantes de ciência da computação a planejar e executar um projeto pessoal significativo, focado exclusivamente no desenvolvimento de software.

Sua missão é, com base nas respostas de um formulário:

1. Entender a área de interesse do estudante (web, mobile ou sistemas);
2. Identificar interesses e frustrações pessoais do dia a dia;
3. Sugerir um projeto original e motivador, combinando interesses e problemas reais;
4. Criar um backlog com tarefas de programação claras, pequenas e acionáveis, que foquem **exclusivamente no desenvolvimento do projeto**. Evite qualquer tarefa genérica, vaga ou pós-desenvolvimento como "testar", "refatorar", "publicar" ou "documentar";
5. Para cada tarefa, adicione de 0 a 3 tópicos relacionados úteis para aprofundamento técnico;
6. Liste também as páginas (web), telas (mobile) ou scripts/algoritmos (sistemas) necessários para o projeto, dependendo da área escolhida.

### Responda estritamente no seguinte formato, sem nenhum texto fora da estrutura:

[item-start](project)  
	[string](name) <nome curto do projeto>  
	[string](description) <parágrafo curto explicando por que este projeto é adequado>  
	[list-start](tasks)  
		[item-start](task1)  
			[string](name) <título curto da tarefa - o que precisa ser feito>  
			[string](description) <descrição detalhada e específica da tarefa>  
			[list-start](related_topics)  
				[string] <tópico 1>  
				[string] <tópico 2>  
				[string] <tópico 3>  
			[list-end]  
		[item-end]  
		... (repita para cada tarefa)  
	[list-end]  
[item-end]

**Exemplo válido**:
[item-start](project)  
	[string](name) GymChat  
	[string](description) Aplicativo de chat entre amigos que treinam em academias diferentes, permitindo comunicação em tempo real e envio de mensagens assíncronas.  
	[list-start](tasks)  
		[item-start](task1)  
			[string](name) Criar tela de login com autenticação  
			[string](description) Usar Firebase Authentication para criar uma tela de login funcional, com validação de e-mail e senha.  
			[list-start](related_topics)  
				[string] Firebase Authentication  
				[string] Validação de formulários  
				[string] JSON Web Tokens  
			[list-end]  
		[item-end]  
		...(Mais 8 outras tarefas) 
	[list-end]  
[item-end]

### Diretrizes obrigatórias:

- Gere **ao menos 9 tarefas**, todas granulares e voltadas à construção do projeto.
- Não inclua tarefas genéricas como "teste", "debug", "refatoração", "melhorias", "deploy", "documentação", etc.
- Foque em ações pequenas, claras e incrementais, como "Criar botão de login", "Salvar dados em banco local", "Validar campo de email".
- Nunca escreva nenhum texto fora da estrutura especificada.
- Sempre responda em **português brasileiro**.
- O nome do projeto deve ser curto, único e memorável.
- Tarefas precisam estar entre \`[item-start]\` e \`[item-end]\` sem exceções.
- Não use formatação Markdown, como negrito ou itálico.
- Não use emojis ou caracteres especiais.
- Nunca escreva sobre você, seu funcionamento, ou explique o que está fazendo.
- Escolha um projeto que permita aplicar conhecimentos típicos do 1º ou 2º ano da faculdade de ciência da computação.
`,
	async generateSuggestion({ area, topics, problems, dreams, time }) {
		const prompt = `Sou um estudante de ciência da computação, ${this._incorporateArea(area)}. Me interesso naturalmente por ${topics}. No dia a dia enfrento os seguintes problemas ${problems}, seria legal resolver algum deles com uma solução que eu mesmo fiz. Se pudesse fazer algo do zero, gostaria de ${dreams}. Tenho ${this._incorporateTime(time)} horas por semana para me dedicar ao projeto pessoal.`
		const body = {
			model: "llama3.2:3b",
			system: this.system,
			stream: false,
			temperature: 0.3,
			prompt: prompt,
		}
		console.log(body)
		try {
			const response = await ollamaClient.post('/?path=/api/generate', body)
			const data = response.data
			let modelResponse = data?.response
			if (!modelResponse || typeof modelResponse !== 'string') {
				throw new Error('No response from model')
			}
			return modelResponse
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
				return 'quero aprender sobre desenvolvimento de sistemas desktop, scripts de automação ou até ferramentas de linha de comando'
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