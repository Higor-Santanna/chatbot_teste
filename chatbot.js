// leitor de qr code
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, Buttons} = require('whatsapp-web.js'); // Mudança Buttons
const client = new Client({
    authStrategy: new LocalAuth()
});
// serviço de leitura do qr code
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});
// apos isso ele diz que foi tudo certo
client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
});
// E inicializa tudo 
client.initialize();

const delay = ms => new Promise(res => setTimeout(res, ms)); // Função que usamos para criar o delay entre uma ação e outra

const userState = {}; // Armazenar o estado dos usuários

const leaderGroup = async (leader) => {
    const groupLeader = leader.trim();
    return groupLeader.length > 0 ? groupLeader : null;
};

const emailValidation = async(emailStudent) => {
    const email = emailStudent.trim();
    return email.length > 0 ? email : null;
}

// Função para criar e enviar a enquete
const sendPoll = async (chatId) => {
    const pollMessage = 'Qual sua linguagem de programação favorita?';
    console.log(`Enviando enquete para ${chatId}`);
    // Criação dos botões
    const buttons = new Buttons(
        pollMessage,
        [
            { body: 'JavaScript' },
            { body: 'Python' },
            { body: 'Java' },
            { body: 'C#' }
        ],
        'Enquete',
        'Escolha uma opção'
    );

    // Envia a mensagem com os botões
    await client.sendMessage(chatId, buttons);
    console.log(`Enquete enviada para ${chatId}`);
};

// Armazenar respostas da enquete
const pollResponses = {};

//Manipulador de mensagens
client.on('message', async msg => {
    const chat = await msg.getChat();
    const userId = msg.from;
    const userMessage = msg.body.trim();

    if (!userState[userId]) {
        userState[userId] = { stage: 'initial' }; // Estado inicial
    }

    console.log(`Mensagem do usuário: ${userMessage}`);
    console.log(`Estado do usuário: ${userState[userId]?.stage}`);

    if(userState[userId].stage === 'initial') {
        await delay(3000); //delay de 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(3000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
        const contact = await msg.getContact(); //Pegando o contato
        const name = contact.pushname; //Pegando o nome do contato
        await client.sendMessage(userId, 'Olá! ' + name.split(" ")[0] + 'Sou o Travis assistente virtual da jornada. Como posso ajudá-lo hoje? Por favor, digite uma das opções abaixo:\n\n1 - Inscrição e submissão do resumo\n2 - Enviar ao orientador para correção o resumo expandido ou artigo finalizado\n3 - Submeter o resumo expandido ou artigo finalizado\n4 - Submeter os slides\n5 - Gerar seu QR Code\n6 - Pegar os templates de artigo, slides, resumo simples e expandido');

        userState[userId] = { stage: 'mainMenu' };
        console.log(`Usuário ${userId} entrou no estado 'mainMenu'`);
        console.log(`Estado do usuário: ${userState[userId]?.stage}`);
    }

    if (userState[userId]?.stage === 'mainMenu') {
        if (userMessage !== null && userMessage === '1' && userId.endsWith('@c.us')) {
            await delay(3000); //delay de 3 segundos
            await chat.sendStateTyping(); // Simulando Digitação
            await delay(3000);
            await client.sendMessage(userId, 'Você será o aluno líder?\n\n7 - Sim\n8 - Não');
            userState[userId].stage = 'leaderQuestion';
        }
    }

    else if (userState[userId]?.stage === 'leaderQuestion') {
        if (userMessage !== null && userMessage === '7') {
            await client.sendMessage(userId, 'Opa vamos fazer a inscrição para a jornada!\n Me fale todos os integrantes do seu grupo incluindo o líder?');

            userState[userId].stage = 'getGroupMembers';

        } else if (userMessage !== null && userMessage === '8') {
            await chat.sendStateTyping();
            await delay(3000);
            await client.sendMessage(userId, 'Você não pode fazer a inscrição do grupo, pois você não é o aluno líder')

            userState[userId].stage = null;
            console.log(`Usuário ${userId} concluiu o fluxo de não-líder`);
        }
    }

    else if (userState[userId].stage === 'getGroupMembers') {
        const groupMembers = userMessage.split(',').map(names => names.trim());

        if (groupMembers.length >= 5 && groupMembers.length <= 10) {
            await delay(1000);
            await client.sendMessage(userId, 'Verificando se os alunos estão inscritos em algum grupo...');
            await chat.sendStateTyping();
            await delay(3000);
            await client.sendMessage(userId, 'A inscrição dos integrantes foi concluída com sucesso.\nAgora me fale seu nome completo?');

            userState[userId].stage = 'getGroupLeader';
            console.log(`Estado do usuário: ${userState[userId]?.stage}`);
        } else if (groupMembers.length < 5 || groupMembers.length > 10) {
            await chat.sendStateTyping();
            await delay(1000)
            await client.sendMessage(userId, 'Por favor, me informe entre 5 e 10 nomes separados por vírgula.');
        }
    }

    else if (userState[userId].stage === 'getGroupLeader') {
        const validation = await leaderGroup(userMessage)

        if (validation) {
            await delay(1000);
            await chat.sendStateTyping();
            await client.sendMessage(userId, 'Verificando a matrícula...');
            await delay(3000);
            await chat.sendStateTyping();
            await client.sendMessage(userId, `Você ${validation}, é o aluno líder do grupo e será responsável pela submissão dos demais arquivos da jornada.\nAgora me informe o seu email o mesmo que você usou para fazer a matrícula?`);

            userState[userId].stage = 'getEmail';
            console.log(`Estado atualizado para ${userState[userId].stage}`);
        } else if (validation) {
            await chat.sendStateTyping();
            await delay(1000)
            await client.sendMessage(userId, 'Por favor, me informe o seu nome para prosseguirmos com a inscrição');
        }
    }

    else if (userState[userId].stage === 'getEmail') {
        const validationEmail = await emailValidation(userMessage)

        if (validationEmail) {
            await delay(1000);
            await chat.sendStateTyping();
            await client.sendMessage(userId, 'Verificando se o email é válido...');
            await delay(3000);
            await chat.sendStateTyping();
            await client.sendMessage(userId, `Ok seu email ${validationEmail}, foi cadastrado. \nMe fale quem é o seu professor orientador?`);

            userState[userId].stage = 'getGuidingTeacher';
        } else if (validationEmail) {
            await chat.sendStateTyping();
            await delay(1000)
            await client.sendMessage(userId, 'Por favor, me informe um email válido');
        }
    }

    else if(userState[userId].stage === 'getGuidingTeacher'){
        const teacherLearder = await leaderGroup(userMessage)

        if (teacherLearder) {
            await delay(1000);
            await chat.sendStateTyping();
            await client.sendMessage(userId, 'Verificando se o professor é válido...');
            await delay(3000);
            await chat.sendStateTyping();
            await client.sendMessage(userId, `Ok seu professor orientador é ${teacherLearder}. Diga qual o título do seu artigo?`);

            userState[userId].stage = 'getJobTitle';
        } else if (teacherLearder) {
            await chat.sendStateTyping();
            await delay(1000)
            await client.sendMessage(userId, 'O professor não pode ser orientador do seu grupo.');
        }
    }

    else if(userState[userId].stage === 'getJobTitle'){
        const title = await leaderGroup(userMessage)

        if (title) {
            await delay(1000);
            await chat.sendStateTyping();
            await delay(3000);
            await client.sendMessage(userId, `Certo, o título do seu artigo é ${title}. Agora me fala qual curso você faz?`);

            userState[userId].stage = 'getPollCourse';
            console.log(`Estado do usuário: ${userState[userId]?.stage}`)
        } else if (title) {
            await chat.sendStateTyping();
            await delay(1000)
            await client.sendMessage(userId, 'Insira um título válido');
        }
    }

    else if(userState[userId].stage === 'getPollCourse'){
        await sendPoll(userId);
        userState[userId].stage = 'awaitingPollResponse';
        console.log(`Estado do usuário: ${userState[userId]?.stage}`);
    }

    else if(userState[userId].stage === 'awaitingPollResponse'){
        // Verifica se a mensagem é do tipo resposta de botão
        if (msg.type === 'buttons_response') {
            const userResponse = msg.body;
    
            // Armazena a resposta
            pollResponses[userId] = userResponse;
    
            // Responde ao usuário confirmando a escolha
            await client.sendMessage(userId, `Obrigado por votar! Você escolheu: ${userResponse}`);
            
            // Aqui você pode definir o próximo estado do fluxo, se necessário
            userState[userId].stage = null; // Finaliza o fluxo
        } else {
            // Caso não seja uma resposta de botão, solicita novamente
            await client.sendMessage(userId, 'Por favor, escolha uma das opções usando os botões.');
        }
    }

    if (msg.body !== null && msg.body === '2' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();

        await delay(3000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(3000);
        await client.sendMessage(msg.from, '*Plano Individual:* R$22,50 por mês.\n\n*Plano Família:* R$39,90 por mês, inclui você mais 3 dependentes.\n\n*Plano TOP Individual:* R$42,50 por mês, com benefícios adicionais como\n\n*Plano TOP Família:* R$79,90 por mês, inclui você mais 3 dependentes');

        await delay(3000); //delay de 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(3000);
        await client.sendMessage(msg.from, 'Link para cadastro: https://site.com');
    }

    if (msg.body !== null && msg.body === '3' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();


        await delay(3000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(3000);
        await client.sendMessage(msg.from, 'Sorteio de em prêmios todo ano.\n\nAtendimento médico ilimitado 24h por dia.\n\nReceitas de medicamentos');

        await delay(3000); //delay de 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(3000);
        await client.sendMessage(msg.from, 'Link para cadastro: https://site.com');

    }

    if (msg.body !== null && msg.body === '4' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();

        await delay(3000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(3000);
        await client.sendMessage(msg.from, 'Você pode aderir aos nossos planos diretamente pelo nosso site ou pelo WhatsApp.\n\nApós a adesão, você terá acesso imediato');

        await delay(3000); //delay de 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(3000);
        await client.sendMessage(msg.from, 'Link para cadastro: https://site.com');
    }

    if (msg.body !== null && msg.body === '5' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();

        await delay(3000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(3000);
        await client.sendMessage(msg.from, 'Se você tiver outras dúvidas ou precisar de mais informações, por favor, fale aqui nesse whatsapp ou visite nosso site: https://site.com ');
    }
});