// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getDatabase, ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// Configuração do Firebase 
const firebaseConfig = {
    apiKey: "AIzaSyDB7fWkivp2kMOZSlr6yx4vWv8wnUPqO60",
    authDomain: "trabalhobede.firebaseapp.com",
    projectId: "trabalhobede",
    storageBucket: "trabalhobede.firebasestorage.app",
    messagingSenderId: "749211665871",
    appId: "1:749211665871:web:8c4c5077d515bb11703eba",
    measurementId: "G-M6YC685WHL"
};

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// --- Elementos da DOM ---
const authPage = document.getElementById('auth-page');
const appPage = document.getElementById('app-page');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const toggleAuthLink = document.getElementById('toggle-auth');
const authTitle = document.getElementById('auth-title');
const toggleText = document.getElementById('toggle-text');
const authError = document.getElementById('auth-error');
const logoutButton = document.getElementById('logout-button');
const userEmailSpan = document.getElementById('user-email');
const bookList = document.getElementById('book-list');
const addBookButton = document.getElementById('add-book-button');
const bookModal = document.getElementById('book-modal');
const bookForm = document.getElementById('book-form');
const modalTitle = document.getElementById('modal-title');
const cancelButton = document.getElementById('cancel-button');
const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const cancelDeleteButton = document.getElementById('cancel-delete-button');
const confirmDeleteButton = document.getElementById('confirm-delete-button');
const loadingSpinner = document.getElementById('loading-spinner');
// ELEMENTOS PARA AVALIAÇÃO
const ratingStarsContainer = document.getElementById('rating-stars');
const bookRatingInput = document.getElementById('book-rating');

// --- Lógica de Autenticação ---
toggleAuthLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.toggle('hidden');
    signupForm.classList.toggle('hidden');
    authTitle.textContent = signupForm.classList.contains('hidden') ? 'Faça login para continuar' : 'Crie sua conta';
    toggleText.textContent = signupForm.classList.contains('hidden') ? 'Não tem uma conta?' : 'Já tem uma conta?';
    toggleAuthLink.textContent = signupForm.classList.contains('hidden') ? 'Cadastre-se' : 'Faça Login';
    authError.textContent = '';
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    createUserWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            console.log('Usuário cadastrado:', userCredential.user);
            signupForm.reset();
            toggleAuthLink.click();
        })
        .catch(error => authError.textContent = `Erro no cadastro: ${error.message}`);
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    signInWithEmailAndPassword(auth, email, password)
        .catch(error => authError.textContent = `Erro no login: ${error.message}`);
});

logoutButton.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    if (user) {
        authPage.classList.add('hidden');
        appPage.classList.remove('hidden');
        userEmailSpan.textContent = user.email;
        loadBooks(user.uid);
    } else {
        authPage.classList.remove('hidden');
        appPage.classList.add('hidden');
        bookList.innerHTML = '';
    }
});

// --- Lógica do CRUD de Livros ---
let currentUserId = null;
let bookToDeleteId = null;

function loadBooks(uid) {
    currentUserId = uid;
    const booksRef = ref(db, 'books/' + currentUserId);
    loadingSpinner.style.display = 'block';
    onValue(booksRef, (snapshot) => {
        bookList.innerHTML = '';
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(key => displayBook(data[key], key));
        } else {
            bookList.innerHTML = '<p class="text-gray-500 col-span-full text-center">Nenhum livro cadastrado ainda.</p>';
        }
        loadingSpinner.style.display = 'none';
    });
}

function displayBook(book, id) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md flex flex-col fade-in overflow-hidden';
    
    const renderStars = (rating) => {
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            starsHTML += `<i class="fas fa-star ${i <= rating ? 'text-amber-400' : 'text-gray-300'}"></i>`;
        }
        return `<div class="flex items-center mt-2">${starsHTML}</div>`;
    };

    card.innerHTML = `
        <img src="${book.imageUrl || 'https://placehold.co/600x400/E9D5FF/333333?text=Sem+Capa'}" 
             alt="Capa do livro ${book.title}" 
             class="w-full h-48 object-cover"
             onerror="this.onerror=null;this.src='https://placehold.co/600x400/E9D5FF/333333?text=Capa+Inv%C3%A1lida';">
        <div class="p-4 flex flex-col flex-grow">
            <div>
                <h3 class="text-lg font-bold text-gray-900">${book.title}</h3>
                <p class="text-sm text-gray-600 mt-1">por ${book.author}</p>
                ${renderStars(book.rating || 0)}
                <p class="mt-3 text-sm text-gray-500 italic truncate">${book.description || 'Sem descrição.'}</p>
                <div class="mt-3 text-xs space-y-1">
                    <p><span class="font-semibold">Gênero:</span> ${book.genre || 'Não informado'}</p>
                    <p><span class="font-semibold">Ano:</span> ${book.year || 'Não informado'}</p>
                </div>
            </div>
            <div class="mt-auto pt-4 flex justify-end space-x-2">
                <button data-id="${id}" class="edit-btn text-pink-500 hover:text-pink-700 p-2"><i class="fas fa-edit"></i></button>
                <button data-id="${id}" class="delete-btn text-red-500 hover:text-red-700 p-2"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
    bookList.appendChild(card);
}

addBookButton.addEventListener('click', () => {
    bookForm.reset();
    document.getElementById('book-id').value = '';
    modalTitle.textContent = 'Adicionar Novo Livro';
    updateStarsUI(0);
    bookModal.classList.remove('hidden');
});

cancelButton.addEventListener('click', () => bookModal.classList.add('hidden'));
bookModal.addEventListener('click', (e) => { if (e.target === bookModal) bookModal.classList.add('hidden'); });

bookForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const bookId = document.getElementById('book-id').value;
    const bookData = {
        title: document.getElementById('book-title').value,
        author: document.getElementById('book-author').value,
        genre: document.getElementById('book-genre').value,
        year: document.getElementById('book-year').value,
        description: document.getElementById('book-description').value,
        imageUrl: document.getElementById('book-image-url').value,
        rating: parseInt(bookRatingInput.value) || 0
    };

    const bookRefPath = `books/${currentUserId}/${bookId || push(ref(db, 'books/' + currentUserId)).key}`;
    set(ref(db, bookRefPath), bookData)
        .then(() => console.log('Livro salvo com sucesso!'))
        .catch(error => console.error('Erro ao salvar livro:', error));
    
    bookModal.classList.add('hidden');
    bookForm.reset();
});

bookList.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
        const bookId = editBtn.dataset.id;
        const bookRef = ref(db, `books/${currentUserId}/${bookId}`);
        onValue(bookRef, (snapshot) => {
            const book = snapshot.val();
            if (book) {
                document.getElementById('book-id').value = bookId;
                document.getElementById('book-title').value = book.title;
                document.getElementById('book-author').value = book.author;
                document.getElementById('book-genre').value = book.genre;
                document.getElementById('book-year').value = book.year;
                document.getElementById('book-description').value = book.description || '';
                document.getElementById('book-image-url').value = book.imageUrl || '';
                updateStarsUI(book.rating || 0);
                modalTitle.textContent = 'Editar Livro';
                bookModal.classList.remove('hidden');
            }
        }, { onlyOnce: true });
    }

    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
        bookToDeleteId = deleteBtn.dataset.id;
        deleteConfirmModal.classList.remove('hidden');
    }
});

cancelDeleteButton.addEventListener('click', () => deleteConfirmModal.classList.add('hidden'));
confirmDeleteButton.addEventListener('click', () => {
     if (bookToDeleteId) {
        remove(ref(db, `books/${currentUserId}/${bookToDeleteId}`));
    }
    deleteConfirmModal.classList.add('hidden');
});
deleteConfirmModal.addEventListener('click', (e) => { if (e.target === deleteConfirmModal) deleteConfirmModal.classList.add('hidden'); });

// --- LÓGICA DA AVALIAÇÃO POR ESTRELAS ---
function updateStarsUI(rating) {
    bookRatingInput.value = rating;
    for (const star of ratingStarsContainer.children) {
        star.classList.toggle('selected', star.dataset.value <= rating);
    }
}

ratingStarsContainer.addEventListener('click', e => {
    if (e.target.classList.contains('fa-star')) {
        updateStarsUI(e.target.dataset.value);
    }
});

ratingStarsContainer.addEventListener('mouseover', e => {
    if (e.target.classList.contains('fa-star')) {
        const hoverValue = e.target.dataset.value;
        for (const star of ratingStarsContainer.children) {
            star.classList.toggle('selected', star.dataset.value <= hoverValue);
        }
    }
});

ratingStarsContainer.addEventListener('mouseout', () => {
     updateStarsUI(bookRatingInput.value);
});
