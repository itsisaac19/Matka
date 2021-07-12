const firebaseConfig = {
    apiKey: "AIzaSyDj5QPKII5Uo2SHzenbWJphB1AbpmTmDcs",
    authDomain: "lista-6e067.firebaseapp.com",
    databaseURL: "https://lista-6e067-default-rtdb.firebaseio.com",
    projectId: "lista-6e067",
    storageBucket: "lista-6e067.appspot.com",
    messagingSenderId: "214720242083",
    appId: "1:214720242083:web:2cb80dab1cf2b25d267a16",
    measurementId: "G-SSJQZ4NQC6"
};
firebase.initializeApp(firebaseConfig);

const database = firebase.database();

const placeMatkaList = (matkaList) => {
    let list = document.querySelector('.toolbar-item.list');
    list.innerHTML = '';

    Object.keys(matkaList).forEach((key) => {
        let matka = matkaList[key];

        let li = document.createElement('li');
        li.className = 'list-item';
        li.innerHTML = matka.title;

        li.onclick = () => {
            window.history.pushState({}, '', `?matka=${key}`);
            emitPopState();
        };

        list.appendChild(li);
    })
}

const emitPopState = () => {
    var popStateEvent = new PopStateEvent('popstate', { state: {} });
    dispatchEvent(popStateEvent);
}

const generateUid = function() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

const getUid = () => {
    return document.querySelector('.container').dataset.id;
}
const setUid = (uid) => {
    if (uid) {
        document.querySelector('.container').dataset.id = uid;
    } else {
        let id = generateUid();
        document.querySelector('.container').dataset.id = id;
        window.history.pushState({}, '', `?matka=${id}`);
        emitPopState();
    }
}

class matkajournal {
    constructor(id) {
        this.title = document.querySelector('#matka-title').innerHTML;
        this.body = document.querySelector('#matka-body').innerHTML;
        this.id = id;
        this.zenState = 'off'
    }
    clear() {
        document.querySelector('#matka-title').innerHTML = '';
        document.querySelector('#matka-body').innerHTML = '';
    }
    isClear() {
        return document.querySelector('#matka-title').textContent.trim() == '' && document.querySelector('#matka-body').textContent.trim() == '';
    }
    zen(state) {
        if (state == 'off') {
            this.zenState = 'off';
            document.querySelector('.toolbar').classList.remove('zen');
            document.querySelector('button.save').classList.remove('zen');
            return;
        }
        document.querySelector('.toolbar').classList.add('zen');
        document.querySelector('button.save').classList.add('zen');
    }
}

var newMessageIncoming = false;

class DOMMessage {
    constructor(message) {
        this.message = message;
    }
    dispatch() {
        let messageContainer = document.querySelector('.messages');
        messageContainer.innerHTML = this.message;

        console.log('dispatching message' + this.message);

        messageContainer.classList.add('show');
        setTimeout(() => {
            if (newMessageIncoming == true) return newMessageIncoming = false;
            messageContainer.classList.remove('show')
        }, 3000)
    }
    update(entry) {
        newMessageIncoming = true;
        this.message = entry;
        this.dispatch();
    }
}

const viewMatka = (id) => {
    let googleId = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getId();

    database.ref(`/users/${googleId}/${id}`).get().then((snapshot) => {
        const data = snapshot.val();
        if (!data) {
            console.warn(`Matka with id ${id} not found, creating new one with id of ${id}`);

            let matka = new matkajournal();
            matka.clear();

            setUid(id);
        }

        console.groupCollapsed(`Viewing Matka: "${data?.title || 'Untitled'}" @${id}`);
        console.log(data);
        console.groupEnd();

        document.querySelector('#matka-title').innerHTML = data?.title || '';
        document.querySelector('#matka-body').innerHTML = data?.body || '';
    });
}

const getQueryParams = () => {
    var urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('matka')) {
        setUid(urlParams.get('matka'))
        viewMatka(urlParams.get('matka'))
    } else {
        setUid();
    }

    database.ref('/users').off()

    database.ref('/users').on('value', (snapshot) => {
        const data = snapshot.val();
        console.groupCollapsed(`Master Database`);
        console.log(data);
        console.groupEnd();

        let googleId = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getId();
        placeMatkaList(data[googleId]);
    });
}

window.addEventListener('popstate', () => {
    getQueryParams();
})

const warnUser = (type) => {
    if (type === 'auth') {
        return window.alert('You need to sign in to save your matka');
    }
}

const userIsNotSignedIn = () => {
    return gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile() ? false : true;
}

const saveMatka = () => {
    if (userIsNotSignedIn()) {
        return warnUser('auth');
    }

    let googleId = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getId();
    let id = getUid();
    let matka = new matkajournal(id);

    if (!matka.id) return console.warn(`Matka id is missing`);
    if (matka.isClear() == true) console.warn(`Matka is empty. Nothing to save`);

    let msg = new DOMMessage('Saving Matka...');
    msg.dispatch();

    database.ref(`/users/${googleId}/${matka.id}`).set({
        title: matka.title,
        body: matka.body
    }, (error) => {
        if (error) {
            msg.update(`A problem occured saving "${matka.title}"`)
        } else {
            msg.update(`Saved "${matka.title}" successfully`)
        }
    });
}

var typingTimeout;


function zenJournal (canvas) {
    if (canvas.zenState === 'zen') return;
    canvas.zen();
    canvas.zenState = 'zen';
}

function unZenJournal (canvas) {
    if (canvas.zenState === 'off') return;
    canvas.zen('off');
    canvas.zenState = 'off';
    clearTimeout(typingTimeout)
}

const assignListeners = () => {
    const matkaCanvas = new matkajournal();

    // Database change listeners
    document.querySelector('.save').addEventListener('click', () => {
        saveMatka();
    })

    // Navigation listeners
    const view = document.querySelector('.toolbar-item.view')
    view.addEventListener('click', () => {
        let list = document.querySelector('.toolbar-item.list');
        list.classList.toggle('hidden')
    });

    const newButton = document.querySelector('.toolbar-item.new');
    newButton.addEventListener('click', () => {
        let msg = new DOMMessage('New Matka successfully created')
        msg.dispatch();

        let matka = new matkajournal()
        if (matka.isClear() == true) {
            return console.warn('already a cleared / new journal')
        }
        setUid();
        matkaCanvas.clear();
    });

    // Typing listeners

    const titleinput = document.querySelector('#matka-title');
    titleinput.addEventListener('focus', () => {
        zenJournal(matkaCanvas);
    })
    titleinput.addEventListener('blur', () => {
        unZenJournal(matkaCanvas);
    })

    titleinput.addEventListener('keydown', (e) => {
        if (e.key == 'Enter' && !e.shiftKey){
            e.preventDefault();
            e.stopPropagation();
            document.querySelector('#matka-body').focus();
            return false;
        }
    })

    const bodyinput = document.querySelector('#matka-body');
    bodyinput.addEventListener('focus', () => {
        zenJournal(matkaCanvas);
    })
    bodyinput.addEventListener('blur', () => {
        unZenJournal(matkaCanvas);
    })

    bodyinput.addEventListener('keydown', (e) => {
        typingTimeout = setTimeout(() => {
            if (matkaCanvas.zenState != 'zen') {
                zenJournal(matkaCanvas);
                console.log('matka zen')
            }
        }, 700)
    })


    document.querySelector('.save').addEventListener('mouseenter', () => {
        unZenJournal(matkaCanvas);
    })
    document.addEventListener('mousemove', (e) => {
        if (e.target.classList.contains('journalInput') || e.target.classList.contains('journalTitle')) return;
        unZenJournal(matkaCanvas);
    })
    document.querySelector('.toolbar').addEventListener('mouseenter', () => {
        unZenJournal(matkaCanvas);
    })
}
assignListeners();