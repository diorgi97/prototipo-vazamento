// servidor Express + SQLite para protótipo
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.random().toString(36).slice(2,8);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});
const upload = multer({ storage });

const DB_FILE = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(DB_FILE);
const dbRun = promisify(db.run.bind(db));
const dbAll = promisify(db.all.bind(db));
const dbGet = promisify(db.get.bind(db));

(async () => {
  // cria tabela se não existir
  await dbRun(`CREATE TABLE IF NOT EXISTS inspections (
    id TEXT PRIMARY KEY,
    timestamp TEXT,
    department TEXT,
    section TEXT,
    location TEXT,
    machine_id TEXT,
    photo_path TEXT,
    note TEXT,
    sensor_value REAL,
    estimated_loss REAL,
    resolved INTEGER DEFAULT 0,
    resolved_at TEXT,
    created_by TEXT
  )`);
})();

// servir frontend estático
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

// criar inspeção (multipart/form-data: campo 'photo' opcional)
app.post('/api/inspections', upload.single('photo'), async (req, res) => {
  try {
    const id = require('crypto').randomUUID();
    const now = new Date().toISOString();
    const {
      department = '',
      section = '',
      location = '',
      machine_id = '',
      note = '',
      sensor_value = null,
      estimated_loss = null,
      created_by = ''
    } = req.body;
    const photo_path = req.file ? `/uploads/${req.file.filename}` : null;

    await dbRun(
      `INSERT INTO inspections (id,timestamp,department,section,location,machine_id,photo_path,note,sensor_value,estimated_loss,created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [id, now, department, section, location, machine_id, photo_path, note, sensor_value, estimated_loss, created_by]
    );
    res.json({ ok: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// listar inspeções (filtros: department, resolved)
app.get('/api/inspections', async (req, res) => {
  try {
    const { department, resolved } = req.query;
    let q = 'SELECT * FROM inspections WHERE 1=1';
    const params = [];
    if (department) { q += ' AND department = ?'; params.push(department); }
    if (resolved !== undefined) { q += ' AND resolved = ?'; params.push(resolved === '1' ? 1 : 0); }
    q += ' ORDER BY timestamp DESC';
    const rows = await dbAll(q, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// atualizar inspeção (ex: marcar resolvido)
app.put('/api/inspections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolved } = req.body;
    const resolved_at = resolved ? new Date().toISOString() : null;
    await dbRun('UPDATE inspections SET resolved = ?, resolved_at = ? WHERE id = ?', [resolved ? 1 : 0, resolved_at, id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// dashboard agregações por departamento
app.get('/api/dashboard', async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT department,
        COUNT(*) as total,
        SUM(resolved) as resolved_count,
        SUM(COALESCE(estimated_loss,0)) as total_estimated_loss
      FROM inspections
      GROUP BY department
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('App rodando em http://localhost:' + PORT));
