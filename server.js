const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Middleware
app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Get all books
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all books
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 */

// GET all books
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

/**
 * @swagger
 * /api/books/genres/{genres}:
 *   get:
 *     summary: Search books by genres
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: genres
 *         required: true
 *         schema:
 *           type: string
 *         description: Genre to search for
 *         example: Fiction
 *     responses:
 *       200:
 *         description: Books matching the genre
 *       401:
 *         description: Unauthorized
 */

// GET search books by genres 
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

/**
 * @swagger
 * /api/books/year/{year}:
 *   get:
 *     summary: Search books by year
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Publication year
 *         example: 2020
 *     responses:
 *       200:
 *         description: Books from the specified year
 *       401:
 *         description: Unauthorized
 */

// GET search books by year 
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

/**
 * @swagger
 * /api/books/author/{author}:
 *   get:
 *     summary: Search books by author
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: author
 *         required: true
 *         schema:
 *           type: string
 *         description: Author name to search for
 *         example: John
 *     responses:
 *       200:
 *         description: Books by the specified author
 *       401:
 *         description: Unauthorized
 */

// GET search books by author
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

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: Get a single book by ID
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Book ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Book details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Book'
 *       404:
 *         description: Book not found
 *       401:
 *         description: Unauthorized
 */

// GET single book by ID 
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

/**
 * @swagger
 * /api/books:
 *   post:
 *     summary: Create a new book (librarian only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - genres
 *               - authors
 *               - year
 *             properties:
 *               title:
 *                 type: string
 *                 example: New Book
 *               genres:
 *                 type: string
 *                 example: Fiction,Drama
 *               authors:
 *                 type: string
 *                 example: John Doe
 *               year:
 *                 type: integer
 *                 example: 2025
 *     responses:
 *       201:
 *         description: Book created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Librarian access only
 */

// POST create new book
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

/**
 * @swagger
 * /api/books/{id}:
 *   put:
 *     summary: Update a book (librarian only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Book ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - genres
 *               - authors
 *               - year
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Book
 *               genres:
 *                 type: string
 *                 example: Horror
 *               authors:
 *                 type: string
 *                 example: Jane Doe
 *               year:
 *                 type: integer
 *                 example: 2024
 *     responses:
 *       200:
 *         description: Book updated successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Librarian access only
 *       404:
 *         description: Book not found
 */

// PUT update book
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

/**
 * @swagger
 * /api/books/{id}:
 *   delete:
 *     summary: Delete a book (librarian only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Book ID
 *         example: 101
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Librarian access only
 *       404:
 *         description: Book not found
 */

// DELETE book
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

/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: Get books statistics
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Books statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalBooks:
 *                       type: integer
 *                       example: 100
 *                     oldestYear:
 *                       type: integer
 *                       example: 1950
 *                     newestYear:
 *                       type: integer
 *                       example: 2025
 *       401:
 *         description: Unauthorized
 */

// GET books statistics
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
