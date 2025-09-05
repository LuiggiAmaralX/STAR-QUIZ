
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
    // Reproduz som de clique
    if (typeof window.playSound === 'function') {
        window.playSound('click');
    }
    
    const roomId = Math.floor(100000 + Math.random() * 900000).toString();
    const roomRef = database.ref('rooms/' + roomId);
    const createBtn = document.getElementById('create-room-button');
    
    // Mostra loading no botão
    showButtonLoading(createBtn, 'Criando sala...');
    
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
    return roomRef.set(roomData)
        .then(() => {
            hideButtonLoading(createBtn);
            return roomId;
        })
        .catch(() => {
            hideButtonLoading(createBtn);
            return null;
        });
}

function joinRoom(roomId, playerNickname) {
    // Reproduz som de clique
    if (typeof window.playSound === 'function') {
        window.playSound('click');
    }
    
    const roomRef = database.ref('rooms/' + roomId);
    const joinBtn = document.getElementById('join-room-button');
    const roomInput = document.getElementById('join-room-input');
    
    // Mostra loading no botão e input
    showButtonLoading(joinBtn, 'Entrando...');
    loading.showInput(roomInput);
    
    return roomRef.once('value').then(snapshot => {
        if (!snapshot.exists()) {
            hideButtonLoading(joinBtn);
            loading.hideInput(roomInput);
            return false;
        }
        const updates = {};
        updates['players/' + playerNickname] = {
            nickname: playerNickname,
            score: 0,
            isHost: false
        };
        return roomRef.update(updates)
            .then(() => {
                hideButtonLoading(joinBtn);
                loading.hideInput(roomInput);
                return true;
            })
            .catch(() => {
                hideButtonLoading(joinBtn);
                loading.hideInput(roomInput);
                return false;
            });
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
            showError('Não foi possível criar a sala. Tente novamente.', { title: 'Erro ao Criar Sala' });
        }
    });
});

joinRoomButton.addEventListener('click', () => {
    const roomId = joinRoomInput.value.trim();
    if (!roomId) {
        showWarning('Por favor, insira o código da sala.', { title: 'Campo Obrigatório' });
        return;
    }
    joinRoom(roomId, playerNickname).then(success => {
        if (success) {
            // Salva o ID da sala e redireciona para a página do jogo
            localStorage.setItem('currentRoomId', roomId);
            showSuccess('Entrando na sala...', { title: 'Sucesso!' });
            setTimeout(() => {
                window.location.href = 'game.html';
            }, 1000);
        } else {
            showError('Sala não encontrada ou erro ao entrar.', { title: 'Erro ao Entrar' });
        }
    });
});

