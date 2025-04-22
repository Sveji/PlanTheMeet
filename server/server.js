const express = require('express');
const PORT = process.env.PORT || 5000;
const { Pool } = require('pg');
require('dotenv').config();
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const passport = require('passport');
const { sequelize } = require('./models/index');
const User = require('./models/user');
const FriendRequest = require('./models/friendRequest');
const Event = require('./models/event');
const Notification = require('./models/notification');
require('./auth/google');
const http = require('http');
const { Server } = require('ws');
const { Op, where } = require('sequelize');
const { OAuth2Client, auth } = require('google-auth-library');
const axios = require('axios');
const { google } = require('googleapis');
const { oauth2Client } = require('./auth/google');

const alllowedCORS = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003']

sequelize.authenticate()
  .then(() => console.log('Database connection established successfully'))
  .catch(err => console.error('Unable to connect to the database:', err));

sequelize.sync({ alter: true })
  .then(() => console.log('Database synced'))
  .catch(err => console.error('Sync error:', err));

const app = express();
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || alllowedCORS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
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
      if (existing) return res.status(400).json({ error: 'Email already in use' });
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ email, password: hashedPassword, firstName, familyName });
  
      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      res.json({ token, user });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to login" });
    }
});

// app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// app.get('/auth/google/callback', (req, res, next) => {
//     passport.authenticate('google', { session: false }, (err, user, info) => {
//       if (err || !user) {
//         console.log('Hit with err:', err)
//         return res.status(401).json({ message: 'Authentication failed', error: err });
//       }
//       const token = jwt.sign(
//         {
//           id: user.id,
//           email: user.email
//         },
//         process.env.JWT_SECRET,
//         { expiresIn: '1h' }
//       );
//       console.log(token)
  
//       return res.json({ token, user });
//     })(req, res, next);
// });

app.post('/auth/google/token', async (req, res) => {
  const { token } = req.body;
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name, family_name, picture } = payload;

    let user = await User.findOne({ where: { googleId } });

    if (!user) {
      user = await User.create({
        googleId,
        email,
        firstName: given_name,
        familyName: family_name,
        photo: picture,
      });
    }

    const jwtToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token: jwtToken, user });

  } catch (error) {
    console.error('Google token verify error', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
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

      if (user.id) {
        const userId = user.id
        const notifications = await Notification.findAll({ where: { userId } });
    
        ws.send(JSON.stringify({
          type: 'notifications',
          notifications,
        }));
      }

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
          case 'addEvent':
            await addEvent(ws, data);
            break;
          case 'leaveEvent':
            await leaveEvent(ws, data);
            break;
          case 'acceptEventInvite':
            await acceptEventInvite(ws, data);
            break;
          case 'rejectEventInvite':
            await rejectEventInvite(ws, data);
            break;
          case 'markAsRead':
            await markAsRead(ws, data);
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
      return ws.send(JSON.stringify({ type: 'friendReqError', error: 'User not found.' }));
    }

    if(ws.user.id === recipient.id) {
      return ws.send(JSON.stringify({ type: 'friendReqError', error: "You can't send a friend request to yourself." }))
    }

    if(ws.user.friends.includes(recipient.id)) {
      return ws.send(JSON.stringify({ type: 'friendReqError', error: 'User is already your friend.' }))
    }

    const existingRequest = await FriendRequest.findOne({
      where: {
        requesterId: ws.user.id,
        recipientId: recipient.id,
        status: 'pending',
      },
    });

    if (existingRequest) {
      return ws.send(JSON.stringify({ type: 'friendReqError', error: 'Friend request already sent' }));
    }

    const friendRequest = await FriendRequest.create({
      requesterId: ws.user.id,
      recipientId: recipient.id,
      status: 'pending',
    });

    const notification = await Notification.create({
      userId: recipient.id,
      senderId: ws.user.id,
      data: { requestId: friendRequest.id },
      type: 'friendRequest',
      message: `${ws.user.firstName} ${ws.user.familyName} sent you a friend request!`,
    });

    wss.clients.forEach(client => {
      if (client.readyState === ws.OPEN && client.user && client.user.id === recipient.id) {
        client.send(JSON.stringify({
          type: 'notification',
          notification,
          requestId: friendRequest.id,
        }));
      }
    });

    ws.send(JSON.stringify({ message: `Friend request sent to ${recipient.email}` }));

  } catch (err) {
    console.error('Error adding friend request:', err);
    ws.send(JSON.stringify({ type: 'friendReqError', error: 'Error sending friend request' }));
  }
}

async function acceptFriendRequest(ws, data) {
  try {
    const { requestId } = data;
    const request = await FriendRequest.findByPk(requestId);
    console.log(request)
    if (!request || request.recipientId !== ws.user.id || request.status !== 'pending') {
      return ws.send(JSON.stringify({ error: 'Invalid or expired request' }));
    }

    const requester = await User.findByPk(request.requesterId);
    if(!requester) {
      return ws.send(JSON.stringify({ error: "Couldn't find requester." }))
    }
    requester.friends = [...requester.friends, ws.user.id];
    ws.user.friends = [...ws.user.friends, requester.id];

    await requester.save();
    await ws.user.save();


    request.status = 'accepted';
    await request.save();


    const notification = await Notification.create({
      userId: request.requesterId,
      senderId: request.recipientId,
      type: 'acceptedFriendRequest',
      message: `${requester.firstName} ${requester.familyName} accepted your friend request!`,
    });

    await Notification.destroy({
      where: {
        userId: request.recipientId, 
        senderId: request.requesterId,
        type: 'friendRequest'
      }
    });

    wss.clients.forEach(client => {
      if (client.readyState === ws.OPEN) {
        if (client.user.id === ws.user.id) {
          client.send(JSON.stringify({ type: 'acceptFriendSuccess', message: `You accepted the friend request from ${requester.email}`, requestId }));
        }
        if (client.user.id === requester.id) {
          client.send(JSON.stringify({ type: 'notification', notification }));
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

    const requester = await User.findByPk(request.requesterId);
    if(!requester) {
      return ws.send(JSON.stringify({ error: "Couldn't find requester." }))
    }

    request.status = 'rejected';
    await request.save();

    const notification = await Notification.create({
      userId: request.requesterId,
      senderId: request.recipientId,
      type: 'rejectFriendRequest',
      message: `${requester.firstName} ${requester.familyName} rejected your friend request!`,
    });

    await Notification.destroy({
      where: {
        userId: request.recipientId, 
        senderId: request.requesterId,
        type: 'friendRequest'
      }
    });

    // const requester = await User.findByPk(request.requesterId);
    wss.clients.forEach(client => {
      if (client.readyState === ws.OPEN) {
        if (client.user.id === ws.user.id) {
          client.send(JSON.stringify({ type: 'rejectFriendSuccess', message: `You rejected the friend request from ${requester.email}`, requestId }));
        }
        if (client.user.id === requester.id) {
          client.send(JSON.stringify({ type: 'notification', notification }));
        }
      }
    });

  } catch (err) {
    console.error('Error rejecting friend request:', err);
    ws.send(JSON.stringify({ error: 'Error rejecting friend request' }));
  }
}

async function addEvent(ws, data) {
  const{ 
    title,
    description,
    date,
    time,
    location,
    participants,
    creatorId 
  } = data;

  try {
    const creator = await User.findByPk(creatorId);
    if (!creator) {
      return ws?.send?.(JSON.stringify({ type: 'error', message: 'Creator not found' }));
    }

    const friendIds = creator.friends || [];
    const notFriends = participants.filter(id => !friendIds.includes(id));
    if (notFriends.length) {
      return ws?.send?.(JSON.stringify({
        type: 'error',
        message: `These users are not your friends: ${notFriends.join(', ')}`
      }));
    }

    const eventDatetime = new Date(`${date}T${time}`);
    const eventsOnThatDay = await Event.findAll({
      where: {
        datetime: {
          [Op.between]: [
            new Date(`${date}T00:00:00`),
            new Date(`${date}T23:59:59`)
          ],
        },
        [Op.or]: [
          { userId: { [Op.in]: participants } },
          { conformedUserIds: { [Op.overlap]: participants } },
        ],
      },
    });

    const busyUsers = new Set();
    for (const event of eventsOnThatDay) {
      if (participants.includes(event.userId)) busyUsers.add(event.userId);
      event.invitedUserIds?.forEach(id => {
        if (participants.includes(id)) busyUsers.add(id);
      });
      event.conformedUserIds?.forEach(id => {
        if (participants.includes(id)) busyUsers.add(id);
      });
    }

    if (busyUsers.size > 0) {
      return ws?.send?.(JSON.stringify({
        type: 'error',
        message: `These users are not available: ${[...busyUsers].join(', ')}`
      }));
    }

    const newEvent = await Event.create({
      title,
      description,
      datetime: eventDatetime,
      location,
      userId: creatorId,
      invitedUserIds: participants,
      conformedUserIds: [],
    });

    participants.forEach(pid => {
      const participantSocket = connectedClients.get(pid);
      if (participantSocket) {
        participantSocket.send(JSON.stringify({
          type: 'eventInvitation',
          event: newEvent,
        }));
      }
    });

    ws?.send?.(JSON.stringify({
      type: 'eventCreated',
      event: newEvent,
    }));

  } catch (err) {
    console.error('Error in handleAddEvent:', err);
    ws?.send?.(JSON.stringify({
      type: 'error',
      message: 'Internal server error',
    }));
  }
};

async function leaveEvent(ws, data) {
  const{ 
    token,
    eventId,
  } = data;

  var currentUser
  
  try {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) throw new Error('Not valid sesion');
      currentUser = user;
    });

    const event = await Event.findByPk(eventId);
    if (!event) throw new Error('Event not found');

    event.conformedUserIds = event.conformedUserIds.filter(id => id !== currentUser.id);
    await event.save();

    event.conformedUserIds.forEach(pid => {
      const participantSocket = connectedClients.get(pid);
      if (participantSocket) {
        participantSocket.send(JSON.stringify({
          message: `${currentUser.firstName} ${currentUser.familyName} left ${event.title}!`
        }));
      }
    });

    const hostSocket = connectedClients.get(event.userId);
    if (hostSocket) {
      hostSocket.send(JSON.stringify({
        message: `${currentUser.firstName} ${currentUser.familyName} left your event: ${event.title}!`
      }));
    }

    ws?.send?.(JSON.stringify({
      message: `You successfuly left event: ${event.title}!`
    }));

  } catch (err) {
    console.error('Error in leaveEvent:', err);
    ws?.send?.(JSON.stringify({
      type: 'error',
      message: 'Internal server error',
    }));
  }
};

async function acceptEventInvite(ws, data) {
  const {
    token,
    eventId,
  } = data

  var currentUser
  
  try{
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) throw new Error('Not valid sesion');
      currentUser = user;
    });

    const event = await Event.findByPk(eventId);
    if (!event) throw new Error('Event not found');

    if(!event.invitedUserIds.includes(currentUser.id)){
      throw new Error('You are not invited to this event');
    }

    if (!event.conformedUserIds.includes(currentUser.id)) {
      event.conformedUserIds.push(currentUser.id);
    }

    await event.save();

    const participantIds = [...event.invitedUserIds].filter(id => id !== currentUser.id);
    participantIds.forEach(pid => {
      const participantSocket = connectedClients.get(pid);
      if (participantSocket) {
        participantSocket.send(JSON.stringify({
          message: `${currentUser.firstName} ${currentUser.familyName} will come to: ${event.title}!`
        }));
      }
    });

    ws?.send?.(JSON.stringify({
      message: `You successfuly accepted the invite for: ${event.title}!`
    }));
  } catch (err) {
    console.error('Error accepting event invite:', err);
    ws?.send?.(JSON.stringify({
      type: 'error',
      message: 'Internal server error',
    }));
  }
  
}

async function rejectEventInvite(ws, data) {
  const {
    token,
    eventId,
  } = data

  var currentUser
  
  try{
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) throw new Error('Not valid sesion');
      currentUser = user;
    });

    const event = await Event.findByPk(eventId);
    if (!event) throw new Error('Event not found');

    if(!event.invitedUserIds.includes(currentUser.id)){
      throw new Error('You are not invited to this event');
    }

    if (!event.notCommingUserIds.includes(currentUser.id)) {
      event.notCommingUserIds.push(currentUser.id);
    }

    await event.save();

    const participantIds = [...event.invitedUserIds].filter(id => id !== currentUser.id);
    participantIds.forEach(pid => {
      const participantSocket = connectedClients.get(pid);
      if (participantSocket) {
        participantSocket.send(JSON.stringify({
          message: `${currentUser.firstName} ${currentUser.familyName} won't be able to come to: ${event.title}!`
        }));
      }
    });

    ws?.send?.(JSON.stringify({
      message: `You successfuly rejected the invite for: ${event.title}!`
    }));
  } catch (err) {
    console.error('Error accepting event invite:', err);
    ws?.send?.(JSON.stringify({
      type: 'error',
      message: 'Internal server error',
    }));
  }
  
}

async function markAsRead(ws, data) {
  const { token, type, notificationId } = data;

  try{
    var currentUser
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) throw new Error('Not valid sesion');
      currentUser = user;
    });
    
    if (type === 'markAsRead' && notificationId) {
      await Notification.destroy({ where: { id: notificationId } });
      ws.send(JSON.stringify({ type: 'notificationRemoved', notificationId }));
    }
  }catch (err) {
    console.error('Error deletng notification:', err);
    ws?.send?.(JSON.stringify({
      type: 'error',
      message: 'Internal server error',
    }));
  }
}

app.get('/events/getEvents', authenticateJWT, async (req, res) => {
  const month = parseInt(req.query.month)
  const year = parseInt(req.query.year)
  if(!month || !year) {
    res.status(400).json({ error: "Please provide month and year." })
  }

  const startDate = new Date(year, month, 1)
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(year, month + 1, 0)
  endDate.setHours(23, 59, 59, 999)
  
  try {
    const events = await Event.findAll({
      where: {
        [Op.or]: [
          {
            userId: req.user.id
          },
          {
            conformedUserIds: {
              [Op.contains]: [req.user.id]
            }
          }
        ],
        datetime: {
          [Op.between]: [startDate, endDate]
        }
      }
    })

    res.status(200).json({ events })
  }
  catch(err) {
    res.status(500).json({ error: "Failed to fetch events" })
  }
})

app.get('/events/getEvent', authenticateJWT, async (req, res) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3000')
  const eventId = req.query.eventId;
  try{
    const event = await Event.findByPk(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const host = await User.findByPk(event.userId, {
      attributes: ['id', 'username', 'profilePicture'],
    });

    const confirmedUsers = await User.findAll({
      where: {
        id: event.conformedUserIds || [],
      },
      attributes: ['id', 'username', 'profilePicture'],
    });

    const pendingUsers = await User.findAll({
      where: {
        id: event.invitedUserIds?.filter(id => !(event.conformedUserIds || []).includes(id)) || [],
      },
      attributes: ['id', 'username', 'profilePicture'],
    });

    res.json({
      title: event.title,
      description: event.description,
      dateTime: event.datetime,
      location: event.location,
      host: host,
      participants: {
        added: confirmedUsers,
        pending: pendingUsers,
      },
    })
  } catch (err) {
    console.error('Error getting events:', err);
    res.status(500).json({ message: 'Server error' });
  }
})

app.post('/events/editEvent', authenticateJWT, async (req, res) => {
  
  const {
    eventId,
    updatedData,
  } = req.data
  const event = await Event.findByPk(eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  await event.update(updatedData);
  res.json(event);
})

app.get('/getFriends', authenticateJWT, async (req, res) => {
  
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
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${searchQuery}%` } },
            { familyName: { [Op.iLike]: `%${searchQuery}%` } }
          ]
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

app.get('/events', authenticateJWT, async (req, res) => {
  
  const date = req.query.date;
  const userId  = req.user.id;

  if (!date || !userId) {
    return res.status(400).json({ error: 'Date and userId are required' });
  }

  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await Event.findAll({
      where: {
        datetime: {
          [Op.between]: [startOfDay, endOfDay],
        },
        [Op.or]: [
          { userId: userId },
          { invitedUserIds: { [Op.contains]: [parseInt(userId)] } },
          { conformedUserIds: { [Op.contains]: [parseInt(userId)] } },
        ],
      },
      order: [['datetime', 'ASC']],
    });

    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/events/getRecomendations', authenticateJWT, async (req, res) => {
  
  const userId = req.user.id;
  const {
    date,
    location,
  } = req.body

  try{
    // Tuka she se sluchwa neshto
  } catch (err) {
    console.error('Error recomending events:', err);
    res.status(500).json({ error: 'Server error' });
  }
})

app.get('/syncGoogleCallendar', authenticateJWT, async (req, res) => {
  const userId = req.user.id;
  const userEvents = await Event.findAll({where: {
    userId: userId
  }})
  
  //Prashrtat se na Alek
  const response = await axios.post('http://localhost:5001/syncFromJavascript', {
    userEvents
  })

  res.status(response.status).json(response.data)
})

// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
