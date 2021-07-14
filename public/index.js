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

if(window.location.hostname == "localhost"){
    //const appCheck = firebase.appCheck();
    // Pass your reCAPTCHA v3 site key (public key) to activate(). Make sure this
    // key is the counterpart to the secret key you set in the Firebase console.
    //appCheck.activate('6LcTJJAbAAAAAOcc8hVstcqqqqJFYfon6vM5Pn-B');
}


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
            setUid(key);
            emitPopState();
        };

        list.appendChild(li);
    })
}

const validURL = (str) => {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
}

const validateURL = (url) => {
    let valid = url;

    if ((/http|https/).test(valid) == false) {
        valid = 'https://' + valid;
    }

    return valid;
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
    updateLatest() {
        this.title = document.querySelector('#matka-title').innerHTML;
        this.body = document.querySelector('#matka-body').innerHTML;
    }
    getDirtyState() {
        return document.querySelector('.save').classList.contains('ready');
    }
    manipulate (action) {
        this.updateLatest();
        dirtyMatkaState();

        if (action == 'createLink') {
            let selection = window.getSelection();
            let baseParent = selection.baseNode.parentNode
            let endParent = selection.focusNode.parentNode

            if (baseParent.tagName == 'A' && endParent.tagName == 'A') {
                console.log('hello?')
                document.execCommand('insertHTML', false, `<div>${window.getSelection().toString().trim()}<div>`);
                removeActionButton('createLink')
                return;
            }           

            let url = window.getSelection().toString().trim();
            if (validURL(url) == false) {
                new DOMMessage(`"${url}" is not a valid URL`).dispatch();
                this.getDirtyState() == true ? cleanMatkaState() : '';
                return;
            } else {
                document.execCommand('insertHTML', false, `<a href="${validateURL(url)}">${window.getSelection().toString().trim()} <kbd onclick="window.open(this.parentElement.href)" contenteditable="false">visit ↗</kbd><a>`);
                selectActionButton('createLink')
            }
        }

        if (action == 'insertUnorderedList') {
            document.execCommand(action)
            toggleActionButton(action, 'insertList')
            return;
        }

        if (validActions.includes(action)) {
            console.log(`Valid action: ${action}`);
            document.execCommand(action)
            toggleActionButton(action, 'validactions')
        }
    }
    clear() {
        document.querySelector('#matka-title').innerHTML = '';
        document.querySelector('#matka-body').innerHTML = '';
    }
    isClear() {
        this.updateLatest();
        return document.querySelector('#matka-title').textContent.trim() == '' && document.querySelector('#matka-body').textContent.trim() == '';
    }
    zen(state) {
        this.updateLatest();
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
    constructor(message, duration) {
        this.message = message;
        this.duration = duration ? duration : 3000;
    }
    dispatch() {
        let messageContainer = document.querySelector('.messages');
        messageContainer.innerHTML = this.message;

        console.log('%cDispatching message: ' + this.message, 'color: #96c1ae');

        messageContainer.classList.add('show');
        setTimeout(() => {
            if (newMessageIncoming == true) return newMessageIncoming = false;
            messageContainer.classList.remove('show')
        }, this.duration)
    }
    update(entry) {
        newMessageIncoming = true;
        this.message = entry;
        this.dispatch();
    }
}

const cacheMatka = (id) => {
    localStorage.setItem('lastCachedMatka', JSON.stringify(new matkajournal(id)))
}

const getLastCachedMatka = () => { 
    let lastCachedMatka = localStorage.getItem('lastCachedMatka');
    return lastCachedMatka ? JSON.parse(lastCachedMatka) : null;
}

const viewMatka = (id) => {
    window.history.pushState({}, '', `?matka=${id}`);

    let googleId = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getId();

    database.ref(`/users/${googleId}/${id}`).get().then((snapshot) => {
        const data = snapshot.val();
        if (!data) {
            console.warn(`Matka with id ${id} not found, creating new one with id of ${id}`);

            let matka = new matkajournal();
            matka.clear();

            setUid(id);
        }

        console.groupCollapsed(`%cViewing Matka: "${data?.title || 'Untitled'}" @${id}`, 'color: rgb(239 201 129)');
        console.log(data);
        console.groupEnd();

        document.querySelector('#matka-title').innerHTML = data?.title || '';
        document.querySelector('#matka-body').innerHTML = data?.body || '';

        cacheMatka(id)
    });
}

var first = true;

const firstFocus = () => {
    let firstMatka = document.querySelectorAll('.list > .list-item')[0];
    let lastCachedMatka = getLastCachedMatka();
    first = false;

    if (lastCachedMatka) {
        viewMatka(lastCachedMatka.id)
    } else {
        if (firstMatka) {
            firstMatka.click() 
        } else {
            setUid(); 
        } 
    }
}

const focusFirstMatka = () => {
    let firstMatka = document.querySelectorAll('.list > .list-item')[0];
    firstMatka ? firstMatka.click() : setUid();  
}

const warnUser = (type) => {
    if (type === 'auth') {
        return window.alert('You need to sign in to save your matka');
    }
}

const userIsNotSignedIn = () => {
    return gapi.auth2.getAuthInstance().isSignedIn.get() ? false : true;
}

const getQueryParams = () => {
    var urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('matka')) {
        setUid(urlParams.get('matka'))
        viewMatka(urlParams.get('matka'))
        first = false;
    } else if (new matkajournal().isClear() == false) {
        console.log('Matka is not clear, and does not have a UID. Setting and saving this new Matka.')
        setUid()
        saveMatka(viewMatka);
        first = false;
    }

    

    database.ref('/users').off()

    database.ref('/users').on('value', (snapshot) => {
        const data = snapshot.val();
        console.groupCollapsed(`%cMaster Database`, 'color: rgb(255, 249, 239)');
        console.log(data);
        console.groupEnd();

        let googleId = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getId();
        placeMatkaList(data[googleId]);

        if (first == true) return firstFocus();
    });
}

window.addEventListener('popstate', () => {
    getQueryParams();
})



const saveMatka = (callback) => {
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
            document.querySelector('.save').innerHTML = 'save';
        } else {
            msg.update(`Saved "${matka.title}" successfully`)
            cleanMatkaState();
            if (typeof callback === 'function') callback(matka.id);
        }
    });
}

const deleteMatka = (id) => {
    let googleId = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getId();
    database.ref(`/users/${googleId}/${id}`).remove().then(() => {
        console.log(`%cDeleted matka with id: ${id}`, 'color: #ef8181');
    });
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
    clearTimeout(typingTimeout)
}

const handleUnload = (unloadEvent) => {
    unloadEvent.returnValue = 'Your Matka is not saved. Are you sure you want to leave?';
    return 'Your Matka is not saved. Do you want to save it?'
}

const dirtyMatkaState = () => {
    document.querySelector('.save').innerHTML = 'save';
    document.querySelector('.save').classList.add('ready')

    window.addEventListener('beforeunload', handleUnload)
}
const cleanMatkaState = () => {
    document.querySelector('.save').innerHTML = 'all changes saved';
    document.querySelector('.save').classList.remove('ready')

    window.removeEventListener('beforeunload', handleUnload)
}

const timeout = (ms = 0) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const assignListeners = () => {
    const matkaCanvas = new matkajournal();

    // Database change listeners
    document.querySelector('.save').addEventListener('click', () => {
        if (document.querySelector('.save').classList.contains('ready')) {
            saveMatka();
        }
    })

    // Navigation listeners
    const view = document.querySelector('.toolbar-item.view')
    view.addEventListener('click', () => {
        let arrow = document.querySelector('.arrow');
        arrow.classList.toggle('up');

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

    const deleteButton = document.querySelector('.toolbar-item.delete');
    deleteButton.addEventListener('click', () => {
        let matka = new matkajournal()

        let msgSuccess = new DOMMessage(`Matka "${matka.title}" successfully deleted`)
        let msgFailure = new DOMMessage(`Matka "${matka.title}" is not empty. <br><br> We don't want to delete anything important:) Clear the journal and try again.`, 5000)
        
        if (matka.isClear() == true) {
            msgSuccess.dispatch();
            deleteMatka(getUid());
            focusFirstMatka();
        } else {
            msgFailure.dispatch();
        }
    });

    const messageBox = document.querySelector('.messages');
    messageBox.addEventListener('click', () => {
        messageBox.classList.remove('show')
    })

    // Typing listeners

    const titleinput = document.querySelector('#matka-title');
    titleinput.addEventListener('keydown', (e) => {
        if (e.key == 'Enter' && !e.shiftKey){
            e.preventDefault();
            e.stopPropagation();
            document.querySelector('#matka-body').focus();
            return false;
        }
        dirtyMatkaState();
    })

    const selectElementText = (el, win) => {
        win = win || window;
        var doc = win.document, sel, range;
        if (win.getSelection && doc.createRange) {
            sel = win.getSelection();
            range = doc.createRange();
            range.selectNodeContents(el);
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (doc.body.createTextRange) {
            range = doc.body.createTextRange();
            range.moveToElementText(el);
            range.select();
        }
    }

    const bodyinput = document.querySelector('#matka-body');
    bodyinput.addEventListener('input', (e) => {
        if (e.inputType == 'deleteContentBackward') {
            document.querySelectorAll('a[href]').forEach(a => {
                if (a.querySelectorAll('kbd').length > 0) return;
                selectElementText(a);
                document.execCommand('delete');
            })
        }
        dirtyMatkaState();
    })

    bodyinput.addEventListener('keydown', (e) => {
        const formatKeys = ['s', 'b', 'i', 'u', 's']
        
        if (formatKeys.includes(e.key) && (e.ctrlKey || e.metaKey)) {
            if (e.key === 'u' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                e.stopPropagation();
                document.querySelector('button[action="underline"]').click()
                return false;
            }
        }
    })

    document.addEventListener('keydown', (e) => {
        if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            e.stopPropagation();
            saveMatka();
            return false;
        }
    })

    document.addEventListener('mouseup', (e) => {
        let selection = window.getSelection();

        let baseParent = selection.baseNode
        let endParent = selection.focusNode

        removeAllActionButtons();

        timeout().then(() => {
            if (window.getSelection().toString().trim().length == 0) {
                return;
            }
            switchSelection(baseParent, endParent);
        })
    })

    bodyinput.addEventListener('click', (e) => {
        timeout().then(() => {
            let textSelection = window.getSelection().toString();
            if (textSelection.length > 0) {
                return;
            }

            let target = e.target;
            if (target && target.tagName == 'A' && target.href && (e.metaKey == true || e.ctrlKey == true)) {
                window.open(target.href, '_blank');
            }
        })
    })


    // Text manipulation listeners
    const controls = document.querySelectorAll('.manipulation > button');
    controls.forEach(control => {
        control.addEventListener('click', () => {
            let selectedText = window.getSelection().toString();
            if (selectedText.length === 0) {
                return console.warn('No text selected')
            }

            let controlAction = control.getAttribute('action')
            matkaCanvas.manipulate(controlAction);
        })
    });
}
assignListeners();
