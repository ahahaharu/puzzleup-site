// Umami – без cookie, считает всегда (ТЗ главной, «Глобальные элементы»). Переходы внутри сайта
// трекер видит сам: он следит за History API.

export function loadUmami({ scriptUrl, websiteId }: { scriptUrl: string; websiteId: string }) {
  if (document.querySelector(`script[src="${scriptUrl}"]`)) return;
  const script = document.createElement('script');
  script.defer = true;
  script.src = scriptUrl;
  script.dataset.websiteId = websiteId;
  document.head.append(script);
}
