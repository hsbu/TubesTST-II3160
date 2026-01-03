const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Middleware
app.use(cors());
app.use(express.json());

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Connected to Supabase.');

// Middleware: JWT Auth
function jwtAuth(req, res, next) {
  const header = req.headers["authorization"] || "";
  const prefix = "Bearer ";

  if (!header.startsWith(prefix)) {
    return res.status(401).json({
      error: "TidakTerautentikasi",
      message: "Token Bearer tidak ditemukan. Tambahkan Authorization: Bearer <token>."
    });
  }

  const token = header.slice(prefix.length).trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { userId: String(decoded.userId), role: decoded.role };
    return next();
  } catch {
    return res.status(401).json({
      error: "TidakTerautentikasi",
      message: "Token tidak valid atau sudah kedaluwarsa."
    });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "AksesDitolak",
        message: "Anda tidak memiliki izin untuk mengakses endpoint ini."
      });
    }
    next();
  };
}

// GET all books (member & librarian)
app.get('/api/books', jwtAuth, requireRole('member', 'librarian'), async (req, res) => {
    try {
        console.log('Fetching all books...');
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .order('id');
        
        if (error) throw error;
        
        res.json({
            success: true,
            count: data.length,
            data: data
        });
    } catch (error) {
        console.error('Catch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET search books by genres (member & librarian)
app.get('/api/books/genres/:genres', jwtAuth, requireRole('member', 'librarian'), async (req, res) => {
    try {
        const { genres } = req.params;
        
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .ilike('genres', `%${genres}%`)
            .order('id');
        
        if (error) throw error;
        
        res.json({
            success: true,
            count: data.length,
            data: data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET search books by year (member & librarian)
app.get('/api/books/year/:year', jwtAuth, requireRole('member', 'librarian'), async (req, res) => {
    try {
        const { year } = req.params;
        
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .eq('year', parseInt(year))
            .order('id');
        
        if (error) throw error;
        
        res.json({
            success: true,
            count: data.length,
            data: data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET search books by author (member & librarian)
app.get('/api/books/author/:author', jwtAuth, requireRole('member', 'librarian'), async (req, res) => {
    try {
        const { author } = req.params;
        
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .ilike('authors', `%${author}%`)
            .order('id');
        
        if (error) throw error;
        
        res.json({
            success: true,
            count: data.length,
            data: data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single book by ID (member & librarian)
app.get('/api/books/:id', jwtAuth, requireRole('member', 'librarian'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Book not found' });
            }
            throw error;
        }
        
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new book (librarian only)
app.post('/api/books', jwtAuth, requireRole('librarian'), async (req, res) => {
    try {
        const { title, genres, authors, year } = req.body;
        
        if (!title || !genres || !authors || !year) {
            return res.status(400).json({ error: 'All fields are required: title, genres, authors, year' });
        }
        
        const { data, error } = await supabase
            .from('books')
            .insert([{ title, genres, authors, year }])
            .select()
            .single();
        
        if (error) throw error;
        
        res.status(201).json({
            success: true,
            message: 'Book created successfully',
            data: data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update book (librarian only)
app.put('/api/books/:id', jwtAuth, requireRole('librarian'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, genres, authors, year } = req.body;
        
        if (!title || !genres || !authors || !year) {
            return res.status(400).json({ error: 'All fields are required: title, genres, authors, year' });
        }
        
        const { data, error } = await supabase
            .from('books')
            .update({ title, genres, authors, year })
            .eq('id', id)
            .select()
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Book not found' });
            }
            throw error;
        }
        
        res.json({
            success: true,
            message: 'Book updated successfully',
            data: data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE book (librarian only)
app.delete('/api/books/:id', jwtAuth, requireRole('librarian'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from('books')
            .delete()
            .eq('id', id)
            .select()
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Book not found' });
            }
            throw error;
        }
        
        res.json({
            success: true,
            message: 'Book deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET books statistics (member & librarian)
app.get('/api/stats', jwtAuth, requireRole('member', 'librarian'), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('books')
            .select('year');
        
        if (error) throw error;
        
        const years = data.map(book => book.year);
        const stats = {
            totalBooks: data.length,
            oldestYear: Math.min(...years),
            newestYear: Math.max(...years)
        };
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('  GET    /api/books                      - Get all books');
    console.log('  GET    /api/books/:id                  - Get single book by ID');
    console.log('  GET    /api/books/genres/:genres       - Search books by genres');
    console.log('  GET    /api/books/year/:year           - Search books by year');
    console.log('  GET    /api/books/author/:author       - Search books by author');
    console.log('  POST   /api/books                      - Create new book');
    console.log('  PUT    /api/books/:id                  - Update book');
    console.log('  DELETE /api/books/:id                  - Delete book');
    console.log('  GET    /api/stats                      - Get books statistics');
});
