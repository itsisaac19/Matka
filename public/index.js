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
    zen(state) {
        if (state == 'off') {
            this.zenState = 'off';
            document.querySelector('.toolbar').classList.remove('zen');
            document.querySelector('button.save').classList.remove('zen');
            document.querySelector('button.share').classList.remove('zen');
            return;
        }
        document.querySelector('.toolbar').classList.add('zen');
        document.querySelector('button.save').classList.add('zen');
        document.querySelector('button.share').classList.add('zen');
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

    database.ref(`/users/${googleId}/${matka.id}`).set({
        title: matka.title,
        body: matka.body
    })
}


function zenJournal (canvas) {
    if (canvas.zenState === 'zen') return;
    canvas.zen();
    canvas.zenState = 'zen';
}

function unZenJournal (canvas) {
    if (canvas.zenState === 'off') return;
    canvas.zen('off');
    canvas.zenState = 'off';
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
        setUid();

        let matka = new matkajournal()
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

    const bodyinput = document.querySelector('#matka-body');
    bodyinput.addEventListener('focus', () => {
        zenJournal(matkaCanvas);
    })
    bodyinput.addEventListener('blur', () => {
        unZenJournal(matkaCanvas);
    })


    /*document.querySelector('.container').addEventListener('mouseleave', () => {
        unZenJournal(matkaCanvas);
    })*/
}
assignListeners();