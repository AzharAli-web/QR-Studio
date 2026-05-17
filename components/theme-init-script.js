const THEME_STORAGE_KEY = "qrstudio.theme";

export default function ThemeInitScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var m=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var d=(t==='dark')||(t!=='light'&&m);var e=document.documentElement;e.classList.toggle('dark',d);}catch(e){}})();`,
      }}
    />
  );
}

