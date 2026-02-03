(function(){
    'use strict';

    // ============================================
    // CONFIGURAÇÕES E CONSTANTES
    // ============================================
    const Config = {
        TILE_SIZE: 64,
        TILE_SRC_SIZE: 96,
        PLAYER_SPEED: 6,
        
        KEYS: {
            LEFT: 37,
            UP: 38, 
            RIGHT: 39,
            DOWN: 40
        },
        
        FASES: {
            1: {
                tipo: "animais",
                animaisParaPassar: 5,
                totalAnimais: 7,
                dificuldade: "Fácil"
            },
            2: {
                tipo: "fogo",
                fogosParaApagar: 3,
                totalFogos: 3,
                dificuldade: "Médio"
            }
        },
        
        PLAYER: {
            WIDTH: 24,
            HEIGHT: 32
        }
    };

    // ============================================
    // CLASSE BASE ENTITY
    // ============================================
    class Entity {
        constructor(game, x, y, width, height, imgSrc) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.isActive = true;
            
            if (imgSrc) {
                this.img = new Image();
                this.img.src = imgSrc;
            }
        }
        
        render(ctx) {
            if (this.img && this.img.complete && this.isActive) {
                ctx.drawImage(
                    this.img,
                    this.x, this.y, this.width, this.height
                );
            }
        }
        
        update() {
            // Método para ser sobrescrito
        }
    }

    // ============================================
    // CLASSE PLAYER
    // ============================================
    class Player {
        constructor(game, x, y) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.width = Config.PLAYER.WIDTH;
            this.height = Config.PLAYER.HEIGHT;
            this.speed = Config.PLAYER_SPEED;
            
            // Animações
            this.srcX = 0;
            this.srcY = Config.TILE_SRC_SIZE;
            this.animCount = 0;
            
            // Controles
            this.moving = {
                left: false,
                right: false,
                up: false,
                down: false
            };
        }
        
        handleKeyDown(e) {
            switch(e.keyCode) {
                case Config.KEYS.LEFT:
                    this.moving.left = true;
                    break;
                case Config.KEYS.UP:
                    this.moving.up = true;
                    break;
                case Config.KEYS.RIGHT:
                    this.moving.right = true;
                    break;
                case Config.KEYS.DOWN:
                    this.moving.down = true;
                    break;
            }
        }
        
        handleKeyUp(e) {
            switch(e.keyCode) {
                case Config.KEYS.LEFT:
                    this.moving.left = false;
                    break;
                case Config.KEYS.UP:
                    this.moving.up = false;
                    break;
                case Config.KEYS.RIGHT:
                    this.moving.right = false;
                    break;
                case Config.KEYS.DOWN:
                    this.moving.down = false;
                    break;
            }
        }
        
        update() {
            if (this.game.quiz.isActive || this.game.gamePaused) return;
            
            // Movimento horizontal
            if (this.moving.left && !this.moving.right) {
                this.x -= this.speed;
                this.srcY = Config.TILE_SRC_SIZE + this.height * 2;
            } else if (this.moving.right && !this.moving.left) {
                this.x += this.speed;
                this.srcY = Config.TILE_SRC_SIZE + this.height * 3;
            }
            
            // Movimento vertical
            if (this.moving.up && !this.moving.down) {
                this.y -= this.speed;
                this.srcY = Config.TILE_SRC_SIZE + this.height * 1;
            } else if (this.moving.down && !this.moving.up) {
                this.y += this.speed;
                this.srcY = Config.TILE_SRC_SIZE + this.height * 0;
            }
            
            // Animação
            if (this.moving.left || this.moving.right || this.moving.up || this.moving.down) {
                this.animCount++;
                if (this.animCount >= 40) this.animCount = 0;
                this.srcX = Math.floor(this.animCount / 5) * this.width;
            } else {
                this.srcX = 0;
                this.animCount = 0;
            }
            
            // Verificar colisões com paredes
            this.checkWallCollisions();
            
            // Limitar ao mapa
            this.constrainToMap();
        }
        
        checkWallCollisions() {
            for (let wall of this.game.level.walls) {
                if (this.isCollidingWith(wall)) {
                    this.resolveCollision(wall);
                }
            }
        }
        
        isCollidingWith(other) {
            return (
                this.x < other.x + other.width &&
                this.x + this.width > other.x &&
                this.y < other.y + other.height &&
                this.y + this.height > other.y
            );
        }
        
        resolveCollision(wall) {
            // Cálculo simples de resolução de colisão
            const playerCenterX = this.x + this.width / 2;
            const playerCenterY = this.y + this.height / 2;
            const wallCenterX = wall.x + wall.width / 2;
            const wallCenterY = wall.y + wall.height / 2;
            
            const dx = playerCenterX - wallCenterX;
            const dy = playerCenterY - wallCenterY;
            
            const combinedHalfWidths = (this.width + wall.width) / 2;
            const combinedHalfHeights = (this.height + wall.height) / 2;
            
            if (Math.abs(dx) < combinedHalfWidths && Math.abs(dy) < combinedHalfHeights) {
                const overlapX = combinedHalfWidths - Math.abs(dx);
                const overlapY = combinedHalfHeights - Math.abs(dy);
                
                if (overlapX > overlapY) {
                    // Colisão vertical
                    if (dy > 0) {
                        this.y += overlapY;
                    } else {
                        this.y -= overlapY;
                    }
                } else {
                    // Colisão horizontal
                    if (dx > 0) {
                        this.x += overlapX;
                    } else {
                        this.x -= overlapX;
                    }
                }
            }
        }
        
        constrainToMap() {
            // Limitar player aos limites do mapa
            const mapWidth = this.game.level.width;
            const mapHeight = this.game.level.height;
            
            this.x = Math.max(0, Math.min(mapWidth - this.width, this.x));
            this.y = Math.max(0, Math.min(mapHeight - this.height, this.y));
        }
        
        resetPosition() {
            this.x = Config.TILE_SIZE + 2;
            this.y = Config.TILE_SIZE + 2;
        }
        
        render(ctx) {
            if (this.game.assets.tiles.complete) {
                ctx.drawImage(
                    this.game.assets.tiles,
                    this.srcX, this.srcY, this.width, this.height,
                    this.x, this.y, this.width, this.height
                );
            }
        }
    }

    // ============================================
    // CLASSE ANIMAL
    // ============================================
    class Animal extends Entity {
        constructor(game, x, y, type, question, correctAnswer, imgSrc) {
            super(game, x, y, 40, 40, imgSrc);
            this.type = type;
            this.question = question;
            this.correctAnswer = correctAnswer.toLowerCase();
            this.isFree = false;
            this.asked = false;
        }
        
        render(ctx) {
            if (!this.isFree && super.render(ctx)) {
                // Desenhar gaiola
                if (this.game.assets.cage.complete) {
                    ctx.drawImage(
                        this.game.assets.cage,
                        this.x - 5, this.y - 5, this.width + 10, this.height + 10
                    );
                }
            }
        }
    }

    // ============================================
    // CLASSE FOGO
    // ============================================
    class Fogo extends Entity {
        constructor(game, x, y, question, correctAnswer) {
            super(game, x, y, 32, 32, 'img/fogo.png');
            this.type = 'Fogo';
            this.question = question;
            this.correctAnswer = correctAnswer.toLowerCase();
            this.isExtinguished = false;
            this.asked = false;
            this.id = Math.random().toString(36).substr(2, 9);
        }
        
        render(ctx) {
            if (!this.isExtinguished && super.render(ctx)) {
                // Efeito de brilho
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/2, 20, 0, Math.PI * 2);
                const gradient = ctx.createRadialGradient(
                    this.x + this.width/2, this.y + this.height/2, 5,
                    this.x + this.width/2, this.y + this.height/2, 25
                );
                gradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
                gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        }
    }

    // ============================================
    // CLASSE CAMERA
    // ============================================
    class Camera {
        constructor(game) {
            this.game = game;
            this.x = 0;
            this.y = 0;
            this.width = game.WIDTH;
            this.height = game.HEIGHT;
        }
        
        get innerLeftBoundary() {
            return this.x + (this.width * 0.25);
        }
        
        get innerTopBoundary() {
            return this.y + (this.height * 0.25);
        }
        
        get innerRightBoundary() {
            return this.x + (this.width * 0.75);
        }
        
        get innerBottomBoundary() {
            return this.y + (this.height * 0.75);
        }
        
        update() {
            const player = this.game.player;
            
            // Seguir o jogador
            if (player.x < this.innerLeftBoundary) {
                this.x = player.x - (this.width * 0.25);
            }
            if (player.y < this.innerTopBoundary) {
                this.y = player.y - (this.height * 0.25);
            }
            if (player.x + player.width > this.innerRightBoundary) {
                this.x = player.x + player.width - (this.width * 0.75);
            }
            if (player.y + player.height > this.innerBottomBoundary) {
                this.y = player.y + player.height - (this.height * 0.75);
            }
            
            // Limitar câmera aos limites do mapa
            const mapWidth = this.game.level.width;
            const mapHeight = this.game.level.height;
            
            this.x = Math.max(0, Math.min(mapWidth - this.width, this.x));
            this.y = Math.max(0, Math.min(mapHeight - this.height, this.y));
        }
    }

    // ============================================
    // CLASSE WALL
    // ============================================
    class Wall {
        constructor(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        
        render(ctx, tilesImage) {
            if (tilesImage.complete) {
                // Desenhar tile de parede (usando o tile 1 da imagem)
                ctx.drawImage(
                    tilesImage,
                    1 * Config.TILE_SRC_SIZE, 0, Config.TILE_SRC_SIZE, Config.TILE_SRC_SIZE,
                    this.x, this.y, this.width, this.height
                );
            }
        }
    }

    // ============================================
    // CLASSE LEVEL (GERENCIADOR DE FASES)
    // ============================================
    class Level {
        constructor(game) {
            this.game = game;
            this.walls = [];
            this.maze = [];
            this.width = 0;
            this.height = 0;
            this.curupira = {
                x: 5 * Config.TILE_SIZE,
                y: 3 * Config.TILE_SIZE,
                width: 36,
                height: 42,
                img: new Image(),
                triggered: false
            };
            this.curupira.img.src = 'img/curupira.gif';
            
            this.loadPhase(1);
        }
        
        loadPhase(phaseNumber) {
            this.walls = [];
            this.curupira.triggered = false;
            
            if (phaseNumber === 1) {
                this.loadPhase1();
            } else if (phaseNumber === 2) {
                this.loadPhase2();
            }
            
            // Calcular dimensões do mapa
            this.width = this.maze[0].length * Config.TILE_SIZE;
            this.height = this.maze.length * Config.TILE_SIZE;
            
            // Criar paredes
            this.createWalls();
            
            // Posicionar Curupira
            if (phaseNumber === 1) {
                this.curupira.x = 5 * Config.TILE_SIZE;
                this.curupira.y = 3 * Config.TILE_SIZE;
            } else {
                this.curupira.x = 3 * Config.TILE_SIZE;
                this.curupira.y = 17 * Config.TILE_SIZE;
            }
        }
        
        loadPhase1() {
            // Labirinto fase 1
            this.maze = [
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
        }
        
        loadPhase2() {
            // Labirinto fase 2
            this.maze = [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0,1],
                [1,0,1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0,1],
                [1,0,1,0,1,1,1,0,1,0,1,0,1,1,1,1,0,1,0,1],
                [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
                [1,0,1,1,1,0,1,1,1,1,1,0,1,0,1,1,1,1,0,1],
                [1,0,1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,1,0,1],
                [1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1,0,1,0,1],
                [1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0,0,0,1],
                [1,0,1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1,1,1],
                [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
                [1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
                [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,0,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,1],
                [1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
                [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
            ];
        }
        
        createWalls() {
            this.walls = [];
            for (let row = 0; row < this.maze.length; row++) {
                for (let col = 0; col < this.maze[row].length; col++) {
                    if (this.maze[row][col] === 1) {
                        const wall = new Wall(
                            col * Config.TILE_SIZE,
                            row * Config.TILE_SIZE,
                            Config.TILE_SIZE,
                            Config.TILE_SIZE
                        );
                        this.walls.push(wall);
                    }
                }
            }
        }
        
        update() {
            // Verificar colisão com Curupira
            if (!this.curupira.triggered && this.game.player) {
                const player = this.game.player;
                if (this.isCollidingWithCurupira(player)) {
                    this.curupira.triggered = true;
                    this.game.ui.startDialog();
                }
            }
        }
        
        isCollidingWithCurupira(player) {
            return (
                player.x < this.curupira.x + this.curupira.width &&
                player.x + player.width > this.curupira.x &&
                player.y < this.curupira.y + this.curupira.height &&
                player.y + player.height > this.curupira.y
            );
        }
        
        render(ctx) {
            // Renderizar labirinto
            for (let row = 0; row < this.maze.length; row++) {
                for (let col = 0; col < this.maze[row].length; col++) {
                    const tile = this.maze[row][col];
                    const x = col * Config.TILE_SIZE;
                    const y = row * Config.TILE_SIZE;
                    
                    if (this.game.assets.tiles.complete) {
                        ctx.drawImage(
                            this.game.assets.tiles,
                            tile * Config.TILE_SRC_SIZE, 0, Config.TILE_SRC_SIZE, Config.TILE_SRC_SIZE,
                            x, y, Config.TILE_SIZE, Config.TILE_SIZE
                        );
                    }
                }
            }
            
            // Renderizar Curupira
            if (this.curupira.img.complete) {
                ctx.drawImage(
                    this.curupira.img,
                    this.curupira.x, this.curupira.y,
                    this.curupira.width, this.curupira.height
                );
            }
        }
        
        generateRandomPosition() {
            let validPosition = false;
            let attempts = 0;
            let x = 0, y = 0;
            
            while (!validPosition && attempts < 100) {
                const col = Math.floor(Math.random() * this.maze[0].length);
                const row = Math.floor(Math.random() * this.maze.length);
                
                if (this.maze[row][col] === 0) {
                    x = col * Config.TILE_SIZE + Config.TILE_SIZE / 4;
                    y = row * Config.TILE_SIZE + Config.TILE_SIZE / 4;
                    
                    // Verificar distância do jogador
                    const player = this.game.player;
                    const distanceToPlayer = Math.sqrt(
                        Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2)
                    );
                    
                    // Verificar distância do Curupira
                    const distanceToCurupira = Math.sqrt(
                        Math.pow(x - this.curupira.x, 2) + Math.pow(y - this.curupira.y, 2)
                    );
                    
                    // Verificar colisão com paredes
                    let wallCollision = false;
                    for (let wall of this.walls) {
                        if (x < wall.x + wall.width &&
                            x + 32 > wall.x &&
                            y < wall.y + wall.height &&
                            y + 32 > wall.y) {
                            wallCollision = true;
                            break;
                        }
                    }
                    
                    if (distanceToPlayer > 200 &&
                        distanceToCurupira > 150 &&
                        !wallCollision &&
                        x > Config.TILE_SIZE && x < this.width - Config.TILE_SIZE &&
                        y > Config.TILE_SIZE && y < this.height - Config.TILE_SIZE) {
                        validPosition = true;
                    }
                }
                attempts++;
            }
            
            return { x, y };
        }
    }

    // ============================================
    // CLASSE QUIZ
    // ============================================
    class Quiz {
        constructor(game) {
            this.game = game;
            this.isActive = false;
            this.currentAnimal = null;
            this.currentFire = null;
            this.options = [];
            
            // Banco de dados
            this.animalDatabase = this.createAnimalDatabase();
            this.fireDatabase = this.createFireDatabase();
            
            // Elementos da UI
            this.quizBox = document.getElementById("quizBox");
            this.quizText = document.getElementById("quizText");
            this.quizFeedback = document.getElementById("quizFeedback");
            this.quizNext = document.getElementById("quizNext");
            this.optionButtons = document.querySelectorAll('.quiz-option');
            
            this.setupEventListeners();
        }
        
        createAnimalDatabase() {
            return [
                {
                    imgSrc: 'img/arara.png',
                    tipo: 'Arara Vermelha',
                    pergunta: 'Qual é o papel crucial das araras na regeneração das florestas, relacionado à sua alimentação?',
                    respostaCorreta: 'dispersão de sementes'
                },
                {
                    imgSrc: 'img/arara2.png',
                    tipo: 'Arara Azul',
                    pergunta: 'Como o hábito das araras de pousar e "descascar" troncos de árvores mortas pode beneficiar outras espécies?',
                    respostaCorreta: 'cria abrigos para outras espécies'
                },
                {
                    imgSrc: 'img/onca.png',
                    tipo: 'Onça',
                    pergunta: 'Como a onça, como predador de topo, ajuda a manter o equilíbrio das populações de herbívoros (como capivaras e veados)?',
                    respostaCorreta: 'controle populacional'
                },
                {
                    imgSrc: 'img/tucanin.png',
                    tipo: 'Tucano',
                    pergunta: 'Por que o tucano é um dos dispersores de sementes mais importantes das florestas tropicais, especialmente para árvores de grande porte?',
                    respostaCorreta: 'engole sementes grandes inteiras'
                },
                {
                    imgSrc: 'img/macaco.png',
                    tipo: 'Macaco',
                    pergunta: 'Qual é a importância dos macacos como jardineiros da floresta?',
                    respostaCorreta: 'plantam árvores através das fezes'
                },
                {
                    imgSrc: 'img/raposa.png',
                    tipo: 'Raposa',
                    pergunta: 'Como o hábito alimentar onívoro e oportunista da raposa ajuda no controle de pragas em ecossistemas agrícolas e naturais?',
                    respostaCorreta: 'come roedores e insetos'
                },
                {
                    imgSrc: 'img/leao.png',
                    tipo: 'Leão',
                    pergunta: 'Como a caça cooperativa dos leões remove indivíduos doentes ou mais fracos das manadas de herbívoros, fortalecendo as populações de presas?',
                    respostaCorreta: 'seleção natural'
                }
            ];
        }
        
        createFireDatabase() {
            return [
                {
                    pergunta: 'Qual é o principal impacto do fogo na biodiversidade da floresta?',
                    respostaCorreta: 'morte de espécies animais e vegetais'
                },
                {
                    pergunta: 'Como o fogo afeta a qualidade do solo na floresta?',
                    respostaCorreta: 'destrói nutrientes e mata microorganismos'
                },
                {
                    pergunta: 'Qual é o efeito do fogo na capacidade da floresta de reter água?',
                    respostaCorreta: 'reduz a infiltração e causa erosão'
                },
                {
                    pergunta: 'Como o fogo prejudica a regeneração natural da floresta?',
                    respostaCorreta: 'destrói sementes e mudas jovens'
                },
                {
                    pergunta: 'Qual é o impacto do fogo na emissão de gases do efeito estufa?',
                    respostaCorreta: 'libera carbono armazenado na vegetação'
                }
            ];
        }
        
        setupEventListeners() {
            // Event listeners para botões de opção
            this.optionButtons.forEach((button, index) => {
                button.addEventListener('click', () => {
                    if (!this.isActive || button.disabled) return;
                    this.processAnswer(index);
                });
            });
        }
        
        startAnimalQuiz(animal) {
            if (this.isActive || this.game.gamePaused) return;
            
            this.isActive = true;
            this.currentAnimal = animal;
            this.currentFire = null;
            
            animal.asked = true;
            this.game.player.moving = { left: false, right: false, up: false, down: false };
            
            // Configurar UI do quiz
            this.quizText.textContent = `${animal.type} pergunta:\n\n${animal.question}`;
            this.quizFeedback.textContent = "";
            this.quizFeedback.className = "";
            this.quizNext.textContent = "Clique em uma opção para responder";
            
            // Gerar opções
            this.options = this.generateOptions(animal.correctAnswer, 'animal');
            
            // Configurar botões
            this.optionButtons.forEach((button, index) => {
                if (index < this.options.length) {
                    button.textContent = this.options[index];
                    button.classList.remove('correct', 'incorrect', 'disabled');
                    button.disabled = false;
                    button.style.display = 'block';
                } else {
                    button.style.display = 'none';
                }
            });
            
            this.quizBox.classList.remove('hidden');
        }
        
        startFireQuiz(fire) {
            if (this.isActive || this.game.gamePaused) return;
            
            this.isActive = true;
            this.currentFire = fire;
            this.currentAnimal = null;
            
            fire.asked = true;
            this.game.player.moving = { left: false, right: false, up: false, down: false };
            
            // Configurar UI do quiz
            this.quizText.textContent = `🔥 Foco de Incêndio!\n\n${fire.question}`;
            this.quizFeedback.textContent = "";
            this.quizFeedback.className = "";
            this.quizNext.textContent = "Escolha a resposta correta para apagar o fogo!";
            
            // Gerar opções
            this.options = this.generateOptions(fire.correctAnswer, 'fogo');
            
            // Configurar botões
            this.optionButtons.forEach((button, index) => {
                if (index < this.options.length) {
                    button.textContent = this.options[index];
                    button.classList.remove('correct', 'incorrect', 'disabled');
                    button.disabled = false;
                    button.style.display = 'block';
                } else {
                    button.style.display = 'none';
                }
            });
            
            this.quizBox.classList.remove('hidden');
        }
        
        generateOptions(correctAnswer, type) {
            if (type === 'animal') {
                const incorrectAnswers = {
                    'arara': ['polinização de flores', 'controle de insetos', 'limpeza do solo', 'construção de ninhos'],
                    'onça': ['dispersão de sementes', 'polinização', 'fertilização do solo', 'controle de plantas'],
                    'tucano': ['polinização manual', 'controle de pragas', 'fertilização natural', 'limpeza de frutas'],
                    'macaco': ['controle de predadores', 'polinização noturna', 'dispersão de água', 'proteção do solo'],
                    'raposa': ['polinização cruzada', 'dispersão de sementes', 'fertilização orgânica', 'controle de plantas'],
                    'leão': ['dispersão genética', 'polinização indireta', 'fertilização natural', 'controle vegetal']
                };
                
                if (!this.currentAnimal) return [correctAnswer, "Opção 1", "Opção 2", "Opção 3"];
                
                const animalType = this.currentAnimal.type.toLowerCase().split(' ')[0];
                const incorrect = incorrectAnswers[animalType] || [
                    'polinização de flores',
                    'controle de insetos',
                    'limpeza do solo',
                    'fertilização natural'
                ];
                
                const selectedIncorrect = [...incorrect]
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 3);
                
                const allOptions = [correctAnswer, ...selectedIncorrect];
                return allOptions.sort(() => Math.random() - 0.5);
                
            } else if (type === 'fogo') {
                const incorrectAnswers = {
                    'biodiversidade': ['aumenta a variedade de espécies', 'melhora a competição entre animais', 'cria novos habitats', 'estimula migração'],
                    'solo': ['aumenta a fertilidade natural', 'acelera decomposição', 'cria cinzas nutritivas', 'melhora drenagem'],
                    'água': ['aumenta absorção no solo', 'melhora qualidade da água', 'cria novos riachos', 'aumenta umidade'],
                    'regeneração': ['estimula crescimento rápido', 'prepara solo para plantio', 'remove árvores velhas', 'aumenta disponibilidade de luz'],
                    'carbono': ['absorve mais CO2', 'melhora qualidade do ar', 'cria sumidouros de carbono', 'reduz metano']
                };
                
                let fireType = '';
                if (correctAnswer.includes('espécies') || correctAnswer.includes('biodiversidade')) {
                    fireType = 'biodiversidade';
                } else if (correctAnswer.includes('solo') || correctAnswer.includes('nutrientes')) {
                    fireType = 'solo';
                } else if (correctAnswer.includes('água') || correctAnswer.includes('erosão')) {
                    fireType = 'água';
                } else if (correctAnswer.includes('regeneração') || correctAnswer.includes('sementes')) {
                    fireType = 'regeneração';
                } else if (correctAnswer.includes('carbono') || correctAnswer.includes('gases')) {
                    fireType = 'carbono';
                } else {
                    fireType = 'biodiversidade';
                }
                
                const incorrect = incorrectAnswers[fireType] || [
                    'aumenta biodiversidade',
                    'melhora qualidade do ar',
                    'renova a vegetação',
                    'controla pragas'
                ];
                
                const selectedIncorrect = [...incorrect]
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 3);
                
                const allOptions = [correctAnswer, ...selectedIncorrect];
                return allOptions.sort(() => Math.random() - 0.5);
            }
            
            return [correctAnswer, "Opção 1", "Opção 2", "Opção 3"];
        }
        
        processAnswer(optionIndex) {
            if (!this.isActive || (!this.currentAnimal && !this.currentFire)) return;
            
            const selectedAnswer = this.options[optionIndex];
            let correctAnswer, type;
            
            if (this.currentAnimal) {
                correctAnswer = this.currentAnimal.correctAnswer;
                type = 'animal';
            } else if (this.currentFire) {
                correctAnswer = this.currentFire.correctAnswer;
                type = 'fogo';
            }
            
            // Desabilitar todos os botões
            this.optionButtons.forEach(button => {
                button.disabled = true;
                button.classList.add('disabled');
            });
            
            if (selectedAnswer === correctAnswer) {
                // Resposta correta
                this.optionButtons[optionIndex].classList.add('correct');
                
                if (type === 'animal') {
                    this.quizFeedback.textContent = "✓ Correto! Você libertou o animal!";
                    this.currentAnimal.isFree = true;
                    this.game.animalsFreed++;
                    this.game.ui.updateAnimalCounter();
                    this.checkAnimalVictory();
                } else if (type === 'fogo') {
                    this.quizFeedback.textContent = "✓ Correto! Você apagou o fogo!";
                    this.currentFire.isExtinguished = true;
                    this.game.firesExtinguished++;
                    this.game.ui.updateFireCounter();
                    this.checkFireVictory();
                }
                
                this.quizFeedback.className = "correct";
                this.quizNext.textContent = "Pressione ESPAÇO para continuar";
            } else {
                // Resposta incorreta
                this.optionButtons[optionIndex].classList.add('incorrect');
                
                // Mostrar resposta correta
                this.optionButtons.forEach((button, index) => {
                    if (this.options[index] === correctAnswer) {
                        button.classList.add('correct');
                    }
                });
                
                if (type === 'animal') {
                    this.quizFeedback.textContent = "✗ Resposta incorreta! O animal continua preso.";
                    setTimeout(() => this.checkAnimalDefeat(), 100);
                } else if (type === 'fogo') {
                    this.quizFeedback.textContent = "✗ Resposta incorreta! O fogo continua queimando!";
                    setTimeout(() => this.checkFireDefeat(), 100);
                }
                
                this.quizFeedback.className = "incorrect";
                this.quizNext.textContent = "Pressione ESPAÇO para continuar";
            }
        }
        
        checkAnimalVictory() {
            if (this.game.currentPhase !== 1) return;
            
            const remainingAnimals = this.game.animals.filter(a => !a.isFree && !a.asked).length;
            
            if (remainingAnimals === 0 && 
                this.game.animalsFreed >= Config.FASES[1].animaisParaPassar &&
                !this.game.ui.isVictoryActive && 
                !this.game.ui.isDefeatActive && 
                !this.game.ui.isCreditsActive) {
                this.game.ui.showVictoryScreen();
            }
        }
        
        checkFireVictory() {
            if (this.game.currentPhase !== 2) return;
            
            const remainingFires = this.game.fires.filter(f => !f.isExtinguished && !f.asked).length;
            
            if (remainingFires === 0 && 
                this.game.firesExtinguished >= Config.FASES[2].fogosParaApagar &&
                !this.game.ui.isVictoryActive && 
                !this.game.ui.isDefeatActive && 
                !this.game.ui.isCreditsActive) {
                this.game.ui.showCreditsScreen();
            }
        }
        
        checkAnimalDefeat() {
            if (this.game.currentPhase !== 1) return;
            
            const remainingAnimals = this.game.animals.filter(a => !a.isFree && !a.asked).length;
            
            if (remainingAnimals === 0 && 
                this.game.animalsFreed < Config.FASES[1].animaisParaPassar &&
                !this.game.ui.isVictoryActive && 
                !this.game.ui.isDefeatActive && 
                !this.game.ui.isCreditsActive) {
                this.game.ui.showDefeatScreen();
            }
        }
        
        checkFireDefeat() {
            if (this.game.currentPhase !== 2) return;
            
            const remainingFires = this.game.fires.filter(f => !f.isExtinguished && !f.asked).length;
            
            if (remainingFires === 0 && 
                this.game.firesExtinguished < Config.FASES[2].fogosParaApagar &&
                !this.game.ui.isVictoryActive && 
                !this.game.ui.isDefeatActive && 
                !this.game.ui.isCreditsActive) {
                this.game.ui.showDefeatScreen();
            }
        }
        
        close() {
            this.isActive = false;
            this.currentAnimal = null;
            this.currentFire = null;
            if (this.quizBox) {
                this.quizBox.classList.add('hidden');
            }
        }
        
        update() {
            // Atualizações periódicas do quiz (se necessário)
        }
    }

    // ============================================
    // CLASSE UI (INTERFACE DO USUÁRIO)
    // ============================================
    class UI {
        constructor(game) {
            this.game = game;
            
            // Elementos da UI
            this.startScreen = document.getElementById("startScreen");
            this.dialogBox = document.getElementById("dialogBox");
            this.dialogText = document.getElementById("dialogText");
            this.victoryScreen = document.getElementById("vitoriaScreen");
            this.victoryText = document.getElementById("vitoriaText");
            this.victorySubtext = document.getElementById("vitoriaSubtext");
            this.defeatScreen = document.getElementById("derrotaScreen");
            this.defeatText = document.getElementById("derrotaText");
            this.defeatSubtext = document.getElementById("derrotaSubtext");
            this.creditsScreen = document.getElementById("creditosScreen");
            this.creditsTitle = document.getElementById("creditosTitle");
            this.creditsDevelopers = document.getElementById("creditosDesenvolvedores");
            this.creditsThanks = document.getElementById("creditosAgradecimentos");
            this.creditsMessage = document.getElementById("creditosMensagem");
            
            // Contadores
            this.animalCounter = document.getElementById("contadorAnimais");
            this.animalCount = document.getElementById("contador");
            this.animalTotal = document.getElementById("total");
            this.fireCounter = document.getElementById("fogoContador");
            this.fireCount = document.getElementById("fogosApagados");
            this.fireTotal = document.getElementById("totalFogos");
            
            // Estado
            this.isDialogActive = false;
            this.isVictoryActive = false;
            this.isDefeatActive = false;
            this.isCreditsActive = false;
            this.dialogIndex = 0;
            
            // Diálogos
            this.phase1Dialogs = [
                "Curupira: Anhangá! Finalmente você despertou! A floresta corre perigo!",
                "Anhangá: O que aconteceu?",
                "Curupira: Os Caçadores vieram e prenderam vários animais, você precisa liberta-los antes que seja tarde demais!",
                "Anhangá: E onde os animais estão?",
                "Curupira: Eles estão presos pela floresta, sua missão é acha-los e libertá-los, acertando as respostas das perguntas.",
                "Curupira: Corre! A floresta clama por socorro!"
            ];
            
            this.phase2Dialogs = [
                "Curupira: Anhangá! A floresta agora enfrenta um novo perigo!",
                "Anhangá: O que está acontecendo agora?",
                "Curupira: Incêndios estão se espalhando pela floresta! Você precisa apagá-los!",
                "Anhangá: Como posso ajudar?",
                "Curupira: Encontre os focos de incêndio e responda corretamente sobre os danos do fogo para apagá-los!",
                "Curupira: Rápido! A floresta está queimando!"
            ];
        }
        
        hideStartScreen() {
            if (this.startScreen) {
                this.startScreen.style.display = 'none';
            }
        }
        
        startDialog() {
            this.isDialogActive = true;
            this.dialogIndex = 0;
            if (this.dialogBox) {
                this.dialogBox.classList.remove("hidden");
            }
            
            if (this.game.currentPhase === 1) {
                if (this.dialogText) {
                    this.dialogText.textContent = this.phase1Dialogs[this.dialogIndex];
                }
                this.initializePhase1();
            } else if (this.game.currentPhase === 2) {
                if (this.dialogText) {
                    this.dialogText.textContent = this.phase2Dialogs[this.dialogIndex];
                }
                this.initializePhase2();
            }
        }
        
        advanceDialog() {
            if (!this.isDialogActive) return;
            
            this.dialogIndex++;
            const maxDialog = this.game.currentPhase === 1 ? 
                this.phase1Dialogs.length : this.phase2Dialogs.length;
            
            if (this.dialogIndex >= maxDialog) {
                if (this.dialogBox) {
                    this.dialogBox.classList.add("hidden");
                }
                this.isDialogActive = false;
            } else {
                if (this.game.currentPhase === 1) {
                    if (this.dialogText) {
                        this.dialogText.textContent = this.phase1Dialogs[this.dialogIndex];
                    }
                } else if (this.game.currentPhase === 2) {
                    if (this.dialogText) {
                        this.dialogText.textContent = this.phase2Dialogs[this.dialogIndex];
                    }
                }
            }
        }
        
        initializePhase1() {
            // Limpar animais antigos
            this.game.animals = [];
            
            // Selecionar animais aleatórios do banco
            const availableAnimals = [...this.game.quiz.animalDatabase];
            availableAnimals.sort(() => Math.random() - 0.5);
            
            const totalAnimals = Math.min(Config.FASES[1].totalAnimais, availableAnimals.length);
            
            // Criar e posicionar animais
            for (let i = 0; i < totalAnimals; i++) {
                const animalData = availableAnimals[i];
                const position = this.game.level.generateRandomPosition();
                
                const animal = new Animal(
                    this.game,
                    position.x,
                    position.y,
                    animalData.tipo,
                    animalData.pergunta,
                    animalData.respostaCorreta,
                    animalData.imgSrc
                );
                
                this.game.animals.push(animal);
            }
            
            // Atualizar contador
            this.updateAnimalCounter();
            
            // Mostrar contador
            if (this.animalCounter) {
                this.animalCounter.classList.remove("hidden");
            }
            if (this.fireCounter) {
                this.fireCounter.classList.add("hidden");
            }
            
            console.log(`${this.game.animals.length} animais posicionados no mapa`);
        }
        
        initializePhase2() {
            // Limpar fogos antigos
            this.game.fires = [];
            
            // Selecionar fogos aleatórios do banco
            const availableFires = [...this.game.quiz.fireDatabase];
            availableFires.sort(() => Math.random() - 0.5);
            
            const totalFires = Math.min(Config.FASES[2].fogosParaApagar, availableFires.length);
            
            // Criar e posicionar fogos
            for (let i = 0; i < totalFires; i++) {
                const fireData = availableFires[i];
                const position = this.game.level.generateRandomPosition();
                
                const fire = new Fogo(
                    this.game,
                    position.x,
                    position.y,
                    fireData.pergunta,
                    fireData.respostaCorreta
                );
                
                this.game.fires.push(fire);
            }
            
            // Atualizar contador de fogos
            this.updateFireCounter();
            
            // Mostrar contador de fogos
            if (this.animalCounter) {
                this.animalCounter.classList.add("hidden");
            }
            if (this.fireCounter) {
                this.fireCounter.classList.remove("hidden");
            }
            
            console.log(`${this.game.fires.length} focos de incêndio posicionados no mapa`);
        }
        
        updateAnimalCounter() {
            if (this.animalCount && this.animalTotal) {
                this.animalCount.textContent = this.game.animalsFreed;
                this.animalTotal.textContent = Config.FASES[1].totalAnimais;
            }
        }
        
        updateFireCounter() {
            if (this.fireCount && this.fireTotal) {
                this.fireCount.textContent = this.game.firesExtinguished;
                this.fireTotal.textContent = Config.FASES[2].fogosParaApagar;
            }
        }
        
        showVictoryScreen() {
            this.isVictoryActive = true;
            this.game.gamePaused = true;
            
            if (this.victoryScreen && this.victoryText && this.victorySubtext) {
                if (this.game.currentPhase === 1) {
                    this.victoryText.textContent = `🎉 Parabéns! Você libertou ${this.game.animalsFreed} de ${Config.FASES[1].totalAnimais} animais!`;
                    this.victorySubtext.textContent = "A floresta agradece! Agora, um novo desafio se inicia...";
                }
                this.victoryScreen.classList.remove("hidden");
            }
            
            // Configurar para avançar de fase após vitória
            this.victoryKeyHandler = (e) => {
                if (e.code === 'Space' && this.isVictoryActive) {
                    this.hideVictoryScreen();
                    this.game.nextPhase();
                    window.removeEventListener('keydown', this.victoryKeyHandler);
                }
            };
            
            window.addEventListener('keydown', this.victoryKeyHandler);
        }
        
        hideVictoryScreen() {
            this.isVictoryActive = false;
            this.game.gamePaused = false;
            
            if (this.victoryScreen) {
                this.victoryScreen.classList.add("hidden");
            }
        }
        
        showDefeatScreen() {
            this.isDefeatActive = true;
            this.game.gamePaused = true;
            
            if (this.defeatScreen && this.defeatText && this.defeatSubtext) {
                if (this.game.currentPhase === 1) {
                    this.defeatText.textContent = `😔 Você libertou apenas ${this.game.animalsFreed} de ${Config.FASES[1].animaisParaPassar} animais necessários`;
                    this.defeatSubtext.textContent = "Tente salvar mais animais na próxima vez!";
                } else if (this.game.currentPhase === 2) {
                    this.defeatText.textContent = `🔥 Você apagou apenas ${this.game.firesExtinguished} de ${Config.FASES[2].fogosParaApagar} focos de incêndio necessários para zerar o jogo!`;
                    this.defeatSubtext.textContent = "A floresta precisa da sua ajuda!";
                }
                this.defeatScreen.classList.remove("hidden");
            }
            
            // Configurar para reiniciar após derrota
            this.defeatKeyHandler = (e) => {
                if (e.code === 'Space' && this.isDefeatActive) {
                    this.hideDefeatScreen();
                    this.restartGame();
                    window.removeEventListener('keydown', this.defeatKeyHandler);
                }
            };
            
            window.addEventListener('keydown', this.defeatKeyHandler);
        }
        
        hideDefeatScreen() {
            this.isDefeatActive = false;
            this.game.gamePaused = false;
            
            if (this.defeatScreen) {
                this.defeatScreen.classList.add("hidden");
            }
        }
        
        showCreditsScreen() {
            this.isCreditsActive = true;
            this.game.gamePaused = true;
            
            // Fechar quiz se estiver aberto
            if (this.game.quiz.isActive) {
                this.game.quiz.close();
            }
            
            if (this.creditsScreen && this.creditsTitle) {
                this.creditsTitle.textContent = "🎉 MISSÃO CUMPRIDA! 🎉";
                this.creditsDevelopers.innerHTML = `
                    <h3>Desenvolvido por:</h3>
                    <p><strong>Murilo Rodrigues</strong></p>
                    <p><strong>Frederico Lucas</strong></p>
                `;
                this.creditsThanks.innerHTML = `
                    <h3>Agradecimentos especiais:</h3>
                    <p>Às Inteligências Artificiais que nos ajudaram a desenvolver este grande projeto!</p>
                    <p style="font-style: italic;">"A tecnologia deve servir para proteger a natureza"</p>
                `;
                this.creditsMessage.innerHTML = `
                    <h3>A floresta agradece!</h3>
                    <p>Obrigado por aprender sobre a importância da preservação ambiental.</p>
                    <p>Sua jornada ajudou a salvar inúmeras vidas e proteger nosso ecossistema.</p>
                    <p style="margin-top: 20px; font-size: 1.2em;">Pressione ESPAÇO para reiniciar o jogo</p>
                `;
                this.creditsScreen.classList.remove("hidden");
            }
            
            // Configurar para reiniciar após créditos
            this.creditsKeyHandler = (e) => {
                if (e.code === 'Space' && this.isCreditsActive) {
                    this.hideCreditsScreen();
                    this.restartGame();
                    window.removeEventListener('keydown', this.creditsKeyHandler);
                }
            };
            
            window.addEventListener('keydown', this.creditsKeyHandler);
        }
        
        hideCreditsScreen() {
            this.isCreditsActive = false;
            this.game.gamePaused = false;
            
            if (this.creditsScreen) {
                this.creditsScreen.classList.add("hidden");
            }
        }
        
        restartGame() {
            // Reiniciar jogo completamente
            this.game.currentPhase = 1;
            this.game.level.loadPhase(1);
            this.game.resetForNewPhase();
            
            // Resetar UI
            this.isVictoryActive = false;
            this.isDefeatActive = false;
            this.isCreditsActive = false;
            this.isDialogActive = false;
            this.dialogIndex = 0;
            
            // Esconder todas as telas
            if (this.victoryScreen) this.victoryScreen.classList.add("hidden");
            if (this.defeatScreen) this.defeatScreen.classList.add("hidden");
            if (this.creditsScreen) this.creditsScreen.classList.add("hidden");
            if (this.dialogBox) this.dialogBox.classList.add("hidden");
            
            // Resetar contadores
            this.updateAnimalCounter();
            this.updateFireCounter();
            
            console.log("Jogo reiniciado");
        }
    }

    // ============================================
    // CLASSE PRINCIPAL DO JOGO
    // ============================================
    class Game {
        constructor(canvas) {
            // Referência ao canvas
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            
            // Dimensões
            this.WIDTH = canvas.width;
            this.HEIGHT = canvas.height;
            
            // Estado do jogo - COMEÇA DIRETAMENTE COMO true
            this.gameStarted = true; // Alterado para true para iniciar automaticamente
            this.gamePaused = false;
            this.currentPhase = 1;
            
            // Instanciar componentes
            this.player = null;
            this.camera = null;
            this.level = null;
            this.quiz = null;
            this.ui = null;
            
            // Arrays de entidades
            this.animals = [];
            this.fires = [];
            this.walls = [];
            
            // Contadores
            this.animalsFreed = 0;
            this.firesExtinguished = 0;
            
            // Assets
            this.assets = {};
            
            console.log('Game constructor chamado - Jogo iniciará automaticamente');
        }
        
        init() {
            console.log('Inicializando jogo automaticamente...');
            
            try {
                // Inicializar componentes
                this.player = new Player(this, Config.TILE_SIZE + 2, Config.TILE_SIZE + 2);
                this.camera = new Camera(this);
                this.level = new Level(this);
                this.quiz = new Quiz(this);
                this.ui = new UI(this);
                
                // Esconder tela inicial automaticamente
                if (this.ui && this.ui.startScreen) {
                    this.ui.hideStartScreen();
                }
                
                // Configurar eventos de teclado (apenas)
                this.setupEventListeners();
                
                // Carregar assets
                this.loadAssets();
                
                console.log('Jogo inicializado automaticamente com sucesso');
            } catch (error) {
                console.error('Erro na inicialização:', error);
            }
        }
        
        setupEventListeners() {
            console.log('Configurando event listeners de teclado...');
            
            // Apenas eventos de teclado (removido evento de clique)
            window.addEventListener('keydown', (e) => {
                this.handleKeyDown(e);
            });
            window.addEventListener('keyup', (e) => {
                this.handleKeyUp(e);
            });
            
            console.log('Event listeners de teclado configurados');
        }
        
        handleKeyDown(e) {
            // Delegar para o player
            if (this.player) {
                this.player.handleKeyDown(e);
            }
            
            // Outras teclas específicas do jogo
            switch(e.key) {
                case ' ':
                case 'Spacebar':
                    if (this.quiz && this.quiz.isActive) {
                        this.quiz.close();
                    }
                    break;
                case 'Enter':
                    if (this.ui && this.ui.isDialogActive) {
                        this.ui.advanceDialog();
                    }
                    break;
            }
        }
        
        handleKeyUp(e) {
            // Delegar para o player
            if (this.player) {
                this.player.handleKeyUp(e);
            }
        }
        
        loadAssets() {
            console.log('Carregando assets...');
            
            // Carregar imagens
            this.assets = {
                tiles: this.loadImage('img/img.png'),
                curupira: this.loadImage('img/curupira.gif'),
                cage: this.loadImage('img/gaiola.png'),
                fire: this.loadImage('img/fogo.png')
            };
            
            // Quando as tiles carregarem, iniciar o loop
            this.assets.tiles.onload = () => {
                console.log('Assets carregados. Iniciando game loop...');
                this.startGameLoop();
            };
            
            this.assets.tiles.onerror = () => {
                console.error('Erro ao carregar tiles');
            };
        }
        
        loadImage(src) {
            const img = new Image();
            img.src = src;
            return img;
        }
        
        startGameLoop() {
            console.log('Iniciando game loop...');
            
            const loop = () => {
                if (this.gameStarted && !this.gamePaused) {
                    this.update();
                    this.render();
                }
                requestAnimationFrame(loop.bind(this));
            };
            loop();
        }
        
        update() {
            // Atualizar componentes
            if (this.player) this.player.update();
            if (this.camera) this.camera.update();
            if (this.level) this.level.update();
            if (this.quiz) this.quiz.update();
            
            // Verificar colisões
            this.checkCollisions();
        }
        
        checkCollisions() {
            // Verificar colisão com animais
            if (this.currentPhase === 1) {
                for (let animal of this.animals) {
                    if (!animal.isFree && !animal.asked && 
                        this.isColliding(this.player, animal)) {
                        this.quiz.startAnimalQuiz(animal);
                        break;
                    }
                }
            }
            
            // Verificar colisão com fogos (fase 2)
            if (this.currentPhase === 2) {
                for (let fire of this.fires) {
                    if (!fire.isExtinguished && !fire.asked &&
                        this.isColliding(this.player, fire)) {
                        this.quiz.startFireQuiz(fire);
                        break;
                    }
                }
            }
        }
        
        isColliding(objA, objB) {
            return (
                objA.x < objB.x + objB.width &&
                objA.x + objA.width > objB.x &&
                objA.y < objB.y + objB.height &&
                objA.y + objA.height > objB.y
            );
        }
        
        render() {
            // Limpar canvas
            this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
            
            // Aplicar transformação da câmera
            this.ctx.save();
            this.ctx.translate(-this.camera.x, -this.camera.y);
            
            // Renderizar componentes
            if (this.level) this.level.render(this.ctx);
            if (this.player) this.player.render(this.ctx);
            
            // Renderizar entidades baseado na fase
            if (this.currentPhase === 1) {
                this.animals.forEach(animal => animal.render(this.ctx));
            } else if (this.currentPhase === 2) {
                this.fires.forEach(fire => fire.render(this.ctx));
            }
            
            this.ctx.restore();
        }
        
        // Métodos para gerenciar fase
        nextPhase() {
            this.currentPhase++;
            this.resetForNewPhase();
        }
        
        resetForNewPhase() {
            // Limpar arrays
            this.animals = [];
            this.fires = [];
            
            // Resetar contadores
            this.animalsFreed = 0;
            this.firesExtinguished = 0;
            
            // Resetar estado
            if (this.quiz) this.quiz.close();
            
            // Carregar novo nível
            if (this.level) this.level.loadPhase(this.currentPhase);
            
            // Reposicionar player
            if (this.player) this.player.resetPosition();
            
            console.log(`Fase ${this.currentPhase} iniciada`);
        }
    }

    // ============================================
    // INICIALIZAÇÃO DO JOGO
    // ============================================
    
    // Aguardar DOM estar pronto
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM carregado. Inicializando jogo AUTOMATICAMENTE...');
        
        // Obter referência ao canvas
        const canvas = document.querySelector("canvas");
        if (!canvas) {
            console.error('Canvas não encontrado!');
            return;
        }
        
        try {
            // Criar instância do jogo
            const game = new Game(canvas);
            
            // Chamar init imediatamente (sem delay)
            game.init();
            
            // Expor para debug (opcional)
            window.game = game;
            
            console.log('🎮 Jogo Floresta POO iniciado AUTOMATICAMENTE com sucesso!');
            
        } catch (error) {
            console.error('Erro ao inicializar jogo:', error);
        }
    });

})(); // FIM DA FUNÇÃO IIFE