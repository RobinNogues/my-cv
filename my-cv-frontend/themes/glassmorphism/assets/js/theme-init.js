(function () {
    const theme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (theme === 'dark' || (!theme && systemPrefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
})();
