// utils/loadScript.js
export const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) return resolve();

    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(`Failed to load ${src}`);
    document.body.appendChild(script);
  });
};
