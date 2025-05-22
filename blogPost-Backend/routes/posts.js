const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Get all posts (public)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT posts.id, posts.title, posts.content, posts.created_at, users.username
      FROM posts JOIN users ON posts.user_id = users.id
      ORDER BY posts.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching posts' });
  }
});

// Get user's own posts
router.get('/my-posts', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT posts.id, posts.title, posts.content, posts.created_at, users.username
      FROM posts JOIN users ON posts.user_id = users.id
      WHERE posts.user_id = ?
      ORDER BY posts.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching posts' });
  }
});

// Get single post by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT posts.id, posts.title, posts.content, posts.created_at, users.username
      FROM posts JOIN users ON posts.user_id = users.id
      WHERE posts.id = ?
    `, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching post' });
  }
});

// Create a new post
router.post('/', authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  try {
    await pool.query(
      'INSERT INTO posts (title, content, user_id) VALUES (?, ?, ?)',
      [title, content, userId]
    );
    res.status(201).json({ message: 'Post created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating post' });
  }
});

// Update a post
router.put('/:id', authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  const postId = req.params.id;
  const userId = req.user.id;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  try {
    const [result] = await pool.query(
      'UPDATE posts SET title = ?, content = ? WHERE id = ? AND user_id = ?',
      [title, content, postId, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(403).json({ error: 'Unauthorized or post not found' });
    }
    res.json({ message: 'Post updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating post' });
  }
});

// Delete a post
router.delete('/:id', authMiddleware, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  try {
    const [result] = await pool.query(
      'DELETE FROM posts WHERE id = ? AND user_id = ?',
      [postId, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(403).json({ error: 'Unauthorized or post not found' });
    }
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting post' });
  }
});

module.exports = router;