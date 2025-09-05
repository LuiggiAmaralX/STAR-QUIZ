// --- CONFIGURAÇÃO E VERIFICAÇÃO INICIAL ---
const playerNickname = localStorage.getItem('playerNickname');
const currentRoomId = localStorage.getItem('currentRoomId');
if (!playerNickname || !currentRoomId) {
	showError('Dados da sessão não encontrados. Retornando ao lobby.', { title: 'Erro de Sessão' });
	setTimeout(() => {
		window.location.href = 'lobby.html';
	}, 2000);
}
document.getElementById('lobby-room-code').textContent = currentRoomId;

// --- INICIALIZAÇÃO DO FIREBASE ---
const firebaseConfig = {
	apiKey: 'AIzaSyAnTMGJcf0lsFMqB9A6R__PJ4g_D0xjS_4',
	authDomain: 'star-quiz-9c417.firebaseapp.com',
	databaseURL: 'https://star-quiz-9c417-default-rtdb.firebaseio.com',
	projectId: 'star-quiz-9c417',
	storageBucket: 'star-quiz-9c417.firebasestorage.app',
	messagingSenderId: '377871658085',
	appId: '1:377871658085:web:769cfd88ecc841d11b2a8c',
	measurementId: 'G-6RPJ0R2L9Z',
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// --- VARIÁVEIS E DADOS DO JOGO ---
const allScreens = {
	waiting: document.getElementById('waiting-lobby-screen'),
	category: document.getElementById('category-screen'),
	versus: document.getElementById('versus-screen'),
	quiz: document.getElementById('quiz-screen'),
	result: document.getElementById('result-screen'),
};
const playersList = document.getElementById('players-list');
const startGameButton = document.getElementById('start-game-button');
const waitMessage = document.getElementById('wait-message');
const questionText = document.getElementById('question-text');
const answerButtonsContainer = document.getElementById('answer-buttons');
const playerScoreDisplay = document.getElementById('player-score');
const restartButton = document.getElementById('restart-button');
const leaderboardList = document.getElementById('leaderboard-list');
const timerDisplay = document.getElementById('timer');
const categoryCards = document.querySelectorAll('.category-card');

let roomQuestions = [];
let localIsHost = false;
let gameInProgress = false;
let questionTimer = null;
let activeTimerQuestionIndex = -1;

// O objeto de perguntas local foi REMOVIDO. Agora as perguntas vêm do Firebase.

// --- FUNÇÕES DO JOGO ---
function resetRoom(roomId) {
	const roomRef = database.ref(`rooms/${roomId}`);
	return roomRef.transaction((roomData) => {
		if (roomData) {
			if (roomData.players) {
				Object.keys(roomData.players).forEach((nickname) => {
					roomData.players[nickname].score = 0;
					delete roomData.players[nickname].questionsAnswered;
				});
			}
			roomData.status = 'waiting';
			delete roomData.questions;
			delete roomData.currentQuestionIndex;
			delete roomData.questionStartTime;
		}
		return roomData;
	});
}

function showScreen(screenToShow) {
	Object.values(allScreens).forEach((s) => s.classList.remove('active'));
	screenToShow.classList.add('active');
}

startGameButton.addEventListener('click', () => {
	// Reproduz som de clique
	if (typeof window.playSound === 'function') {
		window.playSound('click');
	}
	
	database.ref('rooms/' + currentRoomId).update({ status: 'selecting_category' });
});


/**
 * NOVA LÓGICA PARA SELECIONAR CATEGORIA E BUSCAR PERGUNTAS
 */
categoryCards.forEach((card) => {
    card.addEventListener('click', async () => {
        if (!localIsHost) return; // Apenas o host pode selecionar

        // Reproduz som de clique
        if (typeof window.playSound === 'function') {
            window.playSound('click');
        }

        // Mostra loading no card selecionado
        showCardLoading(card);
        
        // Mostra loading global
        showLoading('Carregando perguntas...', 'Preparando o quiz para você');

        // Mostra visualmente que a categoria foi selecionada
        categoryCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        const selectedCategory = card.dataset.category;
        // A partida terá 2 perguntas, como no código original. Mude o valor abaixo se precisar.
        const questionsPerMatch = 2; 

        try {
            // 1. Ler o total de perguntas da categoria no Firebase
            const totalRef = database.ref(`categories/categories/${selectedCategory}/totalQuestions`);
            const totalSnapshot = await totalRef.once('value');
            const totalQuestions = totalSnapshot.val();

            if (!totalQuestions) {
                hideCardLoading(card);
                hideLoading();
                showError(`Categoria "${selectedCategory}" não encontrada no banco de dados.`, { title: 'Categoria Não Encontrada' });
                return;
            }

            // 2. Sortear N números aleatórios e únicos
            const randomIds = new Set();
            while (randomIds.size < questionsPerMatch && randomIds.size < totalQuestions) {
                const randomId = Math.floor(Math.random() * totalQuestions) + 1;
                randomIds.add(`q${randomId}`);
            }

            // 3. Buscar no Firebase apenas as perguntas sorteadas
            const questionPromises = Array.from(randomIds).map(id => {
                return database.ref(`categories/categories/${selectedCategory}/questions/${id}`).once('value');
            });
            const questionSnapshots = await Promise.all(questionPromises);
            const questionsToSend = questionSnapshots.map(snap => snap.val()).filter(q => q); // Filtra nulos caso uma pergunta não exista

            if (questionsToSend.length < questionsPerMatch) {
                hideCardLoading(card);
                hideLoading();
                showError('Não foi possível carregar o número necessário de perguntas. Tente novamente.', { title: 'Erro ao Carregar Perguntas' });
                return;
            }
            
            // 4. Iniciar a partida com as perguntas buscadas
            const roomRef = database.ref('rooms/' + currentRoomId);
            const roomSnapshot = await roomRef.once('value');
            const roomData = roomSnapshot.val();
            
            if (roomData && roomData.players) {
                Object.keys(roomData.players).forEach((nickname) => {
                    roomData.players[nickname].questionsAnswered = 0;
                });
                
                await roomRef.update({
                    status: 'versus',
                    questions: questionsToSend,
                    currentQuestionIndex: 0,
                    questionStartTime: firebase.database.ServerValue.TIMESTAMP,
                    players: roomData.players,
                });
                
                hideCardLoading(card);
                hideLoading();
                showSuccess('Perguntas carregadas!', 'O jogo vai começar');
            }
        } catch (error) {
            console.error("Erro ao buscar perguntas:", error);
            hideCardLoading(card);
            hideLoading();
            showError("Ocorreu um erro ao carregar as perguntas da categoria. Verifique o console.", { title: 'Erro Interno' });
        }
    });
});


/**
 * FUNÇÃO ATUALIZADA para lidar com o novo formato de perguntas.
 * Agora usa 'options' e 'answer' em vez de 'answers'.
 */
function showQuestionContent(questionIndex) {
	const currentQuestion = roomQuestions[questionIndex];
	if (currentQuestion) {
		// Anima a pergunta
		if (typeof window.animateIn === 'function') {
			window.animateIn(questionText, 'fade-in');
		}
		
		questionText.textContent = currentQuestion.text;
		answerButtonsContainer.innerHTML = '';

		// Itera sobre as opções da pergunta
		currentQuestion.options.forEach((optionText, index) => {
			const button = document.createElement('button');
			button.textContent = optionText;
			button.classList.add('answer-button', 'answer-btn');

			// Verifica se o índice desta opção é o da resposta correta
			if (index === currentQuestion.answer) {
				button.dataset.correct = true;
			}

			button.addEventListener('click', selectAnswer);
			answerButtonsContainer.appendChild(button);
		});
		
		// Anima as opções de resposta em sequência
		if (typeof window.animateList === 'function') {
			const answerButtons = answerButtonsContainer.querySelectorAll('.answer-btn');
			window.animateList(answerButtons, 'slide-in-up', 100);
		}
	}
}

function advanceToNextQuestion() {
	if (!localIsHost) return;

	const roomRef = database.ref('rooms/' + currentRoomId);
	roomRef.transaction((roomData) => {
		if (roomData && roomData.status === 'playing') {
			const nextIndex = (roomData.currentQuestionIndex || 0) + 1;
			if (nextIndex < roomData.questions.length) {
				roomData.currentQuestionIndex = nextIndex;
				roomData.questionStartTime = firebase.database.ServerValue.TIMESTAMP;
			} else {
				roomData.status = 'finished';
			}
		}
		return roomData;
	});
}

function selectAnswer(e) {
	if (e.target.disabled) {
		return;
	}
	Array.from(answerButtonsContainer.children).forEach((button) => (button.disabled = true));

	const isCorrect = e.target.dataset.correct === 'true';
	
	// Reproduz som baseado na resposta
	if (typeof window.playSound === 'function') {
		if (isCorrect) {
			window.playSound('success');
		} else {
			window.playSound('error');
		}
	}
	
	// Anima a resposta
	if (typeof window.animateAnswer === 'function') {
		window.animateAnswer(e.target, isCorrect);
	}
	
	// Registra a resposta no sistema de estatísticas
	if (typeof window.recordAnswer === 'function') {
		document.dispatchEvent(new CustomEvent('answerSelected', {
			detail: { isCorrect }
		}));
		window.recordAnswer({ isCorrect });
	}
	
	if (isCorrect) {
		const scoreRef = database.ref(`rooms/${currentRoomId}/players/${playerNickname}/score`);
		scoreRef.transaction((currentScore) => (currentScore || 0) + 1);
	}

	const answeredRef = database.ref(
		`rooms/${currentRoomId}/players/${playerNickname}/questionsAnswered`
	);
	answeredRef.transaction((currentCount) => (currentCount || 0) + 1);

	questionText.textContent = 'Aguardando a próxima pergunta...';
}

restartButton.addEventListener('click', () => {
    // Reproduz som de clique
    if (typeof window.playSound === 'function') {
        window.playSound('click');
    }
    
    if(localIsHost) {
	    resetRoom(currentRoomId);
    }
});

document.getElementById('back-to-lobby-btn').addEventListener('click', () => {
    // Reproduz som de clique
    if (typeof window.playSound === 'function') {
        window.playSound('click');
    }
    
    window.location.href = 'lobby.html';
});


function handleHostUI(players) {
	localIsHost = players && players[playerNickname] && players[playerNickname].isHost;
	if (localIsHost) {
		startGameButton.style.display = 'block';
		restartButton.style.display = 'block';
		waitMessage.style.display = 'none';
	} else {
		startGameButton.style.display = 'none';
		restartButton.style.display = 'none';
		waitMessage.style.display = 'block';
	}
}

function syncLeaderboard() {
	const playersRef = database.ref(`rooms/${currentRoomId}/players`);
	playersRef.once('value', (snapshot) => {
		const players = snapshot.val();
		leaderboardList.innerHTML = '';
		if (players) {
			const playersArray = Object.values(players).sort((a, b) => b.score - a.score);
			playersArray.forEach((player) => {
				const li = document.createElement('li');
                // Adiciona um ícone de troféu para o primeiro lugar
                const icon = player === playersArray[0] ? '<i class="fas fa-trophy winner-icon"></i>' : '';
				li.innerHTML = `${icon} ${player.nickname}: <strong>${player.score}</strong> pontos`;
				leaderboardList.appendChild(li);
			});
			
			// Registra estatísticas do jogador atual
			const currentPlayer = players[playerNickname];
			if (currentPlayer && typeof window.recordGame === 'function') {
				const roomRef = database.ref(`rooms/${currentRoomId}`);
				roomRef.once('value', (roomSnapshot) => {
					const roomData = roomSnapshot.val();
					if (roomData) {
						const gameData = {
							score: currentPlayer.score || 0,
							totalQuestions: roomData.totalQuestions || 10,
							category: roomData.category || 'Geral',
							duration: Date.now() - (roomData.startTime || Date.now()),
							correctAnswers: currentPlayer.score || 0,
							date: new Date().toISOString()
						};
						
						// Dispara evento personalizado para o sistema de estatísticas
						document.dispatchEvent(new CustomEvent('gameFinished', {
							detail: gameData
						}));
						
						// Registra o jogo diretamente
						window.recordGame(gameData);
					}
				});
			}
		}
	});
}

function syncPlayersList() {
	// Mostra skeleton loading inicial
	loading.showPlayersSkeleton(playersList, 2);
	
	const roomRef = database.ref('rooms/' + currentRoomId);
	roomRef.on('value', (snapshot) => {
		const roomData = snapshot.val();
		if (!roomData) {
			loading.hidePlayersSkeleton(playersList);
			if (gameInProgress) {
				showWarning('A sala foi fechada. Retornando ao lobby.', { title: 'Sala Fechada' });
			setTimeout(() => {
				window.location.href = 'lobby.html';
			}, 2000);
			}
			return;
		}

		const players = roomData.players;
		
		// Remove skeleton loading
		loading.hidePlayersSkeleton(playersList);
		playersList.innerHTML = '';
		
		const playersCount = players ? Object.keys(players).length : 0;
		document.getElementById('navbar-players-count').textContent = playersCount;
		document.getElementById('navbar-room-code').textContent = currentRoomId;
		
		if (players) {
			Object.values(players).forEach((player) => {
				const li = document.createElement('li');
                const hostIcon = player.isHost ? '<i class="fas fa-crown host-icon"></i>' : '';
				li.innerHTML = `${hostIcon} ${player.nickname}`;
				playersList.appendChild(li);
			});
			handleHostUI(players);
		}

		// --- LÓGICA DE TRANSIÇÃO DE TELAS (STATE MACHINE) ---
		switch (roomData.status) {
			case 'waiting':
				gameInProgress = false;
				activeTimerQuestionIndex = -1;
				clearInterval(questionTimer);
				showScreen(allScreens.waiting);
				break;
				
			case 'selecting_category':
				if (localIsHost) showScreen(allScreens.category);
				else {
                    waitMessage.textContent = 'Aguardando o host escolher uma categoria...';
                    showScreen(allScreens.waiting);
                }
				break;

			case 'versus':
				const playerNames = Object.keys(players || {});
				document.querySelector('#vs-player1 .player-name').textContent = playerNames[0] || 'Jogador 1';
				document.querySelector('#vs-player2 .player-name').textContent = playerNames[1] || 'Jogador 2';

				showScreen(allScreens.versus);

				if (localIsHost) {
					setTimeout(() => {
						database.ref('rooms/' + currentRoomId).update({
							status: 'playing',
							currentQuestionIndex: 0,
							questionStartTime: firebase.database.ServerValue.TIMESTAMP,
						});
					}, 4000);
				}
				break;
			
            case 'playing':
                if (!gameInProgress) {
                    gameInProgress = true;
                    roomQuestions = roomData.questions;
                }
                const remoteQuestionIndex = roomData.currentQuestionIndex;

                if (remoteQuestionIndex !== activeTimerQuestionIndex) {
                    activeTimerQuestionIndex = remoteQuestionIndex;
                    
                    document.getElementById('current-question-number').textContent = remoteQuestionIndex + 1;
                    document.getElementById('total-questions').textContent = roomQuestions.length;

                    showQuestionContent(remoteQuestionIndex);
                    showScreen(allScreens.quiz);

                    clearInterval(questionTimer);
                    let timeLeft = 10;
                    timerDisplay.textContent = timeLeft;

                    questionTimer = setInterval(() => {
                        timeLeft--;
                        timerDisplay.textContent = Math.max(0, timeLeft);
                        if (timeLeft <= 0) {
                            clearInterval(questionTimer);
                        }
                    }, 1000);

                    if (localIsHost) {
                        setTimeout(() => {
                            database.ref('rooms/' + currentRoomId).once('value', (snap) => {
                                const currentData = snap.val();
                                if (currentData && currentData.status === 'playing' && currentData.currentQuestionIndex === remoteQuestionIndex) {
                                    advanceToNextQuestion();
                                }
                            });
                        }, 10500);
                    }
                }

                const myPlayerData = players ? players[playerNickname] : null;
                if (myPlayerData) {
                    playerScoreDisplay.textContent = myPlayerData.score || 0;
                }

                const questionsAnswered = myPlayerData ? myPlayerData.questionsAnswered || 0 : 0;
                if (questionsAnswered > remoteQuestionIndex) {
                    questionText.textContent = 'Aguardando a próxima pergunta...';
                    answerButtonsContainer.innerHTML = '';
                }
                break;
				
			case 'finished':
				gameInProgress = false;
				clearInterval(questionTimer);
				activeTimerQuestionIndex = -1;
				showScreen(allScreens.result);
				syncLeaderboard();
				break;
		}
	});
}

// --- INICIALIZAÇÃO DO JOGO ---
syncPlayersList();
