function initEditor(root) {
  const editor = root.querySelector('[data-editor]');
  const hidden = root.querySelector('[data-editor-target]');
  if (!editor || !hidden) return;
  const sync = () => { hidden.value = editor.innerHTML; };
  editor.addEventListener('input', sync);
  root.querySelectorAll('[data-command]').forEach(button => {
    button.addEventListener('click', () => {
      const command = button.dataset.command;
      if (command === 'createLink') {
        const url = window.prompt('URL del enlace');
        if (url) document.execCommand('createLink', false, url);
      } else if (command === 'insertImage') {
        const url = window.prompt('URL de la imagen');
        if (url) document.execCommand('insertImage', false, url);
      } else {
        document.execCommand(command, false, null);
      }
      sync();
    });
  });
  if (hidden.value) editor.innerHTML = hidden.value;
  sync();
}

function initPreview() {
  const input = document.querySelector('[data-preview-url]');
  const output = document.querySelector('[data-preview-output]');
  if (!input || !output) return;
  const render = () => {
    const url = input.value.trim();
    if (!url) {
      output.innerHTML = '<p>Introduce una URL para ver la vista previa.</p>';
      return;
    }
    output.innerHTML = '<p>Cargando vista previa…</p>';
    fetch(`/api/preview?url=${encodeURIComponent(url)}`)
      .then(res => res.json())
      .then(data => {
        output.innerHTML = `
          <div class="preview-card">
            <strong>${data.title || 'Sin título'}</strong>
            ${data.image ? `<img src="${data.image}" alt="Preview" style="width:100%;border-radius:12px;margin-top:.75rem;">` : '<p>Sin imagen disponible.</p>'}
          </div>`;
      })
      .catch(() => { output.innerHTML = '<p>No se pudo obtener la vista previa.</p>'; });
  };
  input.addEventListener('change', render);
  input.addEventListener('blur', render);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-editor-root]').forEach(initEditor);
  initPreview();
});
