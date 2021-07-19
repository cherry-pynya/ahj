export default function post(file, url) {
  const http = url.replace('ws', 'http');
  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${http}/upload`);
  xhr.addEventListener('error', (e) => { throw new Error(e); });
  const data = new FormData();
  data.append('file', file);
  xhr.send(data);
}
