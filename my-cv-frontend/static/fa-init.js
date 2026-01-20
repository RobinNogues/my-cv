// Font Awesome async loading - switch from print to all media once loaded
(function () {
    var faCss = document.getElementById('fa-css');
    if (faCss) {
        faCss.addEventListener('load', function () {
            this.media = 'all';
        });
        // Fallback for already loaded
        if (faCss.sheet) {
            faCss.media = 'all';
        }
    }
})();
