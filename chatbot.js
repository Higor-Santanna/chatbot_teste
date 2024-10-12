// leitor de qr code
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js'); // Mudança Buttons
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

const handleLeaderValidation = async (userId, chat, client) => {
    await simulateTyping(chat);
    await client.sendMessage(userId, 'Verificando se você realmente é líder do grupo...');
    await simulateTyping(chat);
    await client.sendMessage(userId, 'Ok! Você é o líder do grupo. Agora me fale quem é seu professor orientador?');
}

const handleTeacherValidation = async (userId, chat, client) => {
    await simulateTyping(chat);
    await client.sendMessage(userId, 'Verificando se o professor é orientador do seu grupo...');
    await simulateTyping(chat);
    await client.sendMessage(userId, 'Certo! Este professor é orientador do seu grupo. Me informe o título do seu trabalho?');
};

const handleTitleValidation = async (userId, chat, client) => {
    await simulateTyping(chat)
    await client.sendMessage(userId, 'Verificando se esse título pertence ao seu trabalho...')
    await simulateTyping(chat)
    await client.sendMessage(userId, 'Certo! Este realmente é o título do trabalho.')
    await simulateTyping(chat);
};

const handleArticleSlide = async (userId, chat, client) => {
    await simulateTyping(chat);
    await client.sendMessage(userId, 'Recebendo e armazenando seu arquivo em nosso sistema...');
    await simulateTyping(chat);
}

const emojiRegex = /[\p{Emoji_Presentation}]/u;
const textWithAccentsRegex = /^[\p{L}\s]+$/u;
//Manipulador de mensagens
client.on('message', async msg => {
    const chat = await msg.getChat();
    const userId = msg.from;
    const userMessage = msg.body;

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

    if (userState[userId].stage === 'mainMenu') {
        if (msg.type === 'chat' && userMessage === '1') {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Você será o aluno líder?\n\n7 - Sim\n8 - Não');
            userState[userId].stage = 'leaderQuestion';
        }
    }

    else if (userState[userId].stage === 'leaderQuestion') {
        if (msg.type === 'chat' && userMessage === '7') {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Me fale o seu nome?');
            userState[userId].stage = 'getGroupLeader'
        } else if (msg.type === 'chat' && userMessage === '8') {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Você não pode fazer a submissão do resumo/artigo ou slide, pois você não é o aluno líder.');
            userState[userId].stage = 'initial';
        } else {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Por favor, envie uma resposta válida em texto.');
        }
    }

    else if (userState[userId].stage === 'getGroupLeader') {
        if (msg.type === 'chat' && !emojiRegex.test(userMessage) && textWithAccentsRegex.test(userMessage)) {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Verificando a matrícula...');
            await simulateTyping(chat)
            await client.sendMessage(userId, `Você ${userMessage}, é o aluno líder do grupo e será responsável pela submissão dos demais arquivos da jornada.\nAgora me informe o seu email mais utilizado?`);

            userState[userId].stage = 'getEmail';
        } else {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Por favor, me informe o seu nome para prosseguir com a inscrição');
        }
    }

    else if (userState[userId].stage === 'getEmail') {
        if (msg.type === 'chat') {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Verificando se o email é válido...');
            await simulateTyping(chat)
            await client.sendMessage(userId, `Ok seu email ${userMessage}, foi cadastrado. \nMe fale todos os integrantes do grupo incluindo o líder, coloque o nome completo de cada integrante e separe o nome de cada aluno por uma vírgula.\nO grupo poderá ser composto de 5 á 10 alunos.\nSegue o exemplo de como deve ser feito:\n\n Neymar Júnior, Cristiano Ronaldo, Max Verstappen, Lewis Hamilton, Ayrton Senna`);

            userState[userId].stage = 'getGroupMembers';
        } else {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Por favor, me informe um email válido');
        }
    }

    else if (userState[userId].stage === 'getGroupMembers') {
        const groupMembers = userMessage.split(',').map(names => names.trim());

        if (groupMembers.length >= 5 && groupMembers.length <= 10 && msg.type === 'chat' && !emojiRegex.test(userMessage)) {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Verificando se os alunos estão inscritos em algum grupo...');
            await simulateTyping(chat)
            await client.sendMessage(userId, 'A inscrição dos integrantes foi concluída com sucesso.\nOk! Me fale quem é seu professor orientador?');

            userState[userId].stage = 'getGuidingTeacher';
        } else {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Por favor, me informe entre 5 e 10 nomes separados por vírgula.');
        }
    }

    else if (userState[userId].stage === 'getGuidingTeacher') {
        if (msg.type === 'chat' && !emojiRegex.test(userMessage) && textWithAccentsRegex.test(userMessage)) {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Verificando se o professor é válido...');
            await simulateTyping(chat)
            await client.sendMessage(userId, `Ok seu professor orientador é ${userMessage}. Diga qual o título do seu artigo?`);

            userState[userId].stage = 'getJobTitle';
        } else {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Insira o nome do professor que seja válido');
        }
    }

    else if (userState[userId].stage === 'getJobTitle') {
        if (msg.type === 'chat' && !emojiRegex.test(userMessage) && textWithAccentsRegex.test(userMessage)) {
            await simulateTyping(chat)
            await client.sendMessage(userId, `Certo, o título do seu artigo é ${userMessage}.`);
            await simulateTyping(chat)
            await client.sendMessage(userId, `Qual seu curso de graduação?\n\n1 - Administração\n2 - Análise e Desenvolvimento de Sistemas\n3- Agronomia\n4 - Arquitetura e Urbanismo\n5 - Ciências Contábeis\n6 - Comunicação Social\n7 - Direito - Matutino\n8 - Direito - Noturno\n9 - Educação Física - Bacharelado\n10 - Educação Física - Licenciatura\n11 - Enfermagem\n12 - Engenharia de Produção\n13 - Engenharia Mecânica\n14 - Farmácia\n15 - Fisioterapia\n16 - Medicina Veterinária\n17 - Odontologia\n18 - Pedagogia\n19 - Psicologia`);

            userState[userId].stage = 'getCourse';
        } else {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Insira um título válido');
        }
    }

    else if (userState[userId].stage === 'getCourse') {
        const courses = {
            '1': 'Administração',
            '2': 'Análise e Desenvolvimento de Sistemas',
            '3': 'Agronomia',
            '4': 'Arquitetura e Urbanismo',
            '5': 'Ciências Contábeis',
            '6': 'Comunicação Social',
            '7': 'Direito - Matutino',
            '8': 'Direito - Noturno',
            '9': 'Educação Física - Bacharelado',
            '10': 'Educação Física - Licenciatura',
            '11': 'Enfermagem',
            '12': 'Engenharia de Produção',
            '13': 'Engenharia Mecânica',
            '14': 'Farmácia',
            '15': 'Fisioterapia',
            '16': 'Medicina Veterinária',
            '17': 'Odontologia',
            '18': 'Pedagogia',
            '19': 'Psicologia'
        };

        if (courses[userMessage]) {
            await simulateTyping(chat)
            await client.sendMessage(userId, `Ok, você selecionou o curso: ${courses[userMessage]}`);
            await simulateTyping(chat)
            await client.sendMessage(userId, `Qual seu período?\n\n1 - 1º (primeiro período)\n2 - 2º (segundo período)\n3 - 3º (terceiro período)\n4 - 4º (quarto período)\n5 - 5º (quinto período)\n6 - 6º (sexto período)\n7 - 7º (sétimo período)\n8 8º (oitavo período)\n9 - 9º (nono período)\n10 - 10º (décimo período)`);

            userState[userId].stage = 'getSendPoll';
        } else {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Por favor, escolha uma das opções.');
        }
    }

    else if (userState[userId].stage === 'getSendPoll') {
        const period = {
            '1': '1º (primeiro período)',
            '2': '2º (segundo período)',
            '3': '3º (terceiro período)',
            '4': '4º (quarto período)',
            '5': '5º (quinto período)',
            '6': '6º (sexto período)',
            '7': '7º (sétimo período)',
            '8': '8º (oitavo período)',
            '9': '9º (nono período)',
            '10': '10º (décimo período)'
        };
        if (period[userMessage]) {
            await simulateTyping(chat)
            await client.sendMessage(userId, `Ok, você está no: ${period[userMessage]}`);
            await simulateTyping(chat)
            await client.sendMessage(userId, `Qual  o tema do seu trabalho? \n\n1 - Análise Contratual Automatizada\n2 - Análise de Dados Empresariais\n3- Análise de Sentimento em Mídias Sociais\n4 - Análise de Sentimentos em Processos\n5 - Análise Preditiva (antecipação)\n6 - Apoio à Decisão Clínica\n7 - Aprendizado de Máquina em Finanças\n8 - Aprendizado de Máquina para Otimização\n9 - Arte Generativa\n10 - Assistentes Virtuais em Saúde\n11 - Automação de Processos de Negócios\n12 - Automatização de Documentação Legal\n13 - Automatização de Processos\n14 - Avaliação de Riscos Jurídicos\n15 - Chatbots e Assistência Virtual\n16 - Chatbots Jurídicos\n17 - Cibersegurança\n18 - Descoberta de Medicamentos\n19 - Ensino Assistido por Computador\n20 - Ética em Inteligência Artificial\n21 - Gestão de Dados de Saúde\n22 - Gestão de Riscos\n23 - Impacto da IA na Educação\n24 - Manufatura Inteligente\n25 - Otimização de Recursos Hospitalares\n26 - Pesquisa Jurídica\n27 - Prevenção e Monitoramento de Doenças\n28 - Previsão de Resultados Judiciais\n29 - Realidade Aumentada e Virtual\n30 - Robótica e Controle Autônomo\n31 - Segurança Cibernética Jurídica`);

            userState[userId].stage = 'getThemeOfWork';
            console.log(`Estado atualizado para: ${userState[userId]?.stage}`);
        } else {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Por favor, escolha uma das opções da enquete.');
        }
    }

    else if (userState[userId].stage === 'getThemeOfWork') {
        const themeWork = {
            '1': 'Análise Contratual Automatizada',
            '2': 'Análise de Dados Empresariais',
            '3': 'Análise de Sentimento em Mídias Sociais',
            '4': 'Análise de Sentimentos em Processos',
            '5': 'Análise Preditiva (antecipação)',
            '6': 'Apoio à Decisão Clínica',
            '7': 'Aprendizado de Máquina em Finanças',
            '8': 'Aprendizado de Máquina para Otimização',
            '9': 'Arte Generativa',
            '10': 'Assistentes Virtuais em Saúde',
            '11': 'Automação de Processos de Negócios',
            '12': 'Automatização de Documentação Legal',
            '13': 'Automatização de Processos',
            '14': 'Avaliação de Riscos Jurídicos',
            '15': 'Chatbots e Assistência Virtual',
            '16': 'Chatbots Jurídicos',
            '17': 'Cibersegurança',
            '18': 'Descoberta de Medicamentos',
            '19': 'Ensino Assistido por Computador',
            '20': 'Ética em Inteligência Artificial',
            '21': 'Gestão de Dados de Saúde',
            '22': 'Gestão de Riscos',
            '23': 'Impacto da IA na Educação',
            '24': 'Manufatura Inteligente',
            '25': 'Otimização de Recursos Hospitalares',
            '26': 'Pesquisa Jurídica',
            '27': 'Prevenção e Monitoramento de Doenças',
            '28': 'Previsão de Resultados Judiciais',
            '29': 'Realidade Aumentada e Virtual',
            '30': 'Robótica e Controle Autônomo',
            '31': 'Segurança Cibernética Jurídica'
        };

        if (themeWork[userMessage]) {
            await simulateTyping(chat)
            await client.sendMessage(userId, `Ok, você selecionou o curso: ${themeWork[userMessage]}`);
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Agora vamos submeter seu resumo simples. Me envie ele no formato PDF');

            userState[userId].stage = 'getSimpleArticle';
        } else {
            await client.sendMessage(userId, 'Por favor, escolha uma das opções.');
        }
    }

    else if (userState[userId].stage === 'getSimpleArticle') {
        const contact = await msg.getContact();
        const name = contact.pushname;
        const media = await msg.downloadMedia();
        if (msg.hasMedia && media.mimetype === 'application/pdf') {
            await handleArticleSlide(userId, chat, client)
            await client.sendMessage(userId, 'Seu resumo simples foi submetido com sucesso');
            await simulateTyping(chat);
            await client.sendMessage(userId, `Parabéns ${name} por concluir esta etapa dentro do prazo. Fique atento a novas etapas da Jornada de Inovação.`);
            userState[userId].stage = 'initial'
        } else {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Você precisa enviar um arquivo no formato PDF.');
        }
    }

    if (userState[userId].stage === 'mainMenu') {
        if (msg.type === 'chat' && userMessage === '2') {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Você é o aluno líder?\n\n7 - Sim\n8 - Não');
            userState[userId].stage = 'leadeQuestion';
        }
    }

    else if (userState[userId].stage === 'leadeQuestion') {
        if (msg.type === 'chat' && userMessage === '7') {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Me fale o seu nome?');
            userState[userId].stage = 'getNameLeader'
        } else if (msg.type === 'chat' && userMessage === '8') {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Você não pode fazer a submissão do resumo/artigo ou slide, pois você não é o aluno líder.');
            userState[userId].stage = 'initial';
        } else {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Por favor, envie uma resposta válida em texto.');
        }
    }

    else if (userState[userId].stage === 'getNameLeader') {
        if (msg.type === 'chat' && !emojiRegex.test(userMessage) && textWithAccentsRegex.test(userMessage)) {
            await handleLeaderValidation(userId, chat, client, msg)
            userState[userId].stage = 'getTeacher';
        } else {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Apenas mensagens de texto são aceitas. Por favor, digite o seu nome.');
        }
    }

    else if (userState[userId].stage === 'getTeacher') {
        if (msg.type === 'chat' && !emojiRegex.test(userMessage) && textWithAccentsRegex.test(userMessage)) {
            await handleTeacherValidation(userId, chat, client, msg);
            userState[userId].stage = 'getTitle';
        } else {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Apenas mensagens de texto são aceitas. Por favor, digite o seu nome.');
        }
    }

    else if (userState[userId].stage === 'getTitle') {
        if (msg.type === 'chat' && !emojiRegex.test(userMessage) && textWithAccentsRegex.test(userMessage)) {
            await handleTitleValidation(userId, chat, client, msg);
            await client.sendMessage(userId, 'Agora vamos submeter seu resumo expandido/artigo finalizado e enviar o mesmo ao orientador para correção. Enviar o arquivo no formato PDF.');
            userState[userId].stage = 'getArticleAndSlide';
        } else {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Apenas mensagens de texto são aceitas. Por favor, digite o seu nome.');
        }
    }

    else if (userState[userId].stage === 'getArticleAndSlide') {
        const contact = await msg.getContact();
        const name = contact.pushname;
        const media = await msg.downloadMedia();
        if (msg.hasMedia && media.mimetype === 'application/pdf') {
            await handleArticleSlide(userId, chat, client, userState, msg)
            await client.sendMessage(userId, 'Seu artigo finalizado/resumo expandido foi submetido para a correção do orientador.');
            await simulateTyping(chat);
            await client.sendMessage(userId, `Parabéns ${name} por concluir esta etapa dentro do prazo. Fique atento a novas etapas da Jornada de Inovação.`);
            userState[userId].stage = 'initial'
        } else {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Você precisa enviar um arquivo no formato PDF.');
        }
    }

    if (userState[userId].stage === 'mainMenu') {
        if (msg.type === 'chat' && userMessage === '3') {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Você é o aluno líder?\n\n7 - Sim\n8 - Não');
            userState[userId].stage = 'leaderquestion';
        }
    }

    else if (userState[userId].stage === 'leaderquestion') {
        if (msg.type === 'chat' && userMessage === '7') {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Me fale o seu nome?');
            userState[userId].stage = 'getNameLeade'
        } else if (msg.type === 'chat' && userMessage === '8') {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Você não pode fazer a submissão do resumo/artigo ou slide, pois você não é o aluno líder.');

            userState[userId].stage = 'initial';
        } else {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Por favor, envie uma resposta válida em texto.');
        }
    }

    else if (userState[userId].stage === 'getNameLeade') {
        if (msg.type === 'chat' && !emojiRegex.test(userMessage) && textWithAccentsRegex.test(userMessage)) {
            await handleLeaderValidation(userId, chat, client);
            userState[userId].stage = 'getProf';
        } else {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Apenas mensagens de texto são aceitas. Por favor, digite o seu nome.');
        }
    }

    else if (userState[userId].stage === 'getProf') {
        if (msg.type === 'chat' && !emojiRegex.test(userMessage) && textWithAccentsRegex.test(userMessage)) {
            await handleTeacherValidation(userId, chat, client);
            userState[userId].stage = 'gettitle';
        } else {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Apenas mensagens de texto são aceitas. Por favor, digite o nome do professor.');
        }
    }

    else if (userState[userId].stage === 'gettitle') {
        if (msg.type === 'chat' && !emojiRegex.test(userMessage) && textWithAccentsRegex.test(userMessage)) {
            await handleTitleValidation(userId, chat, client);
            await client.sendMessage(userId, 'Agora vamos submeter seu resumo expandido/artigo finalizado. Lembrando que só será aceito arquivos no formato PDF.');
            userState[userId].stage = 'getArticleEnd';
        } else {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Apenas mensagens de texto são aceitas. Por favor, digite o título do seu trabalho.');
        }
    }

    else if (userState[userId].stage === 'getArticleEnd') {
        const contact = await msg.getContact();
        const name = contact.pushname;
        const media = await msg.downloadMedia();
        if (msg.hasMedia && media.mimetype === 'application/pdf') {
            await handleArticleSlide(userId, chat, client, userState, msg)
            await client.sendMessage(userId, 'Seu artigo finalizado/resumo expandido foi submetido com sucesso.');
            await simulateTyping(chat);
            await client.sendMessage(userId, `Parabéns ${name} por concluir esta etapa dentro do prazo. Fique atento a novas etapas da Jornada de Inovação.`);
            userState[userId].stage = 'initial'
        } else {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Você precisa enviar um arquivo no formato PDF.');
        }
    }

    if (userState[userId].stage === 'mainMenu') {
        if (msg.type === 'chat' && userMessage === '4') {
            await simulateTyping(chat)
            await client.sendMessage(userId, 'Você é o aluno líder?\n\n7 - Sim\n8 - Não');
            userState[userId].stage = 'questionLeader';
        }
    }

    else if (userState[userId].stage === 'questionLeader') {
        if (msg.type === 'chat' && userMessage === '7') {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Me fale o seu nome?');
            userState[userId].stage = 'getName'
        } else if (msg.type === 'chat' && userMessage === '8') {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Você não pode fazer a submissão do resumo/artigo ou slide, pois você não é o aluno líder.');
            userState[userId].stage = 'initial';
        } else {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Por favor, envie uma resposta válida em texto.');
        }
    }

    else if (userState[userId].stage === 'getName') {
        if (msg.type === 'chat' && !emojiRegex.test(userMessage) && textWithAccentsRegex.test(userMessage)) {
            await handleLeaderValidation(userId, chat, client);
            userState[userId].stage = 'getProfessor';
        } else {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Apenas mensagens de texto são aceitas. Por favor, digite o seu nome.');
        }
    }

    else if (userState[userId].stage === 'getProfessor') {
        if (msg.type === 'chat' && !emojiRegex.test(userMessage) && textWithAccentsRegex.test(userMessage)) {
            await handleTeacherValidation(userId, chat, client);
            userState[userId].stage = 'title';
        } else {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Apenas mensagens de texto são aceitas. Por favor, digite o nome do professor.');
        }
    }

    else if (userState[userId].stage === 'title') {
        if (msg.type === 'chat' && !emojiRegex.test(userMessage) && textWithAccentsRegex.test(userMessage)) {
            await handleTitleValidation(userId, chat, client);
            await client.sendMessage(userId, 'Agora vamos submeter o slide para apresentação. Lembrando que só será aceito arquivos no formato PDF.');
            userState[userId].stage = 'getSlide';
        } else {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Apenas mensagens de texto são aceitas. Por favor, digite o título do seu trabalho.');
        }
    }

    else if (userState[userId].stage === 'getSlide') {
        const contact = await msg.getContact();
        const name = contact.pushname;
        const media = await msg.downloadMedia();
        if (msg.hasMedia && media.mimetype === 'application/pdf') {
            await handleArticleSlide(userId, chat, client, userState, msg)
            await client.sendMessage(userId, 'Seu slide foi submetido com sucesso.');
            await simulateTyping(chat);
            await client.sendMessage(userId, `Parabéns ${name} por concluir esta etapa dentro do prazo. Agora gere o seu QRcode e se prepare para a apresentação.`);
            userState[userId].stage = 'initial'
        } else {
            await simulateTyping(chat);
            await client.sendMessage(userId, 'Você precisa enviar um arquivo no formato PDF.');
        }
    }

    if (msg.body !== null && msg.body === '5' && msg.from.endsWith('@c.us')) {

    }

});