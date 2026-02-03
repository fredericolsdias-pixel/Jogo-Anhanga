(function(){        
    var cnv = document.querySelector("canvas");
    var ctx = cnv.getContext("2d");
    var gameStarted = false;
   
    cnv.addEventListener("click" , function(){
        if(!gameStarted){
            gameStarted = true;
        }
    });
   
    var WIDTH = cnv.width, HEIGHT = cnv.height;
   
    var LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40;
    var mvLeft = mvUp = mvRight = mvDown = false;
 
    var tileSize = 64;
    var tileSrcSize = 96;
 
    var img = new Image();
    img.src = "img/img.png";
    img.addEventListener("load",function(){
        requestAnimationFrame(loop,cnv);
    },false);
 
    const curupira = {
        x : 5 * tileSize,
        y : 3 * tileSize,
        width: 36,
        height:42,
        img : new Image()
    };
    curupira.img.src= "img/curupira.gif"

    //variavel da gaiola
    const gaiolaImg = new Image()
    gaiolaImg.src = "img/gaiola.png"
    
    // variavel pra o sistema de quiz
    var quizActive = false;
    var currentQuizAnimal = null;
    var quizOptions = [];

    // Variáveis para controle de fase
    var faseAtual = 1;
    var animaisParaPassar = 5; // mínimo para passar de fase
    var telaVitoriaAtiva = false;
    var telaDerrotaAtiva = false;
    var jogoPausado = false;

    function gerarOpcoesQuiz(respostaCorreta){
        const respostasIncorretas = {
        'arara': ['polinização de flores', 'controle de insetos', 'limpeza do solo', 'construção de ninhos'],
        'onça': ['dispersão de sementes', 'polinização', 'fertilização do solo', 'controle de plantas'],
        'tucano': ['polinização manual', 'controle de pragas', 'fertilização natural', 'limpeza de frutas'],
        'macaco': ['controle de predadores', 'polinização noturna', 'dispersão de água', 'proteção do solo'],
        'raposa': ['polinização cruzada', 'dispersão de sementes', 'fertilização orgânica', 'controle de plantas'],
        'leão': ['dispersão genética', 'polinização indireta', 'fertilização natural', 'controle vegetal']
        }
        
        if (!currentQuizAnimal) return [respostaCorreta, "Opção 1", "Opção 2", "Opção 3"];
        
        var tipoAnimal = currentQuizAnimal.tipo.toLowerCase().split(' ')[0]

        var incorretas = respostasIncorretas[tipoAnimal] || [
            'polinização de flores',
            'controle de insetos',
            'limpeza do solo',
            'fertilização natural'
        ]
        
        var opcoesIncorretas = [...incorretas].sort(()=> Math.random() - 0.5).slice(0, 3)

        var todasOpcoes = [respostaCorreta, ...opcoesIncorretas]

        return todasOpcoes.sort(()=> Math.random() - 0.5)
    }

    //variavel global para animais
    var animais = [];
    var animaisLibertados = 0;
    var totalAnimais = 7; //quantidade de animais (7 no banco)
    var missaoAtiva = false; //missao so começa dps do dialogo
 
    function Animal(imgSrc , tipo , pergunta , respostaCorreta){
        this.img = new Image();
        this.img.src = imgSrc;
        this.tipo = tipo;
        this.pergunta = pergunta;
        this.respostaCorreta = respostaCorreta.toLowerCase();
        this.liberto = false;
        this.jaQuestionado = false;
        this.x = 0;
        this.y = 0;
        this.width = 40;
        this.height = 40;
    }
 
    const bancoAnimals = [
        {
            imgSrc: 'img/arara.png',
            tipo:'Arara Vermelha',
            pergunta:'Qual é o papel crucial das araras na regeneração das florestas, relacionado à sua alimentação?',
            respostaCorreta:'dispersão de sementes'
        },
        {
            imgSrc: 'img/arara2.png',
            tipo:'Arara Azul',
            pergunta:'Como o hábito das araras de pousar e "descascar" troncos de árvores mortas pode beneficiar outras espécies?',
           respostaCorreta:'cria abrigos para outras espécies'
        },
        {
            imgSrc: 'img/onca.png',
            tipo:'Onça',
            pergunta:'Como a onça, como predador de topo, ajuda a manter o equilíbrio das populações de herbívoros (como capivaras e veados)?',
        respostaCorreta:'controle populacional'
        },
        {
            imgSrc: 'img/tucanin.png',
            tipo:'Tucano',
            pergunta:'Por que o tucano é um dos dispersores de sementes mais importantes das florestas tropicais, especialmente para árvores de grande porte?',
            respostaCorreta:'engole sementes grandes inteiras'
        },
        {
            imgSrc: 'img/macaco.png',
            tipo:'Macaco',
            pergunta:'Qual é a importância dos macacos como jardineiros da floresta?',
            respostaCorreta:'plantam árvores através das fezes'
        },
        {
            imgSrc: 'img/raposa.png',
            tipo:'Raposa',
            pergunta:'Como o hábito alimentar onívoro e oportunista da raposa ajuda no controle de pragas em ecossistemas agrícolas e naturais?',
            respostaCorreta:'come roedores e insetos'
        },
        {
            imgSrc: 'img/leao.png',
            tipo:'Leão',
            pergunta:'Como a caça cooperativa dos leões remove indivíduos doentes ou mais fracos das manadas de herbívoros, fortalecendo as populações de presas?',
            respostaCorreta:'seleção natural'
        }
    ];
 
    function gerarPosicaoAleatoria(){
        var posicaoValida = false;
        var tentativas = 0;
        var x = 0, y = 0;
 
        while (!posicaoValida && tentativas < 100){
            var coluna = Math.floor(Math.random() * maze[0].length);
            var linha = Math.floor(Math.random() * maze.length);
 
            if(maze[linha][coluna] === 0){
                x = coluna * tileSize + tileSize/4;
                y = linha * tileSize + tileSize/4;
 
                var distanciaJogador = Math.sqrt(
                    Math.pow(x - player.x , 2) + Math.pow(y - player.y, 2)
                );
               
                var distanciaCurupira = Math.sqrt(
                    Math.pow(x - curupira.x , 2) + Math.pow(y - curupira.y , 2)
                );
               
                var colisaoParede = false;
                for(var i = 0; i < walls.length; i++){
                    var wall = walls[i];
                    if (x < wall.x + wall.width &&
                        x + 32 > wall.x &&
                        y < wall.y + wall.height &&
                        y + 32 > wall.y){
                            colisaoParede = true;
                            break;
                        }
                }
               
                if (distanciaJogador > 200 &&
                    distanciaCurupira > 150 &&
                    !colisaoParede &&
                    x > tileSize && x < T_WIDTH - tileSize &&
                    y > tileSize && y < T_HEIGHT - tileSize){
                        posicaoValida = true;
                    }
            }
            tentativas++;
        }
        return {x : x , y : y};
    }
             
    function inicializarAnimais(){
        animais = [];
        var animaisDisponiveis = [...bancoAnimals];
        animaisDisponiveis.sort(() => Math.random() - 0.5);
       
        for (var i = 0; i < Math.min(totalAnimais, animaisDisponiveis.length); i++) {
            var animalData = animaisDisponiveis[i];
            var animal = new Animal(
                animalData.imgSrc,
                animalData.tipo,
                animalData.pergunta,
                animalData.respostaCorreta
            );
            var posicao = gerarPosicaoAleatoria();
            animal.x = posicao.x;
            animal.y = posicao.y;
           
            animais.push(animal);
        }
        console.log(`${animais.length} animais posicionados no mapa`);
    }
 
    var dialogoAnimalAtivo = false;
    var animalInteragindo = null;
 
    function iniciarDialogoAnimal(animal) {
        if (!animal.liberto && !animal.jaQuestionado && !dialogoAnimalAtivo && !quizActive && !jogoPausado) {
            currentQuizAnimal = animal;
            quizActive = true;
            
            animal.jaQuestionado = true;
            
            mvLeft = mvRight = mvUp = mvDown = false;

            var quizBox = document.getElementById("quizBox");
            var quizText = document.getElementById("quizText");
            var quizFeedback = document.getElementById("quizFeedback");
            var quizNext = document.getElementById("quizNext");
           
            if(quizBox && quizText){
                quizText.textContent = `${animal.tipo} pergunta:\n\n${animal.pergunta}`;
                quizFeedback.textContent = "";
                quizFeedback.className = "";
                quizNext.textContent = "Clique em uma opção para responder";

                quizOptions = gerarOpcoesQuiz(animal.respostaCorreta);
                var optionButtons = document.querySelectorAll('.quiz-option');

                optionButtons.forEach(function(button, index){
                    if(index < quizOptions.length){
                        button.textContent = quizOptions[index];
                        button.classList.remove('correct', 'incorrect', 'disabled');
                        button.disabled = false;
                        button.style.display = 'block';
                    } else {
                        button.style.display = 'none';
                    }
                });

                quizBox.classList.remove('hidden');
            }
        }
    }
  
    function processarRespostaQuiz(opcaoIndex) {
        if (!quizActive || !currentQuizAnimal) return;
        
        var respostaSelecionada = quizOptions[opcaoIndex];
        var respostaCorreta = currentQuizAnimal.respostaCorreta;
        var quizBox = document.getElementById("quizBox");
        var quizFeedback = document.getElementById("quizFeedback");
        var quizNext = document.getElementById("quizNext");
        var optionButtons = document.querySelectorAll('.quiz-option');
        
        // Desabilitar todos os botões
        optionButtons.forEach(function(button) {
            button.disabled = true;
            button.classList.add('disabled');
        });
        
        if (respostaSelecionada === respostaCorreta) {
            // RESPOSTA CORRETA
            optionButtons[opcaoIndex].classList.add('correct');
            quizFeedback.textContent = "✓ Correto! Você libertou o animal!";
            quizFeedback.className = "correct";
            quizNext.textContent = "Pressione ESPAÇO para continuar";
            
            // Libertar animal e atualizar contador
            currentQuizAnimal.liberto = true;
            animaisLibertados++;
            atualizaContador();
            
            // Verificar vitória imediatamente
            verificarVitoria();
            
        } else {
            // RESPOSTA INCORRETA
            optionButtons[opcaoIndex].classList.add('incorrect');
            
            // Destacar a resposta correta
            optionButtons.forEach(function(button, index) {
                if (quizOptions[index] === respostaCorreta) {
                    button.classList.add('correct');
                }
            });
            
            quizFeedback.textContent = "✗ Resposta incorreta! O animal continua preso.";
            quizFeedback.className = "incorrect";
            quizNext.textContent = "Pressione ESPAÇO para continuar";
            
            // Verificar derrota após erro
            setTimeout(verificarDerrota, 100);
        }
    }

    function atualizaContador(){
        var contadorElement = document.getElementById("contador");
        var totalElement = document.getElementById("total");
        var contadorDiv = document.getElementById("contadorAnimais");
 
        if(contadorElement && totalElement && contadorDiv){
            contadorElement.textContent = animaisLibertados;
            totalElement.textContent = totalAnimais;
 
            if (missaoAtiva) {
                contadorDiv.classList.remove("hidden");
            }
        }
    }

    // FUNÇÕES DE VITÓRIA/DERROTA
    function verificarVitoria() {
        if (animaisLibertados >= animaisParaPassar && !telaVitoriaAtiva && !telaDerrotaAtiva) {
            mostrarTelaVitoria();
        }
    }

    function verificarDerrota() {
        // Contar quantos animais ainda podem ser questionados
        var animaisRestantes = 0;
        for (var i = 0; i < animais.length; i++) {
            var animal = animais[i];
            if (!animal.liberto && !animal.jaQuestionado) {
                animaisRestantes++;
            }
        }
        
        // Se não há mais animais para questionar E não atingiu o mínimo
        if (animaisRestantes === 0 && animaisLibertados < animaisParaPassar && !telaVitoriaAtiva && !telaDerrotaAtiva) {
            mostrarTelaDerrota();
        }
    }

    function mostrarTelaVitoria() {
        telaVitoriaAtiva = true;
        jogoPausado = true;
        
        var vitoriaScreen = document.getElementById("vitoriaScreen");
        var vitoriaText = document.getElementById("vitoriaText");
        
        if (vitoriaScreen && vitoriaText) {
            vitoriaText.textContent = `🎉 Parabéns! Você libertou ${animaisLibertados} de ${totalAnimais} animais!`;
            vitoriaScreen.classList.remove("hidden");
        }
    }

    function mostrarTelaDerrota() {
        telaDerrotaAtiva = true;
        jogoPausado = true;
        
        var derrotaScreen = document.getElementById("derrotaScreen");
        var derrotaText = document.getElementById("derrotaText");
        
        if (derrotaScreen && derrotaText) {
            derrotaText.textContent = `😔 Você libertou apenas ${animaisLibertados} de ${animaisParaPassar} animais necessários`;
            derrotaScreen.classList.remove("hidden");
        }
    }

    function avancarFase() {
        faseAtual++;
        
        // Esconder tela de vitória
        var vitoriaScreen = document.getElementById("vitoriaScreen");
        if (vitoriaScreen) {
            vitoriaScreen.classList.add("hidden");
        }
        
        telaVitoriaAtiva = false;
        jogoPausado = false;
        
        alert(`🎮 FASE ${faseAtual} CARREGADA!\n\nEm desenvolvimento: Próxima fase com novos desafios!`);
        
        // Reiniciar o jogo
        reiniciarJogo();
    }

    function reiniciarJogo() {
        // Esconder telas
        var derrotaScreen = document.getElementById("derrotaScreen");
        if (derrotaScreen) {
            derrotaScreen.classList.add("hidden");
        }
        
        // Resetar variáveis
        telaDerrotaAtiva = false;
        telaVitoriaAtiva = false;
        jogoPausado = false;
        quizActive = false;
        currentQuizAnimal = null;
        
        // Resetar animais
        animais = [];
        animaisLibertados = 0;
        missaoAtiva = false;
        
        // Resetar player para posição inicial
        player.x = tileSize + 2;
        player.y = tileSize + 2;
        
        // Resetar câmera
        cam.x = 0;
        cam.y = 0;
        
        // Resetar controles
        mvLeft = mvRight = mvUp = mvDown = false;
        
        // Esconder contador
        var contadorDiv = document.getElementById("contadorAnimais");
        if (contadorDiv) {
            contadorDiv.classList.add("hidden");
        }
        
        // Esconder quiz se estiver visível
        var quizBox = document.getElementById("quizBox");
        if (quizBox) {
            quizBox.classList.add("hidden");
        }
        
        // Reiniciar diálogo do Curupira
        curupiraTriggered = false;
        
        console.log("Jogo reiniciado! Fase: " + faseAtual);
    }
   
    var walls = [];
 
    var player = {
        x: tileSize + 2,
        y: tileSize + 2,
        width: 24,
        height: 32,
        speed: 6,
        srcX: 0,
        srcY: tileSrcSize,
        countAnim: 0
    };
       
    var maze = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
        [1,1,1,0,1,1,1,0,0,1,0,0,0,1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1,0,1,1,1,1,1,1,0,1,1,1,1,1],
        [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,1,0,0,1,1,1,1,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0,0,1],
        [1,0,1,1,1,1,1,0,0,1,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
        [1,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
        [1,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
        [1,0,0,1,0,0,1,1,1,0,1,1,1,1,1,0,1,1,1,1],
        [1,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
        [1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];
       
    var T_WIDTH = maze[0].length * tileSize,
        T_HEIGHT = maze.length * tileSize;
       
    for(var row in maze){
        for(var column in maze[row]){
            var tile = maze[row][column];
            if(tile === 1){
                var wall = {
                    x: tileSize*column,
                    y: tileSize*row,
                    width: tileSize,
                    height: tileSize
                };
                walls.push(wall);
            }
        }
    }
       
    var cam = {
        x: 0,
        y: 0,
        width: WIDTH,
        height: HEIGHT,
        innerLeftBoundary: function(){
            return this.x + (this.width*0.25);
        },
        innerTopBoundary: function(){
            return this.y + (this.height*0.25);
        },
        innerRightBoundary: function(){
            return this.x + (this.width*0.75);
        },
        innerBottomBoundary: function(){
            return this.y + (this.height*0.75);
        }
    };
       
    function blockRectangle(objA,objB){
        var distX = (objA.x + objA.width/2) - (objB.x + objB.width/2);
        var distY = (objA.y + objA.height/2) - (objB.y + objB.height/2);
           
        var sumWidth = (objA.width + objB.width)/2;
        var sumHeight = (objA.height + objB.height)/2;
           
        if(Math.abs(distX) < sumWidth && Math.abs(distY) < sumHeight){
            var overlapX = sumWidth - Math.abs(distX);
            var overlapY = sumHeight - Math.abs(distY);
               
            if(overlapX > overlapY){
                objA.y = distY > 0 ? objA.y + overlapY : objA.y - overlapY;
            } else {
                objA.x = distX > 0 ? objA.x + overlapX : objA.x - overlapX;
            }
        }
    }
       
    window.addEventListener("keydown",keydownHandler,false);
    window.addEventListener("keyup",keyupHandler,false);
       
    function keydownHandler(e){
        var key = e.keyCode;
        switch(key){
            case LEFT:
                mvLeft = true;
                break;
            case UP:
                mvUp = true;
                break;
            case RIGHT:
                mvRight = true;
                break;
            case DOWN:
                mvDown = true;
                break;
        }
    }
                       
    function keyupHandler(e){
        var key = e.keyCode;
        switch(key){
            case LEFT:
                mvLeft = false;
                break;
            case UP:
                mvUp = false;
                break;
            case RIGHT:
                mvRight = false;
                break;
            case DOWN:
                mvDown = false;
                break;
        }
    }
                       
    function isColliding(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }
    
    var dialogActive = false;
    var dialogIndex = 0;
    const dialogLines=[
        "Curupira: Anhangá!Finalmente você despertou! A floresta corre perigo!",
        "Anhangá: O que aconteceu?",
        "Curupira: Os Caçadores vieram e prenderam vários animais, você precisa liberta-los antes que seja tarde demais !",
        "Anhangá: E onde os animais estão?",
        "Curupira: Eles estão presos pela floresta, sua missão é acha-los e libertá-los, acertando as respostas das perguntas.",
        "Curupira: Corre! A floresta clama por socorro!"
    ];
 
    const dialogBox = document.getElementById ("dialogBox");
    const dialogText = document.getElementById("dialogText");
 
    var curupiraTriggered = false;
    
    function startDialog(){
        dialogActive = true;
        dialogIndex = 0;
        dialogBox.classList.remove("hidden");
        dialogText.textContent = dialogLines[dialogIndex];

        missaoAtiva = true;
        inicializarAnimais();
        atualizaContador();
    }
 
    window.addEventListener("keydown", function(e){
        if(dialogActive && e.key === "Enter"){
            dialogIndex++;
            if(dialogIndex >= dialogLines.length){
                dialogBox.classList.add("hidden");
                dialogActive = false;
            } else {
                dialogText.textContent = dialogLines[dialogIndex];
            }
        }
    });
           
    function update(){
        // Se jogo está pausado (vitória/derrota), não atualizar nada
        if (jogoPausado) {
            mvLeft = mvRight = mvUp = mvDown = false;
            return;
        }
        
        // Se quiz está ativo, não mover o jogador
        if (quizActive) {
            mvLeft = mvRight = mvUp = mvDown = false;
            return;
        }
        
        if(mvLeft && !mvRight){
            player.x -= player.speed;
            player.srcY = tileSrcSize + player.height * 2;
        } else if(mvRight && !mvLeft){
            player.x += player.speed;
            player.srcY = tileSrcSize + player.height * 3;
        }
        
        if(mvUp && !mvDown){
            player.y -= player.speed;
            player.srcY = tileSrcSize + player.height * 1;
        } else if(mvDown && !mvUp){
            player.y += player.speed;
            player.srcY = tileSrcSize + player.height * 0;
        }
               
        //processo de animação
        if(mvLeft || mvRight || mvUp || mvDown){
            player.countAnim++;
                   
            if(player.countAnim >= 40){
                player.countAnim = 0;
            }
                   
            player.srcX = Math.floor(player.countAnim/5) * player.width;
        } else {
            player.srcX = 0;
            player.countAnim = 0;
        }
           
        for(var i in walls){
            var wall = walls[i];
            blockRectangle(player,wall);
        }
           
        if(player.x < cam.innerLeftBoundary()){
            cam.x = player.x - (cam.width * 0.25);
        }
        if(player.y < cam.innerTopBoundary()){
            cam.y = player.y - (cam.height * 0.25);
        }
        if(player.x + player.width > cam.innerRightBoundary()){
            cam.x = player.x + player.width - (cam.width * 0.75);
        }
        if(player.y + player.height > cam.innerBottomBoundary()){
            cam.y = player.y + player.height - (cam.height * 0.75);
        }
           
        cam.x = Math.max(0,Math.min(T_WIDTH - cam.width,cam.x));
        cam.y = Math.max(0,Math.min(T_HEIGHT - cam.height,cam.y));
 
        // colisão com o Curupira
        if (!curupiraTriggered && isColliding(player, curupira)) {
            curupiraTriggered = true;
            startDialog();
        }
        
        //colisão com animais 
        for (var i = 0; i < animais.length; i++){
            var animal = animais[i];
            
            if(!animal.liberto && !animal.jaQuestionado && missaoAtiva && isColliding(player, animal) && !quizActive && !jogoPausado){
                iniciarDialogoAnimal(animal);
                break;
            }
        }
    }
       
    function render(){
        ctx.clearRect(0,0,WIDTH,HEIGHT);
        ctx.save();
        ctx.translate(-cam.x,-cam.y);
        
        for(var row in maze){
            for(var column in maze[row]){
                var tile = maze[row][column];
                var x = column*tileSize;
                var y = row*tileSize;
                   
                ctx.drawImage(
                    img,
                    tile * tileSrcSize,0,tileSrcSize,tileSrcSize,
                    x,y,tileSize,tileSize
                );
            }
        }
        
        //desenha o personagem
        ctx.drawImage(
            img,
            player.srcX,player.srcY,player.width,player.height,
            player.x,player.y,player.width,player.height
        );
        
        ctx.drawImage(curupira.img, curupira.x, curupira.y, curupira.width, curupira.height);
        
        // Desenhar animais
        for(var i = 0; i < animais.length; i++){
            var animal = animais[i];
            if(!animal.liberto) {
                ctx.drawImage(
                    animal.img,
                    animal.x,
                    animal.y,
                    animal.width,
                    animal.height
                );
                ctx.drawImage(gaiolaImg, animal.x -5 , animal.y - 5 , animal.width + 10 , animal.height + 10);
            }
        }
        
        ctx.restore();
    }
    
    const startScreen = document.getElementById("startScreen");
       
    startScreen.addEventListener("click", function(){
        gameStarted = true;
        startScreen.style.display = "none";
    });
 
    // Event listeners para botões do quiz
    var optionButtons = document.querySelectorAll('.quiz-option');
    if (optionButtons.length > 0) {
        optionButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                if (!quizActive || button.disabled) return;
                
                var index = parseInt(button.getAttribute('data-index'));
                processarRespostaQuiz(index);
            });
        });
    }
    
    // Tecla ESPAÇO para múltiplas funções
    window.addEventListener('keydown', function(e) {
        // Fechar quiz
        if (quizActive && e.code === 'Space') {
            var quizBox = document.getElementById("quizBox");
            if (quizBox) {
                quizBox.classList.add("hidden");
                quizActive = false;
                currentQuizAnimal = null;
                
                // Verificar derrota após fechar quiz
                setTimeout(verificarDerrota, 100);
            }
        }
        
        // Tela de vitória
        if (telaVitoriaAtiva && e.code === 'Space') {
            avancarFase();
        }
        
        // Tela de derrota
        if (telaDerrotaAtiva && e.code === 'Space') {
            reiniciarJogo();
        }
    }, false);
 
    function loop(){
        if(!gameStarted){
            requestAnimationFrame(loop);
            return;
        }
        update();
        render();
        requestAnimationFrame(loop,cnv);
    }
       
}());