// leitor de qr code
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia, Poll, PollVote } = require('whatsapp-web.js'); // Mudança Buttons
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

const simulateTyping = async (chat, delayTime1 = 1000, delayTime2 = 1000) => {
    await delay(delayTime1);
    await chat.sendStateTyping();
    await delay(delayTime2);
};

const handleLeader = async (msg, userMessage, userId, chat, userState, client) => {
    if (msg.type === 'chat') {
        if (userMessage === '7') {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Me fale o seu nome?');
        } else if (userMessage === '8') {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Você não pode fazer a submissão do resumo/artigo ou slide, pois você não é o aluno líder.');

            userState[userId].stage = 'initial';
        }
    } else {
        await simulateTyping(chat);
        await client.sendMessage(userId, 'Por favor, envie uma resposta válida em texto.');
    }
}

const handleLeaderValidation = async (userMessage, userId, chat, client, userState, msg) => {
    if (msg.type === 'chat') {
        const validation = await leaderGroup(userMessage);

        if (validation) {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Verificando se você realmente é líder do grupo...');
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Ok! Você é o líder do grupo. Agora me fale quem é seu professor orientador?');
        } else {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Por favor, me informe o seu nome para prosseguir com a submissão');
        }
    } else {
        await simulateTyping(chat);
        await client.sendMessage(userId, 'Por favor, envie uma resposta válida em texto.');
    }
}

const handleTeacherValidation = async (userMessage, userId, chat, client, userState, msg) => {
    if (msg.type === 'chat') {
        const teacherLearder = await professorLeader(userMessage)

        if (teacherLearder) {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Verificando se o professor é orientador do seu grupo...')
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Certo! Este professor é orientador do seu grupo. Me informe o título do seu trabalho?')
        } else if (teacherLearder) {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Por favor, me informe o nome do professor para prosseguir com a submissão');
        }
    } else {
        await simulateTyping(chat);
        await client.sendMessage(userId, 'Por favor, envie uma resposta válida em texto.');
    }
}

const handleTitleValidation = async (userMessage, userId, chat, client, userState, msg) => {
    if (msg.type === 'chat') {
        const title = await titleTheme(userMessage)

        if (title) {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Verificando se esse título pertence ao seu trabalho...')
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Certo! Este realmente é o título do trabalho.')
            await simulateTyping(chat);
        } else if (title) {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Por favor, me informe o título para prosseguir com a submissão');
        }
    } else {
        await simulateTyping(chat);
        await client.sendMessage(userId, 'Por favor, envie uma resposta válida em texto.');
    }
}

const handleArticleSlide = async (userId, chat, client, userState, msg) => {
    if (msg.hasMedia) {
        const media = await msg.downloadMedia();

        // Verifica se o arquivo é um PDF
        if (media.mimetype === 'application/pdf') {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Recebendo e armazenando seu arquivo em nosso sistema...');
            await simulateTyping(chat);

            userState[userId].stage = 'initial'
        } else {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Por favor, envie apenas arquivos no formato PDF.');
        }
    } else {
        await simulateTyping(chat);
        await client.sendMessage(userId, 'Você precisa enviar um arquivo no formato PDF.');
    }
}

const leaderGroup = async (leader) => {
    const groupLeader = leader.trim();
    return groupLeader.length > 0 ? groupLeader : null;
};

const emailValidation = async (emailStudent) => {
    const email = emailStudent.trim();
    return email.length > 0 ? email : null;
}

const professorLeader = async (leader) => {
    const leaderr = leader.trim();
    return leaderr.length > 0 ? leaderr : null;
};

const titleTheme = async (tit) => {
    const title = tit.trim();
    return title.length > 0 ? title : null;
};

const sendPoll = async (chatId) => {
    const poll = new Poll('Qual período?', ['1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°']);
    await client.sendMessage(chatId, poll);
};

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

    if (userState[userId].stage === 'initial') {
        await simulateTyping(chat)
        const contact = await msg.getContact(); //Pegando o contato
        const name = contact.pushname; //Pegando o nome do contato
        await client.sendMessage(userId, 'Olá! ' + name.split(" ")[0] + 'Sou o Travis assistente virtual da jornada. Como posso ajudá-lo hoje? Por favor, digite uma das opções abaixo:\n\n1 - Inscrição e submissão do resumo\n2 - Enviar ao orientador para correção o resumo expandido ou artigo finalizado\n3 - Submeter o resumo expandido ou artigo finalizado\n4 - Submeter os slides\n5 - Gerar seu QR Code\n6 - Pegar os templates de artigo, slides, resumo simples e expandido');

        userState[userId] = { stage: 'mainMenu' };
    }

    if (userState[userId]?.stage === 'mainMenu') {
        if (userMessage !== null && userMessage === '1' && userId.endsWith('@c.us')) {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Você será o aluno líder?\n\n7 - Sim\n8 - Não');
            userState[userId].stage = 'leaderQuestion';
        }
    }

    else if (userState[userId]?.stage === 'leaderQuestion') {
        await handleLeader(msg, userMessage, userId, chat, userState, client)
        userState[userId].stage = 'getGroupLeader'
    }

    else if (userState[userId].stage === 'getGroupLeader') {
        const validation = await leaderGroup(userMessage)

        if (validation) {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Verificando a matrícula...');
            await simulateTyping(chat)
            await client.sendMessage(userId, `Você ${validation}, é o aluno líder do grupo e será responsável pela submissão dos demais arquivos da jornada.\nAgora me informe o seu email o mesmo que você usou para fazer a matrícula?`);

            userState[userId].stage = 'getEmail';
            console.log(`Estado atualizado para ${userState[userId].stage}`);
        } else if (validation) {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Por favor, me informe o seu nome para prosseguir com a inscrição');
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
            await client.sendMessage(userId, `Ok seu email ${validationEmail}, foi cadastrado. \nMe fale todos os integrantes do grupo incluindo o líder. Coloque o nome completo de cada integrante.`);

            userState[userId].stage = 'getGroupMembers';
        } else if (validationEmail) {
            await chat.sendStateTyping();
            await delay(1000)
            await client.sendMessage(userId, 'Por favor, me informe um email válido');
        }
    }

    else if (userState[userId].stage === 'getGroupMembers') {
        const groupMembers = userMessage.split(',').map(names => names.trim());

        if (groupMembers.length >= 5 && groupMembers.length <= 10) {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Verificando se os alunos estão inscritos em algum grupo...');
            await simulateTyping(chat)
            await client.sendMessage(userId, 'A inscrição dos integrantes foi concluída com sucesso.\nOk! Me fale quem é seu professor orientador?');

            userState[userId].stage = 'getGuidingTeacher';
            console.log(`Estado do usuário: ${userState[userId]?.stage}`);
        } else if (groupMembers.length < 5 || groupMembers.length > 10) {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Por favor, me informe entre 5 e 10 nomes separados por vírgula.');
        }
    }

    else if (userState[userId].stage === 'getGuidingTeacher') {
        const teacherLearder = await professorLeader(userMessage)

        if (teacherLearder) {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Verificando se o professor é válido...');
            await simulateTyping(chat)
            await client.sendMessage(userId, `Ok seu professor orientador é ${teacherLearder}. Diga qual o título do seu artigo?`);

            userState[userId].stage = 'getJobTitle';
        } else if (teacherLearder) {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'O professor não pode ser orientador do seu grupo.');
        }
    }

    else if (userState[userId].stage === 'getJobTitle') {
        const title = await titleTheme(userMessage)

        if (title) {
            await simulateTyping(chat)
            await client.sendMessage(userId, `Certo, o título do seu artigo é ${title}.`);
            await simulateTyping(chat)
            await client.sendMessage(userId, `Qual seu curso de graduação?\n\n10 - Administração\n11 - Análise e Desenvolvimento de Sistemas\n12- Agronomia\n13 - Arquitetura e Urbanismo\n14 - Ciências Contábeis\n15 - Comunicação Social\n16 - Direito - Matutino\n17 - Direito - Noturno\n18 - Educação Física - Bacharelado\n19 - Educação Física - Licenciatura\n20 - Enfermagem\n21 - Engenharia de Produção\n22 - Engenharia Mecânica\n23 - Farmácia\n24 - Fisioterapia\n25 - Medicina Veterinária\n26 - Odontologia\n27 - Pedagogia\n28 - Psicologia`);

            userState[userId].stage = 'getCourse';
            console.log(`Estado do usuário: ${userState[userId]?.stage}`)
        } else if (title) {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Insira um título válido');
        }
    }

    else if (userState[userId].stage === 'getCourse') {
        const courses = {
            '10': 'Administração',
            '11': 'Análise e Desenvolvimento de Sistemas',
            '12': 'Agronomia',
            '13': 'Arquitetura e Urbanismo',
            '14': 'Ciências Contábeis',
            '15': 'Comunicação Social',
            '16': 'Direito - Matutino',
            '17': 'Direito - Noturno',
            '18': 'Educação Física - Bacharelado',
            '19': 'Educação Física - Licenciatura',
            '20': 'Enfermagem',
            '21': 'Engenharia de Produção',
            '22': 'Engenharia Mecânica',
            '23': 'Farmácia',
            '24': 'Fisioterapia',
            '25': 'Medicina Veterinária',
            '26': 'Odontologia',
            '27': 'Pedagogia',
            '28': 'Psicologia'
        };

        if (userMessage !== null && courses[userMessage]) {
            await simulateTyping(chat)
            await client.sendMessage(userId, `Ok, você selecionou o curso: ${courses[userMessage]}`);
            await simulateTyping(chat)

            await sendPoll(userId)
            userState[userId].stage = 'getSendPoll';
            console.log(`Estado do usuário: ${userState[userId]?.stage}`)
        } else {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Por favor, escolha uma das opções.');
        }
    }

    else if (userState[userId].stage === 'getSendPoll') {
        if (msg.type === 'poll_response') {
            const pollVote = new PollVote(msg.poll);
            const selectedOption = pollVote.selectedOptions[0]; // Captura a opção selecionada
            pollResponses[userId] = selectedOption; // Armazena a resposta

            console.log(`Usuário ${userId} votou: ${selectedOption}`);

            await client.sendMessage(userId, `Obrigado! Você escolheu o período: ${selectedOption}.`);
            await delay(1000);
            await chat.sendStateTyping();
            await delay(1000);

            await client.sendMessage(userId, `Qual  o tema do seu trabalho? \n\n30 - Análise Contratual Automatizada\n31 - Análise de Dados Empresariais\n32- Análise de Sentimento em Mídias Sociais\n33 - Análise de Sentimentos em Processos\n34 - Análise Preditiva (antecipação)\n35 - Apoio à Decisão Clínica\n36 - Aprendizado de Máquina em Finanças\n37 - Aprendizado de Máquina para Otimização\n38 - Arte Generativa\n39 - Assistentes Virtuais em Saúde\n40 - Automação de Processos de Negócios\n41 - Automatização de Documentação Legal\n42 - Automatização de Processos\n43 - Avaliação de Riscos Jurídicos\n44 - Chatbots e Assistência Virtual\n45 - Chatbots Jurídicos\n46 - Cibersegurança\n47 - Descoberta de Medicamentos\n48 - Ensino Assistido por Computador\n49 - Ética em Inteligência Artificial\n50 - Gestão de Dados de Saúde\n51 - Gestão de Riscos\n52 - Impacto da IA na Educação\n53 - Manufatura Inteligente\n54 - Otimização de Recursos Hospitalares\n55 - Pesquisa Jurídica\n56 - Prevenção e Monitoramento de Doenças\n57 - Previsão de Resultados Judiciais\n58 - Realidade Aumentada e Virtual\n59 - Robótica e Controle Autônomo\n60 - Segurança Cibernética Jurídica`);

            userState[userId].stage = 'getThemeOfWork';
            console.log(`Estado atualizado para: ${userState[userId]?.stage}`);
        } else {
            await client.sendMessage(userId, 'Por favor, escolha uma das opções da enquete.');
        }
    }

    else if (userState[userId].stage === 'getThemeOfWork') {
        const themeWork = {
            '30': 'Análise Contratual Automatizada',
            '31': 'Análise de Dados Empresariais',
            '32': 'Análise de Sentimento em Mídias Sociais',
            '33': 'Análise de Sentimentos em Processos',
            '34': 'Análise Preditiva (antecipação)',
            '35': 'Apoio à Decisão Clínica',
            '36': 'Aprendizado de Máquina em Finanças',
            '37': 'Aprendizado de Máquina para Otimização',
            '38': 'Arte Generativa',
            '39': 'Assistentes Virtuais em Saúde',
            '40': 'Automação de Processos de Negócios',
            '41': 'Automatização de Documentação Legal',
            '42': 'Automatização de Processos',
            '43': 'Avaliação de Riscos Jurídicos',
            '44': 'Chatbots e Assistência Virtual',
            '45': 'Chatbots Jurídicos',
            '46': 'Cibersegurança',
            '47': 'Descoberta de Medicamentos',
            '48': 'Ensino Assistido por Computador',
            '49': 'Ética em Inteligência Artificial',
            '50': 'Gestão de Dados de Saúde',
            '51': 'Gestão de Riscos',
            '52': 'Impacto da IA na Educação',
            '53': 'Manufatura Inteligente',
            '54': 'Otimização de Recursos Hospitalares',
            '55': 'Pesquisa Jurídica',
            '56': 'Prevenção e Monitoramento de Doenças',
            '57': 'Previsão de Resultados Judiciais',
            '58': 'Realidade Aumentada e Virtual',
            '59': 'Robótica e Controle Autônomo',
            '60': 'Segurança Cibernética Jurídica'
        };

        if (userMessage !== null && themeWork[userMessage]) {
            await delay(1000);
            await chat.sendStateTyping();
            await delay(1000);
            await client.sendMessage(userId, `Ok, você selecionou o curso: ${themeWork[userMessage]}`);

            userState[userId].stage = null;
        } else {
            await client.sendMessage(userId, 'Por favor, escolha uma das opções.');
        }
    }

    if (userState[userId]?.stage === 'mainMenu') {
        if (userMessage !== null && userMessage === '2' && userId.endsWith('@c.us')) {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Você é o aluno líder?\n\n7 - Sim\n8 - Não');
            userState[userId].stage = 'leadeQuestion';
        }
    }

    else if (userState[userId]?.stage === 'leadeQuestion') {
        await handleLeader(msg, userMessage, userId, chat, userState, client)
        userState[userId].stage = 'getNameLeader'
    }

    else if (userState[userId]?.stage === 'getNameLeader') {
        await handleLeaderValidation(userMessage, userId, chat, client, userState, msg);
        userState[userId].stage = 'getTeacher';
    }

    else if (userState[userId]?.stage === 'getTeacher') {
        await handleTeacherValidation(userMessage, userId, chat, client, userState, msg);
        userState[userId].stage = 'getTitle';
    }

    else if (userState[userId]?.stage === 'getTitle') {
        await handleTitleValidation(userMessage, userId, chat, client, userState, msg);
        await client.sendMessage(userId, 'Agora vamos submeter seu resumo expandido/artigo finalizado e enviar o mesmo ao orientador para correção.');
        userState[userId].stage = 'getArticleAndSlide';
    }

    else if (userState[userId]?.stage === 'getArticleAndSlide') {
        const contact = await msg.getContact();
        const name = contact.pushname;
        await handleArticleSlide(userId, chat, client, userState, msg)
        await client.sendMessage(userId, 'Seu artigo finalizado/resumo expandido foi submetido para a correção do orientador.');
        await simulateTyping(chat);
        await client.sendMessage(userId, `Parabéns ${name} por concluir esta etapa dentro do prazo. Fique atento a novas etapas da Jornada de Inovação.`);
    }

    if (userState[userId]?.stage === 'mainMenu') {
        if (userMessage !== null && userMessage === '3' && userId.endsWith('@c.us')) {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Você será o aluno líder?\n\n63 - Sim\n64 - Não');
            userState[userId].stage = 'leaderQuestion';
        }
    }

    else if (userState[userId]?.stage === 'leaderQuestion') {
        if (userMessage !== null && userMessage === '63') {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Me fale o seu nome?');

            userState[userId].stage = 'getNameLeade';
        } else if (userMessage !== null && userMessage === '64') {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Você não pode fazer a submissão do resumo/artigo, pois você não é o aluno líder')

            userState[userId].stage = 'initial';
        } else {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Por favor, selecione uma das opções.')
        }
    }

    else if (userState[userId]?.stage === 'getNameLeade') {
        await handleLeaderValidation(userMessage, userId, chat, client, userState);
        userState[userId].stage = 'getProf';
    }

    else if (userState[userId]?.stage === 'getProf') {
        await handleTeacherValidation(userMessage, userId, chat, client, userState);
        userState[userId].stage = 'gettitle';
    }

    else if (userState[userId]?.stage === 'gettitle') {
        await handleTitleValidation(userMessage, userId, chat, client, userState);
        await client.sendMessage(userId, 'Agora vamos submeter seu resumo expandido/artigo finalizado já corrigido pelo orientador.');
        userState[userId].stage = 'getArticleSlide';
    }

    else if (userState[userId]?.stage === 'getArticleSlide') {
        const contact = await msg.getContact();
        const name = contact.pushname;
        await handleArticleSlide(userId, chat, client, userState, msg)
        await client.sendMessage(userId, 'Seu artigo finalizado/resumo expandido foi submetido com sucesso.');
        await simulateTyping(chat);
        await client.sendMessage(userId, `Parabéns ${name} por concluir esta etapa dentro do prazo. Fique atento a novas etapas da Jornada de Inovação.`);
    }

    if (msg.body !== null && msg.body === '4' && msg.from.endsWith('@c.us')) {

    }

    if (msg.body !== null && msg.body === '5' && msg.from.endsWith('@c.us')) {

    }

});