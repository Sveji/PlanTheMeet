const express = require('express');
const PORT = process.env.PORT || 5000;
const { Pool } = require('pg');
require('dotenv').config();
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const passport = require('passport');
const { sequelize } = require('./models/index');
const { User } = require('./models/user');
const { FriendRequest } = require('./models/friendRequest');
require('./auth/google');
const http = require('http');
const { Server } = require('ws');

sequelize.authenticate()
  .then(() => console.log('Database connection established successfully'))
  .catch(err => console.error('Unable to connect to the database:', err));

sequelize.sync({ force: true })
  .then(() => console.log('Database synced'))
  .catch(err => console.error('Sync error:', err));

const options = {
    origin: ["http://localhost:3000"],
}
    


const app = express();
app.use(cors(options));
app.use(express.json());
const server = http.createServer(app);
const wss = new Server({ server });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
});

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.post('/auth/login', async (req, res) => {
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000')
    const {
        email,
        password
    } = req.body;
    try {
      const user = await User.findOne({ where: { email } });
      if (!user || !user.password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
  
      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      res.json({ token, user });
    } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to login" });
    }
});

app.post('/auth/register', async (req, res) => {
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000')
    const {
        email,
        firstName,
        familyName,
        password,
        conform_password
    } = req.body;

    if( conform_password != password){
        res.status(400).json({ error: "Passwords do not match" });
    }
    try {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(400).json({ message: 'Email already in use' });
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ email, password: hashedPassword, firstName, familyName });
  
      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      res.json({ token, user });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to login" });
    }
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err || !user) {
        console.log('Hit with err:', err)
        return res.status(401).json({ message: 'Authentication failed', error: err });
      }
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      console.log(token)
  
      return res.json({ token, user });
    })(req, res, next);
});

app.get('/', (req, res) => {
    res.send(`<h1>Welcome</h1><a href="/auth/google">Login with Google</a>`);
  });
  
////////////////////////
// Web socket server
////////////////////////

wss.on('connection', async (ws, req) => {
  console.log('Client trying to connect via WebSocket');

  ws.isAlive = true;
  ws.user = null;

  ws.once('message', async (msg) => {
    try {
      const data = JSON.parse(msg);

      if (!data.token) {
        ws.send(JSON.stringify({ error: 'Missing token' }));
        return ws.close();
      }

      const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);

      if (!user) {
        ws.send(JSON.stringify({ error: 'Invalid user' }));
        return ws.close();
      }

      ws.user = user;
      ws.send(JSON.stringify({ message: `Authenticated as ${user.email}` }));

      ws.on('message', async (message) => {
        const data = JSON.parse(message);
        switch (data.type) {
          case 'addFriend':
            await addFriendRequest(ws, data);
            break;
          case 'acceptFriend':
            await acceptFriendRequest(ws, data);
            break;
          case 'rejectFriend':
            await rejectFriendRequest(ws, data);
            break;
          default:
            ws.send(JSON.stringify({ error: 'Invalid message type' }));
        }
      });

    } catch (err) {
      console.error('WebSocket Auth Error:', err.message);
      ws.send(JSON.stringify({ error: 'Unauthorized' }));
      ws.close();
    }
  });
});

async function addFriendRequest(ws, data) {
  try {
    const { email } = data;
    const recipient = await User.findOne({ where: { email: email } });

    if (!recipient) {
      return ws.send(JSON.stringify({ error: 'User not found' }));
    }

    const existingRequest = await FriendRequest.findOne({
      where: {
        requesterId: ws.user.id,
        recipientId: recipient.id,
        status: 'pending',
      },
    });

    if (existingRequest) {
      return ws.send(JSON.stringify({ message: 'Friend request already sent' }));
    }

    const friendRequest = await FriendRequest.create({
      requesterId: ws.user.id,
      recipientId: recipient.id,
      status: 'pending',
    });

    wss.clients.forEach(client => {
      if (client.readyState === ws.OPEN && client.user && client.user.id === recipient.id) {
        client.send(JSON.stringify({
          message: `You have a new friend request from ${ws.user.email}`,
          requestId: friendRequest.id,
        }));
      }
    });

    ws.send(JSON.stringify({ message: `Friend request sent to ${recipient.email}` }));

  } catch (err) {
    console.error('Error adding friend request:', err);
    ws.send(JSON.stringify({ error: 'Error sending friend request' }));
  }
}

async function acceptFriendRequest(ws, data) {
  try {
    const { requestId } = data;
    const request = await FriendRequest.findByPk(requestId);

    if (!request || request.recipientId !== ws.user.id || request.status !== 'pending') {
      return ws.send(JSON.stringify({ error: 'Invalid or expired request' }));
    }

    request.status = 'accepted';
    await request.save();

    const requester = await User.findByPk(request.requesterId);
    requester.friends.push(ws.user.id);
    ws.user.friends.push(requester.id);
    
    await requester.save();
    await ws.user.save();

    wss.clients.forEach(client => {
      if (client.readyState === ws.OPEN) {
        if (client.user.id === ws.user.id) {
          client.send(JSON.stringify({ message: `You accepted the friend request from ${requester.email}` }));
        }
        if (client.user.id === requester.id) {
          client.send(JSON.stringify({ message: `${ws.user.email} accepted your friend request` }));
        }
      }
    });

  } catch (err) {
    console.error('Error accepting friend request:', err);
    ws.send(JSON.stringify({ error: 'Error accepting friend request' }));
  }
}

async function rejectFriendRequest(ws, data) {
  try {
    const { requestId } = data;
    const request = await FriendRequest.findByPk(requestId);

    if (!request || request.recipientId !== ws.user.id || request.status !== 'pending') {
      return ws.send(JSON.stringify({ error: 'Invalid or expired request' }));
    }

    request.status = 'rejected';
    await request.save();

    const requester = await User.findByPk(request.requesterId);
    wss.clients.forEach(client => {
      if (client.readyState === ws.OPEN) {
        if (client.user.id === ws.user.id) {
          client.send(JSON.stringify({ message: `You rejected the friend request from ${requester.email}` }));
        }
        if (client.user.id === requester.id) {
          client.send(JSON.stringify({ message: `${ws.user.email} rejected your friend request` }));
        }
      }
    });

  } catch (err) {
    console.error('Error rejecting friend request:', err);
    ws.send(JSON.stringify({ error: 'Error rejecting friend request' }));
  }
}

app.get('/getFriends', authenticateJWT, async (req, res) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3000')
  const searchQuery = req.query.query?.toLowerCase() || '';

  try {
    const currentUser = await User.findByPk(req.user.id);

    if (!currentUser || !Array.isArray(currentUser.friends)) {
      return res.status(404).json({ message: 'User not found or has no friends :(' });
    }

    const friendIds = currentUser.friends;

    const friends = await User.findAll({
      where: {
        id: friendIds,
        ...(searchQuery && {
          username: { [Op.iLike]: `%${searchQuery}%` },
        }),
      },
      attributes: ['id', 'firstName', 'familyName', 'photo'],
    });

    res.json(friends);
  } catch (err) {
    console.error('Error fetching friends:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});