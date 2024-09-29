// leitor de qr code
const qrcode = require('qrcode-terminal');
const { Client, Buttons, List, MessageMedia } = require('whatsapp-web.js'); // Mudança Buttons
const client = new Client();
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

// Funil

client.on('message', async msg => {
    const chat = await msg.getChat();
    const userId = msg.from;
    const userMessage = msg.body.trim();

    console.log(`Mensagem do usuário: ${userMessage}`);
    console.log(`Estado do usuário: ${userState[userId]?.stage}`);

    if (userMessage.match(/(dia|tarde|noite|oi|Oi|Olá|olá|ola|Ola|Hello|hello|bom dia|Bom dia|Boa tarde|boa tarde|Boa noite|boa noite|Koe|koe|iae|Iae|Fala viado)/i) && msg.from.endsWith('@c.us')) {

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
            console.log(`Usuário ${userId} entrou no estado 'leaderQuestion'`);
            console.log(`Estado do usuário: ${userState[userId]?.stage}`);
        }
    }

    if (userState[userId]?.stage === 'leaderQuestion') {
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

    if(userState[userId].stage ==='getGroupMembers') {
        const groupMembers = userMessage.split(',').map(names => names.trim());

        if(groupMembers.length >= 5 && groupMembers.length <= 10){
            await delay(1000);
            await client.sendMessage(userId, 'Verificando se os alunos estão inscritos em algum grupo...');
            await chat.sendStateTyping();
            await delay(5000);
            await client.sendMessage(userId, 'Sua inscrição foi concluída com sucesso.\nAgora me fale seu professor orientador? Nome completo');
            userState[userId].stage = null;
        } else if(groupMembers.length < 5 || groupMembers.length > 10){
            await chat.sendStateTyping();
            await delay(1000)
            await client.sendMessage(userId, 'Por favor, me informe entre 5 e 10 nomes separados por vírgula.');
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