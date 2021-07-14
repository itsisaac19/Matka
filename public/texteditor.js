const validActions = ['bold', 'italic', 'underline', 'strikeThrough', 'createLink', 'insertUnorderedList']

const toggleActionButton = (action, origin) => {
    console.log('ORIGIN', origin)
    document.querySelector(`[action="${action}"]`).classList.toggle('selected')
}

const selectActionButton = (action) => {
    document.querySelector(`[action="${action}"]`).classList.add('selected');
}

const removeActionButton = (action) => {
    document.querySelector(`[action="${action}"]`).classList.remove('selected');
}

const removeAllActionButtons = () => {
    document.querySelectorAll(`button[action]`).forEach(button => {
        button.classList.remove('selected');
    });
}


const selectActionButtonFromTag = (tag) => {
    switch (tag) {
        case 'B':
            selectActionButton('bold')
            break;
        case 'I':
            selectActionButton('italic')
            break;
        case 'U':
            selectActionButton('underline')
            break;
        case 'A':
            selectActionButton('createLink')
            break;
        case 'STRIKE':
            selectActionButton('strikeThrough')
            break;
        default:
            removeAllActionButtons();
    }
}

const traverseParentNodes = (base) => {
    var traversedParents = [];

    while (base.parentNode && base.parentNode.tagName != 'DIV') {
        traversedParents.push(base.parentNode)
        base = base.parentNode;
    }

    traversedParents.forEach(parent => {
        //console.log(`selecting:`, parent)
        selectActionButtonFromTag(parent.tagName)
    })

}

const switchSelection = (base, end) => {
    let baseParent = base.parentNode
    let endParent = end.parentNode

    selectActionButtonFromTag(baseParent.tagName)
    selectActionButtonFromTag(endParent.tagName)

    let baseGrandParent = baseParent.parentNode;
    let endGrandParent = endParent.parentNode;

    traverseParentNodes(endParent);
}