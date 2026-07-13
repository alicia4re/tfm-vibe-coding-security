/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import * as cheerio from 'cheerio';
import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Load Firebase config dynamically
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  let firebaseConfig: any = {};
  if (fs.existsSync(configPath)) {
    try {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      console.error('Error reading firebase-applet-config.json:', e);
    }
  }

  // Initialize Firebase client in Server
  let db: any = null;
  if (firebaseConfig.apiKey) {
    try {
      const firebaseApp = initializeApp({
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId,
      });
      db = initializeFirestore(firebaseApp, {}, firebaseConfig.firestoreDatabaseId || '(default)');
      console.log('Firebase Firestore initialized in server.');
    } catch (e) {
      console.error('Error initializing Firebase in server:', e);
    }
  }

  // API: Link Preview Scraper
  app.get('/api/link-preview', async (req, res) => {
    const urlStr = req.query.url as string;
    if (!urlStr) {
      return res.status(400).json({ error: 'Falta el parámetro URL' });
    }

    try {
      let targetUrl = urlStr;
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout

      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
        }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Error de red: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const title = $('meta[property="og:title"]').attr('content') ||
                    $('meta[name="twitter:title"]').attr('content') ||
                    $('title').text() ||
                    urlStr;

      let image = $('meta[property="og:image"]').attr('content') ||
                  $('meta[name="twitter:image"]').attr('content') ||
                  '';

      // Resolve relative image URLs
      if (image && !/^https?:\/\//i.test(image)) {
        try {
          image = new URL(image, targetUrl).toString();
        } catch (e) {
          // Keep it as is
        }
      }

      // If no image metadata is found, try to grab the first image from body
      if (!image) {
        const firstImg = $('img').first().attr('src');
        if (firstImg) {
          if (/^https?:\/\//i.test(firstImg)) {
            image = firstImg;
          } else {
            try {
              image = new URL(firstImg, targetUrl).toString();
            } catch (e) {
              // ignore
            }
          }
        }
      }

      res.json({
        url: targetUrl,
        title: title.trim(),
        image: image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=60' // default high-quality blog placeholder
      });
    } catch (error: any) {
      console.error(`Error fetching link preview for ${urlStr}:`, error.message);
      // Fallback gracefully instead of crashing
      res.json({
        url: urlStr,
        title: urlStr,
        image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=60'
      });
    }
  });

  // API: Public Articles (Read-only API for published articles)
  app.get('/api/published-articles', async (req, res) => {
    // Check API token via Authorization header or query param
    let token = req.query.api_token as string;
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'No autorizado. Se requiere un token de API válido.' });
    }

    if (!db) {
      return res.status(503).json({ error: 'La base de datos de Firebase no está disponible.' });
    }

    try {
      // 1. Validate API Token against Users collection
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('apiToken', '==', token));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        return res.status(401).json({ error: 'Token de API no válido.' });
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();

      // 2. Query published articles
      const articlesRef = collection(db, 'articles');
      const articlesQuery = query(
        articlesRef,
        where('status', '==', 'publicado'),
        orderBy('createdAt', 'desc')
      );
      const articlesSnapshot = await getDocs(articlesQuery);

      const articlesList = articlesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          content: data.content,
          authorName: data.authorName,
          authorEmail: data.authorEmail,
          tags: data.tags || [],
          linkPreviews: data.linkPreviews || [],
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
      });

      res.json({
        user: {
          email: userData.email,
          role: userData.role
        },
        articles: articlesList
      });
    } catch (error: any) {
      console.error('Error in /api/published-articles:', error);
      res.status(500).json({ error: 'Error interno del servidor al recuperar los artículos.' });
    }
  });

  // Vite development middleware vs. static production build serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
