Image uploader server (Express + Multer)

Requirements:
- Node 18.x (Render default recommended)
- A persistent disk mounted to store uploaded files (Render Persistent Disk)

Env vars:
- PORT (optional; Render provides one)
- UPLOADS_DIR (optional) - path where uploads are stored (recommended to set to the Render mounted path)
- RENDER_BASE_URL (optional) - used to construct public URLs; otherwise the server will build base URL from the request

Start:
- npm install
- npm start

File serving:
Uploaded files are served at:
  https://<your-render-domain>/uploads/<filename>
