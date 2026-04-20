const express = require('express');
const multer = require('multer');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'hillside_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Serve static files from the root directory
// But intercept /admin.html for auth check
app.use(express.static(__dirname, { index: 'index.html' }));

// --- Multer Setup for Image Uploads ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure directory exists
        const dir = path.join(__dirname, 'assets', 'images');
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- Helper Functions ---
function loadData() {
    try {
        const raw = fs.readFileSync(DATA_FILE);
        return JSON.parse(raw);
    } catch (e) {
        console.error("Error reading data.json:", e);
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// --- Auth Routes ---
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === 'admin123') {
        req.session.isAuthenticated = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.isAuthenticated = false;
    res.json({ success: true });
});

app.get('/api/check-auth', (req, res) => {
    res.json({ isAuthenticated: !!req.session.isAuthenticated });
});

// --- Content Routes ---
app.get('/api/content', (req, res) => {
    res.json(loadData());
});

// Route to update content (requires auth)
app.post('/api/content', upload.any(), (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    let data = loadData();

    // 1. Update text fields
    if (req.body.heroTitle) data.heroTitle = req.body.heroTitle;
    if (req.body.heroTagline) data.heroTagline = req.body.heroTagline;
    if (req.body.aboutHistory) data.aboutHistory = req.body.aboutHistory;

    // 2. Handle simple single uploads
    req.files.forEach(file => {
        const fieldName = file.fieldname;
        const filePath = 'assets/images/' + file.filename;

        if (fieldName === 'bgImage') {
            data.bgImage = filePath;
        } else if (fieldName === 'logoImage') {
            // we don't save logo path in data.json, we just override it or pass it.
            // Actually, we should save it in data.json to make it dynamic.
            data.logoImage = filePath;
        } else if (fieldName.startsWith('teacher_img_')) {
            const index = parseInt(fieldName.split('_')[2]);
            if (data.teachers[index]) {
                data.teachers[index].image = filePath;
            }
        } else if (fieldName.startsWith('gallery_img_')) {
            const index = parseInt(fieldName.split('_')[2]);
            if (data.gallery[index]) {
                data.gallery[index].image = filePath;
            }
        }
    });

    // 3. Update arrays (Teachers & Gallery text)
    if (req.body.teachers) {
        const parsedTeachers = JSON.parse(req.body.teachers);
        parsedTeachers.forEach((t, i) => {
            if (data.teachers[i]) {
                data.teachers[i].name = t.name;
                data.teachers[i].role = t.role;
                data.teachers[i].portfolio = t.portfolio;
            }
        });
    }

    if (req.body.gallery) {
        const parsedGallery = JSON.parse(req.body.gallery);
        parsedGallery.forEach((g, i) => {
            if (data.gallery[i]) {
                data.gallery[i].caption = g.caption;
            }
        });
    }

    saveData(data);
    res.json({ success: true, data });
});

// Start server
app.listen(PORT, () => {
    console.log(`CMS Server running on http://localhost:${PORT}`);
});
