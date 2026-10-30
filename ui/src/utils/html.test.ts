import {escapeHtml} from './html';
test('calendar titles remain text in both HTML content and quoted attributes', () => {
    const payload = "\"><img src=x onerror=alert(1)> & 'test'";
    const element = document.createElement('div');
    element.innerHTML = `<span title="${escapeHtml(payload)}">${escapeHtml(payload)}</span>`;
    expect(element.querySelector('img')).toBeNull();
    expect(element.textContent).toBe(payload);
    expect(element.querySelector('span')!.getAttribute('title')).toBe(payload);
});
