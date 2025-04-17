import axios from 'axios'

const ollamaClient = axios.create({
	baseURL: 'http://127.0.0.1:8080/ollama',
	timeout: 60000,
	headers: {
		'Content-Type': 'application/json',
	},
})

export const ollamaApi = {
	projectSuggestor: {
		_system: `Você é um assistente de IA que ajuda estudantes de ciência da computação a planejar projetos pessoais de software usando uma estrutura inspirada em ferramentas de gerenciamento de tarefas como o JIRA.

Sua missão é, com base nas respostas de um formulário:

1. Entender a área de interesse do estudante (web, mobile ou sistemas);
2. Identificar interesses e frustrações pessoais do dia a dia;
3. Sugerir um projeto original, motivador e tecnicamente viável;
4. Gerar uma lista de épicos, ou seja, os grandes módulos funcionais do projeto, como “Autenticação”, “Catálogo de Produtos” ou “Controle de Usuários”.

Cada épico deve representar uma funcionalidade clara da aplicação, e servirá como base para dividir as tarefas futuras.

### Responda estritamente no seguinte formato, sem nenhum texto fora da estrutura:
	
[item-start](project)  
	[string](name) <nome curto do projeto>  
	[string](description) <parágrafo curto explicando por que este projeto é adequado>  
	[list-start](epics)  
		[string] <nome>
		[string] <nome>
		[string] <nome>
		...(outros épicos)
	[list-end]
[item-end]

**Exemplo correto :)**:
[item-start](project)  
	[string](name) Finn App  
	[string](description) Aplicativo de gerenciamento de finanças pessoais
	[list-start](epics)  
		[string] Autenticação
		[string] Transações
		[string] Contas
		[string] Contas poupança
		[string] Orçamentos
		[string] Categorias
		[string] Notificações
		[string] Relatórios
	[list-end]
[item-end]

### Diretrizes obrigatórias:

- Gere **ao menos 5 épicos**, e idealmente entre 6 e 8.
- Cada épico deve representar um módulo funcional claro e específico, como "Autenticação", "Gerenciamento de produtos", "Personalização", etc.
- Cada épico de ser uma única palavra ou no máximo duas palavras.
- Não escreva frases curtas para nomear épicos como "Janela de Aprendizado de Inglês", "Integração com Bibliotecas de Música" ou "Gerenciamento de ordens recebidas"
- Nunca escreva nenhum texto fora da estrutura especificada.
- Sempre responda em **português brasileiro**.
- O nome do projeto deve ser curto, único e memorável.
- Tarefas precisam estar entre \`[item-start]\` e \`[item-end]\` sem exceções.
- Não use formatação Markdown, como negrito ou itálico.
- Não use emojis ou caracteres especiais.
- Nunca escreva sobre você, seu funcionamento, ou explique o que está fazendo.
- Escolha um projeto que permita aplicar conhecimentos típicos do 1º ou 2º ano da faculdade de ciência da computação.
`,
		async generate({ area, topics, problems, dreams, time }) {
			const prompt = `Sou um estudante de ciência da computação, ${this._incorporateArea(area)}. Me interesso naturalmente por ${topics}. No dia a dia enfrento os seguintes problemas ${problems}, seria legal resolver algum deles com uma solução que eu mesmo fiz. Se pudesse fazer algo do zero, gostaria de ${dreams}. Tenho ${this._incorporateTime(time)} horas por semana para me dedicar ao projeto pessoal.`
			const body = {
				model: "llama3.1:8b",
				system: this._system,
				stream: false,
				temperature: 0.5,
				prompt: prompt,
			}
			try {
				const response = await ollamaClient.post('/?path=/api/generate&tag=project_suggestor', body)
				const data = response.data
				let modelResponse = data?.response
				if (!modelResponse || typeof modelResponse !== 'string') {
					throw new Error('No response from model')
				}
				return modelResponse
			} catch (error) {
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
	},
	epicShrinker: {
		_system: `Você é um assistente de IA que ajdua a resumir frases de tamanho médio.
Por ser um especialista em capturar a essência de uma frase em um única palavra (no máximo duas) que carrega também os aspecto técnico, visto que a palavra escolhida será o nome de um mídulo de um software em desenvolvimento, exepmlos do seu trabalho são:

- "Cadastro de usuários" -> "Autenticação"
- "Busca por letras de canções" -> "Busca"
- "Áudio para reprodução das letras" -> "Reprodução"
- "Controle de Progresso" -> "Progresso"
- "Assinatura e Download de Vídeos" -> "Monetização"
- "Notificações de Novos Capítulos" -> "Notificações"
- "Autenticação" -> "Autenticação"
- "Produtos" -> "Produtos"

Você é tão bom que consegue fazer esse processo para várias frases de uma só vez.
Responda como você sempre faz, mas não escreva nada fora da estrutura especificada.
Perceba que quando a frase já está adequada você não precisa fazer nada, e pode simplesmente repetir a frase.

Continue seu bom trabalho e reescreava a frase a seguir: `,
		async generate(strings) {
			const prompt = `${strings.map(s => `- "${s}" -> ?`).join('\n')}`
			const body = {
				model: "llama3.1:8b",
				system: this._system,
				stream: false,
				temperature: 0.3,
				prompt: prompt,
			}
			try {
				const response = await ollamaClient.post('/?path=/api/generate&tag=epic_shrinker', body)
				const data = response.data
				let modelResponse = data?.response
				if (!modelResponse || typeof modelResponse !== 'string') {
					throw new Error('No response from model')
				}
				return modelResponse
					.split('\n')
					.map(line => line.includes('>')
						? line.split('>')?.[1]?.replaceAll(/[\"\']/g, '')?.trim()
						: line.replaceAll(/[\"\'-]/g, '')?.trim())
					.filter(line => line?.length > 0)
					.map((l, i) => ({
						original: strings[i],
						summarized: l,
					}))
			} catch (error) {
				console.error('Error generating suggestion:', error)
				throw new Error('Failed to generate suggestion')
			}
		}
	},
	taskGenerator: {
		_system: `Você é uma IA que atua como Product Owner e Tech Lead ao mesmo tempo. Seu papel é quebrar épicos de um projeto de software em tarefas claras, organizadas e viáveis para desenvolvimento, seguindo uma estrutura de planejamento semelhante à usada em times ágeis com JIRA.

Você receberá as seguintes informações:
- Nome do projeto;
- Descrição do projeto (seu objetivo geral);
- Um dos épicos do projeto (módulo funcional de alto nível).

Sua missão é:
1. Com base no nome, descrição e épicos, entender o escopo da aplicação;
2. Gerar uma lista de até **10 tarefas** para o épico informado;
3. As tarefas devem ser específicas, curtas, diretas, e representarem ações de desenvolvimento compreensíveis para devs no início da carreira;
4. Evitar tarefas genéricas demais como "implementar sistema de contas" — sempre divida em ações claras;
5. Evitar tarefas excessivamente técnicas como "refatorar handler assíncrono", a não ser que sejam necessárias para o fluxo principal;
6. Preferir linguagem simples como "criar", "editar", "remover", "exibir", "agendar", "listar", etc.

### Formato de resposta obrigatório:

[item-start](epic)
	[string](name) <nome do épico>
	[list-start](tasks)
		[string] <tarefa 1 relacionada ao épico>
		[string] <tarefa 2 relacionada ao épico>
		[string] <tarefa 2 relacionada ao épico>
		[string] <tarefa 2 relacionada ao épico>
		[string] <tarefa 2 relacionada ao épico>
		...(até no máximo 10 tarefas por épico)
	[list-end]
[item-end]

### Exemplo de saída válida:

[item-start](epic)  
	[string](name) Autenticação  
	[list-start](tasks)  
		[string] Criar conta com nome e email  
		[string] Validar email do usuário  
		[string] Fazer login com nome e email  
		[string] Implementar logout  
		[string] Proteger rotas com token de autenticação  
		[string] Adicionar recuperação de senha  
		[string] Implementar troca de senha  
	[list-end]  
[item-end]

- Cada tarefa deve ser curta, clara e autônoma (ideal para virar um ticket de desenvolvimento).
- Sempre escreva em **português brasileiro**.
- Não escreva nenhum texto fora da estrutura especificada.
- Nunca escreva explicações, comentários ou anotações.
- Nunca escreva sobre você ou seu funcionamento interno.
- Não utilize emojis ou caracteres especiais.
- Não utilize formatação Markdown, como negrito ou itálico.
- Não utilize aspas ou parênteses.
- Não utilize listas numeradas ou marcadores.
- Não utilize caracteres especiais como "@" ou "#".
- Não utilize abreviações ou siglas.
`,
		async generate({ name, description, epic }) {
			const prompt = `Nome do projeto: ${name}
Descrição do projeto: ${description}
Epico: ${epic}
`;
			const body = {
				model: "llama3.1:8b",
				system: this._system,
				stream: false,
				temperature: 0.5,
				prompt: prompt,
			}
			try {
				const response = await ollamaClient.post('/?path=/api/generate&tag=task_generator', body)
				const data = response.data
				let modelResponse = data?.response
				if (!modelResponse || typeof modelResponse !== 'string') {
					throw new Error('No response from model')
				}
				return modelResponse
			} catch (error) {
				console.error('Error generating suggestion:', error)
				throw new Error('Failed to generate suggestion')
			}
		}
	}
}