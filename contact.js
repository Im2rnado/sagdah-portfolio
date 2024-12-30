window.addEventListener('load', () => {
    const personalInfoanimationElement = document.getElementById("personalInfoanimation");

    console.log('Animation personalInfo element');
    personalInfoanimationElement.classList.add('animate');

    if(!personalInfoanimationElement.classList.contains('animate')){
        personalInfoanimationElement.classList.add('animate');
    }
});
