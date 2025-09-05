
// --- CONFIGURAÇÃO E VERIFICAÇÃO INICIAL ---

// Pega o nickname do jogador que foi salvo na página de login
const playerNickname = localStorage.getItem('playerNickname');

// Se não houver nickname, significa que o usuário não fez login.
// Redireciona de volta para a página de login.
if (!playerNickname) {
    window.location.href = 'index.html';
}

// Mostra o nickname na tela
document.getElementById('lobby-nickname').textContent = playerNickname;

// --- INICIALIZAÇÃO DO FIREBASE ---

// Cole sua configuração do Firebase aqui
const firebaseConfig = {
    apiKey: "AIzaSyAnTMGJcf0lsFMqB9A6R__PJ4g_D0xjS_4",
    authDomain: "star-quiz-9c417.firebaseapp.com",
    databaseURL: "https://star-quiz-9c417-default-rtdb.firebaseio.com",
    projectId: "star-quiz-9c417",
    storageBucket: "star-quiz-9c417.firebasestorage.app",
    messagingSenderId: "377871658085",
    appId: "1:377871658085:web:769cfd88ecc841d11b2a8c",
    measurementId: "G-6RPJ0R2L9Z"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// --- FUNÇÕES DE INTERAÇÃO COM O FIREBASE ---
// (Funções do antigo firebase-service.js necessárias nesta página)

function createRoom(hostNickname) {
    const roomId = Math.floor(100000 + Math.random() * 900000).toString();
    const roomRef = database.ref('rooms/' + roomId);
    const roomData = {
        status: 'waiting',
        players: {
            [hostNickname]: {
                nickname: hostNickname,
                score: 0,
                isHost: true
            }
        },
        host: hostNickname
    };
    return roomRef.set(roomData).then(() => roomId).catch(() => null);
}

function joinRoom(roomId, playerNickname) {
    const roomRef = database.ref('rooms/' + roomId);
    return roomRef.once('value').then(snapshot => {
        if (!snapshot.exists()) {
            return false;
        }
        const updates = {};
        updates['players/' + playerNickname] = {
            nickname: playerNickname,
            score: 0,
            isHost: false
        };
        return roomRef.update(updates).then(() => true).catch(() => false);
    });
}

// --- LÓGICA DA PÁGINA ---

const createRoomButton = document.getElementById('create-room-button');
const joinRoomButton = document.getElementById('join-room-button');
const joinRoomInput = document.getElementById('join-room-input');

createRoomButton.addEventListener('click', () => {
    createRoom(playerNickname).then(roomId => {
        if (roomId) {
            // Salva o ID da sala e redireciona para a página do jogo
            localStorage.setItem('currentRoomId', roomId);
            window.location.href = 'game.html';
        } else {
            alert('Não foi possível criar a sala. Tente novamente.');
        }
    });
});

joinRoomButton.addEventListener('click', () => {
    const roomId = joinRoomInput.value.trim();
    if (!roomId) {
        alert('Por favor, insira o código da sala.');
        return;
    }
    joinRoom(roomId, playerNickname).then(success => {
        if (success) {
            // Salva o ID da sala e redireciona para a página do jogo
            localStorage.setItem('currentRoomId', roomId);
            window.location.href = 'game.html';
        } else {
            alert('Sala não encontrada ou erro ao entrar.');
        }
    });
});

