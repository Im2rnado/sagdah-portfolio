window.addEventListener('load', () => {
    const textElement = document.getElementById('animatedtext');
    const headerElement = document.getElementById('animatedheader');
    const imageElement = document.getElementById('imageanimated')

    console.log('Animating text element');
    textElement.classList.add('animate');

    console.log('Animating image element');
    imageElement.classList.add('animate');

    console.log('Animating Header element');
    headerElement.classList.add('animate');


    if (!textElement.classList.contains('animate')) {
        textElement.classList.add('animate');
    }
    if (!imageElement.classList.contains('animate')) {
        imageElement.classList.add('animate');
    }
    if (!headerElement.classList.contains('animate')){
        headerElement.classList.add('animate');
    }
});
