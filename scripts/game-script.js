// --- CONFIGURAÇÃO E VERIFICAÇÃO INICIAL ---
const playerNickname = localStorage.getItem('playerNickname');
const currentRoomId = localStorage.getItem('currentRoomId');
if (!playerNickname || !currentRoomId) {
	alert('Erro: Dados da sessão não encontrados. Retornando ao lobby.');
	window.location.href = 'lobby.html';
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
const categoryButtons = document.querySelectorAll('.category-button');
const leaderboardList = document.getElementById('leaderboard-list');
const timerDisplay = document.getElementById('timer');

let roomQuestions = [];
let localIsHost = false;
let gameInProgress = false;
let questionTimer = null;
let activeTimerQuestionIndex = -1;
let activeTimerStartTime = -1;

const questions = {
	tecnologia: [
		{
			question: 'Qual empresa criou o sistema operacional Android?',
			answers: [
				{ text: 'Apple', correct: false },
				{ text: 'Microsoft', correct: false },
				{ text: 'Google', correct: true },
				{ text: 'Samsung', correct: false },
			],
		},
		{
			question: 'Qual linguagem de programação é a base para a web?',
			answers: [
				{ text: 'Python', correct: false },
				{ text: 'Java', correct: false },
				{ text: 'JavaScript', correct: true },
				{ text: 'C++', correct: false },
			],
		},
	],
	filmes: [
		{
			question: "Qual filme tem a famosa frase 'Luke, eu sou seu pai'?",
			answers: [
				{ text: 'Star Wars: O Império Contra-Ataca', correct: true },
				{ text: 'Star Wars: Uma Nova Esperança', correct: false },
				{ text: 'Vingadores: Ultimato', correct: false },
				{ text: 'Matrix', correct: false },
			],
		},
		{
			question: "Quem dirigiu o filme 'Pulp Fiction'?",
			answers: [
				{ text: 'Martin Scorsese', correct: false },
				{ text: 'Steven Spielberg', correct: false },
				{ text: 'Quentin Tarantino', correct: true },
				{ text: 'Christopher Nolan', correct: false },
			],
		},
	],
	esportes: [
		{
			question: "Em qual esporte a expressão 'strike' é usada?",
			answers: [
				{ text: 'Basquete', correct: false },
				{ text: 'Beisebol', correct: true },
				{ text: 'Futebol', correct: false },
				{ text: 'Tênis', correct: false },
			],
		},
		{
			question: 'Quantos jogadores um time de vôlei de quadra tem em jogo?',
			answers: [
				{ text: '4', correct: false },
				{ text: '5', correct: false },
				{ text: '6', correct: true },
				{ text: '7', correct: false },
			],
		},
	],
};

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
	database.ref('rooms/' + currentRoomId).update({ status: 'selecting_category' });
});

categoryButtons.forEach((button) => {
	button.addEventListener('click', () => {
		const selectedCategory = button.dataset.category;
		const questionsToSend = questions[selectedCategory];

		const roomRef = database.ref('rooms/' + currentRoomId);
		roomRef.once('value', (snapshot) => {
			const roomData = snapshot.val();
			if (roomData && roomData.players) {
				Object.keys(roomData.players).forEach((nickname) => {
					roomData.players[nickname].questionsAnswered = 0;
				});
				roomRef.update({
					status: 'playing',
					questions: questionsToSend,
					currentQuestionIndex: 0,
					questionStartTime: firebase.database.ServerValue.TIMESTAMP,
					players: roomData.players,
				});
			}
		});
	});
});

/**
 * *** FUNÇÃO CORRIGIDA ***
 * Inicia um temporizador com uma contagem regressiva visual fluida.
 */
function startTimer(startTime) {
	// 1. Limpa qualquer timer antigo para evitar sobreposição
	clearInterval(questionTimer);

	// 2. Calcula o tempo inicial restante de forma precisa com base no servidor
	const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
	let timeLeft = 10 - elapsedSeconds;

	// Garante que o tempo esteja dentro dos limites (0-10)
	if (timeLeft < 0) timeLeft = 0;
	if (timeLeft > 10) timeLeft = 10;

	// 3. Exibe o tempo inicial imediatamente na tela
	timerDisplay.textContent = timeLeft;

	// 4. Inicia um novo intervalo para simplesmente decrementar a cada segundo
	questionTimer = setInterval(() => {
		timeLeft--; // Apenas decrementa a variável local

		if (timeLeft >= 0) {
			timerDisplay.textContent = timeLeft; // Atualiza a tela
		}

		if (timeLeft <= 0) {
			clearInterval(questionTimer); // Para o timer ao chegar em 0
		}
	}, 1000); // Executa exatamente a cada 1 segundo
}

function showQuestionContent(questionIndex) {
	const currentQuestion = roomQuestions[questionIndex];
	if (currentQuestion) {
		questionText.textContent = currentQuestion.question;
		answerButtonsContainer.innerHTML = '';
		currentQuestion.answers.forEach((answer) => {
			const button = document.createElement('button');
			button.textContent = answer.text;
			button.classList.add('answer-button');
			if (answer.correct) button.dataset.correct = true;
			button.addEventListener('click', selectAnswer);
			answerButtonsContainer.appendChild(button);
		});
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
	resetRoom(currentRoomId);
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
				li.textContent = `${player.nickname}: ${player.score} pontos`;
				leaderboardList.appendChild(li);
			});
		}
	});
}

function syncPlayersList() {
	const roomRef = database.ref('rooms/' + currentRoomId);
	roomRef.on('value', (snapshot) => {
		const roomData = snapshot.val();
		if (!roomData) {
			if (gameInProgress) {
				alert('A sala foi fechada. Retornando ao lobby.');
				window.location.href = 'lobby.html';
			}
			return;
		}

		const players = roomData.players;
		playersList.innerHTML = '';
		if (players) {
			Object.keys(players).forEach((nickname) => {
				const li = document.createElement('li');
				li.textContent = nickname;
				playersList.appendChild(li);
			});
			handleHostUI(players);
		}

		switch (roomData.status) {
			case 'waiting':
				gameInProgress = false;
				activeTimerQuestionIndex = -1;
				activeTimerStartTime = -1;
				showScreen(allScreens.waiting);
				break;
			case 'selecting_category':
				if (localIsHost) showScreen(allScreens.category);
				else showScreen(allScreens.waiting);
				break;
			case 'playing':
				if (!gameInProgress) {
					gameInProgress = true;
					roomQuestions = roomData.questions;
				}

				const remoteQuestionIndex = roomData.currentQuestionIndex;
				const remoteStartTime = roomData.questionStartTime;

				if (
					remoteQuestionIndex !== activeTimerQuestionIndex ||
					remoteStartTime !== activeTimerStartTime
				) {
					startTimer(remoteStartTime);
					activeTimerQuestionIndex = remoteQuestionIndex;
					activeTimerStartTime = remoteStartTime;
					showQuestionContent(remoteQuestionIndex);

					if (localIsHost) {
						setTimeout(() => {
							database.ref('rooms/' + currentRoomId).once('value', (snap) => {
								const currentData = snap.val();
								if (
									currentData &&
									currentData.status === 'playing' &&
									currentData.currentQuestionIndex === remoteQuestionIndex
								) {
									advanceToNextQuestion();
								}
							});
						}, 10500);
					}
				}

				const myPlayerData = players ? players[playerNickname] : null;
				if (myPlayerData) {
					playerScoreDisplay.textContent = `Pontuação: ${myPlayerData.score || 0}`;
					showScreen(allScreens.quiz);

					const questionsAnswered = myPlayerData.questionsAnswered || 0;

					if (questionsAnswered > remoteQuestionIndex) {
						questionText.textContent = 'Aguardando a próxima pergunta...';
						answerButtonsContainer.innerHTML = '';
					}
				}
				break;
			case 'finished':
				gameInProgress = false;
				activeTimerQuestionIndex = -1;
				activeTimerStartTime = -1;
				showScreen(allScreens.result);
				syncLeaderboard();
				break;
		}
	});
}

// --- INICIALIZAÇÃO DO JOGO ---
syncPlayersList();
