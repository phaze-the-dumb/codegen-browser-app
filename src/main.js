let version = '';
let allowAPK = false;
let lerp = ( a, b, t ) => a + ( b - a ) * t;
let targetScroll = 0;
let nameLists = [];

let checkVersion = ( value ) => {
    version = value;

    value = value.split('.');
    let valid = true;

    if(value.length != 3)
        valid = false;

    value.forEach(num => {
        if(!/^\d+$/.test(num))
            valid = false;
    })

    if(version !== '' && allowAPK){
        document.querySelector('.next-btn').style.right = 0;
        document.querySelector('.next-btn-top').style.right = 0;
        document.querySelector('.next-btn-bottom').style.right = 0;
    }

    if(!valid)
        document.querySelector('#version-warning').innerHTML = 'That doesn\'t look like a version number, please double check it<br />(This message will not stop you from adding the new version, it is just a warning)';
    else
        document.querySelector('#version-warning').innerHTML = '';
}

let checkAPK = ( input ) => {
    let name = input.files[0].name;

    if(name.endsWith('.apk')){
        document.querySelector('#filename').innerHTML = input.files[0].name;
        allowAPK = true;

        if(version !== ''){
            document.querySelector('.next-btn').style.right = 0;
            document.querySelector('.next-btn-top').style.right = 0;
            document.querySelector('.next-btn-bottom').style.right = 0;
        }
    } else{
        allowAPK = false;
        document.querySelector('#filename').innerHTML = 'Not an apk file.';
    }
}

document.querySelector('.version-list').onwheel = ( e ) => {
    targetScroll += e.deltaY;

    if(targetScroll < 0)targetScroll = 0;
    if(targetScroll > document.querySelector('.version-list').scrollWidth - document.querySelector('.version-list').clientWidth + 10)
        targetScroll = document.querySelector('.version-list').scrollWidth - document.querySelector('.version-list').clientWidth + 10;
}

let widthSelectorDown = false;
let width = 300;

document.querySelector('.width-selector').onmousedown = () => {
    widthSelectorDown = true;
    document.body.style.userSelect = 'none';
}

window.onresize = () => {
    document.querySelector('.width-selector').style.left = width;
}

document.onmousemove = ( e ) => {
    if(widthSelectorDown){
        width = e.clientX - 50;

        document.querySelector('.names-list').style.width = width;
        document.querySelector('.width-selector').style.left = width;
        document.querySelector('.class-container').style.width = 'calc(100% - '+width+'px)';
    }
}

document.onmouseup = () => {
    widthSelectorDown = false;
    document.body.style.userSelect = null;
}

let update = () => {
    requestAnimationFrame(update);
    
    document.querySelector('.version-list').scrollTo(lerp(document.querySelector('.version-list').scrollLeft, targetScroll, 0.1), 0);
}

update();