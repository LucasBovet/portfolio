import { MongoClient } from 'mongodb';

let client;
let clientPromise;

async function getClientPromise() {
  if (clientPromise) return clientPromise;
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined in process.env');
    return null;
  }

  const options = {};
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
  return clientPromise;
}

export default async function handler(req, res) {
  const promise = await getClientPromise();

  if (!promise) {
    return res.status(500).json({ error: 'Database connection not configured. Set MONGODB_URI.' });
  }

  const client = await promise;
  const db = client.db('portfolio');
  const collection = db.collection('updates');

  if (req.method === 'GET') {
    try {
      const updates = await collection.find({}).sort({ date: -1, id: -1 }).toArray();
      res.status(200).json(updates);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch updates' });
    }
  } else if (req.method === 'POST') {
    const { title, content, tags, password, date, imageUrl } = req.body;

    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const newUpdate = {
        title,
        content,
        tags: tags || [],
        date: date || new Date().toISOString().split('T')[0],
        imageUrl: imageUrl || null,
        id: Date.now()
      };

      await collection.insertOne(newUpdate);
      res.status(201).json(newUpdate);
    } catch (error) {
      console.error('Save error:', error);
      res.status(500).json({ error: 'Failed to save update' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
