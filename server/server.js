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
const cheerio = require('cheerio');
const alllowedCORS = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003']

const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT)


//AUTHENTICATION
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
    if (err) return res.sendStatus(401);
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
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '100h' });

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

  if (conform_password != password) {
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

//   try {
//     const ticket = await client.verifyIdToken({
//       idToken: token,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });

//     const payload = ticket.getPayload();
//     const { sub: googleId, email, given_name, family_name, picture } = payload;

//     let user = await User.findOne({ where: { googleId } });

//     if (!user) {
//       user = await User.create({
//         googleId,
//         email,
//         firstName: given_name,
//         familyName: family_name,
//         photo: picture,
//       });
//     }

//     const jwtToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

//     res.json({ token: jwtToken, user });

//   } catch (error) {
//     console.error('Google token verify error', error);
//     res.status(401).json({ error: 'Invalid Google token' });
//   }
// });





// app.get('/', (req, res) => {
//   res.send(`<h1>Welcome</h1><a href="/auth/google">Login with Google</a>`);
// });



//GOOGLE LOGIN
app.get('/', async (req, res) => {
  const code = req.query.code;

  if (!code) {

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ].join(' '),
      prompt: "consent"
    });
    return res.redirect(url);
  }


  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const { data: profile } = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo',
    });

    const [user, created] = await User.findOrCreate({
      where: { email: profile.email },
      defaults: {
        googleId: profile.sub,
        firstName: profile.given_name,
        familyName: profile.family_name,
        email: profile.email,
        photo: profile.picture,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        password: null
      }
    });

    if (!created) {
      await user.update({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || user.refreshToken, // preserve old if new not provided
      });
    }

    const jwtToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: "✅ Successfully authenticated!",
      token: jwtToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        familyName: user.familyName,
        email: user.email,
        photo: user.photo
      }
    });
  } catch (err) {
    console.error('Error getting tokens:', err);
    res.send("Error during authentication.");
  }
});

app.post('/auth/google/code-exchange', async (req, res) => {
  const { code } = req.body;

  try {
    const { tokens } = await oauth2Client.getToken({
      code,
      redirect_uri: 'http://localhost:5000/auth/google/code-exchange',
    });
    oauth2Client.setCredentials(tokens);

    const { data: profile } = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo',
    });

    let user = await User.findOne({ where: { email: profile.email } });

    if (!user) {
      user = await User.create({
        googleId: profile.sub,
        email: profile.email,
        firstName: profile.given_name,
        familyName: profile.family_name,
        photo: profile.picture,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });
    } else {
      await user.update({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || user.refreshToken,
      });
    }

    const jwtToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token: jwtToken, user });

  } catch (error) {
    console.error("Google code exchange failed:", error);
    res.status(500).json({ error: "Failed to exchange code" });
  }
});

// app.post('/auth/google', async (req, res) => {
//   const { code } = req.body;

//   try {
//     const { tokens } = await oauth2Client.getToken(code);
//     oauth2Client.setCredentials(tokens);

//     console.log(tokens)

//     const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
//       headers: { Authorization: `Bearer ${tokens.access_token}` }
//     });

//     const [user, created] = await User.findOrCreate({
//       where: { email: profile.email },
//       defaults: {
//         googleId: profile.sub,
//         firstName: profile.given_name,
//         familyName: profile.family_name,
//         email: profile.email,
//         photo: profile.picture,
//         password: null
//       }
//     });

//     const jwtToken = jwt.sign(
//       { id: user.id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: '1h' }
//     );

//     res.json({
//       token: jwtToken,
//       user: {
//         id: user.id,
//         firstName: user.firstName,
//         email: user.email,
//         photo: user.photo
//       }
//     });

//   } catch (err) {
//     console.error("Google Auth Error:", err);
//     res.status(500).json({ error: "Google login failed" });
//   }
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

// app.get('/', async (req, res) => {
//   const code = req.query.code;

//   if (!code) {
//     const url = oauth2Client.generateAuthUrl({
//       access_type: "offline",
//       scope: 'https://www.googleapis.com/auth/calendar',
//       prompt: "consent"
//     });
//     return res.redirect(url);
//   }

//   try {
//     const { tokens } = await oauth2Client.getToken(code);
//     oauth2Client.setCredentials(tokens);


//     console.log('Tokens received:', tokens);

//     const payload = {
//       email: tokens.email,
//       access_token: tokens.access_token,
//       refresh_token: tokens.refresh_token
//     };

//     const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

//     res.json({
//       message: "✅ Successfully authenticated with Google Calendar!",
//       token: token
//     });
//   } catch (err) {
//     console.error('Error getting tokens:', err);
//     res.send("❌ Error during authentication. Please try again.");
//   }
// });


app.get('/calendars', (req, res) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  calendar.calendarList.list({}, (err, result) => {
    if (err) {
      console.error('Error fetching calendar list', err);
      return res.send('Error fetching calendars');
    }

    const calendars = result.data.items.map(cal => ({
      id: cal.id,
      summary: cal.summary,
    }));

    res.json(calendars);
  });
});

app.get('/all-events', async (req, res) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const list = await calendar.calendarList.list();
    const calendars = list.data.items;

    const eventsPromises = calendars.map(cal =>
      calendar.events.list({
        calendarId: cal.id,
        timeMin: new Date().toISOString(),
        maxResults: 15,
        singleEvents: true,
        orderBy: 'startTime'
      }).then(res => ({
        calendar: cal.summary,
        events: res.data.items
      }))
    );

    const allEvents = await Promise.all(eventsPromises);
    res.json(allEvents);
  } catch (err) {
    console.error('Error fetching events', err);
    res.send('Error loading events');
  }
});



app.post("/add-event", authenticateJWT, async (req, res) => {
  const {
    summary,
    description,
    start,
    end } = req.body
  const user = req.user

  if (!summary || !description || !start) {
    return res.status(400).send({ error: "Missing requirement fields" })
  }

  // const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  try {
    //   const user = await User.findByPk(req.user.id);
    //   if (!user || !user.accessToken) {
    //     return res.status(401).send({ error: "User not authenticated with Google" });
    //   }

    //   // Step 2: Set token on oauth2Client
    //   oauth2Client.setCredentials({
    //     access_token: user.accessToken,
    //     refresh_token: user.refreshToken // optional but recommended
    //   });

    //   // Step 3: Use Google Calendar API
    //   const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    //   await calendar.events.insert({
    //     calendarId: "primary",
    //     requestBody: {
    //       summary,
    //       description,
    //       start: { dateTime: start },
    //       end: { dateTime: end },
    //     }
    //   });

    //   res.send({ msg: "Event created successfully" });


    const event = await Event.create({
      title: summary,
      datetime: start,
      userId: user.id,  // Assuming `userId` is the ID of the user creating the event
      description: description || ''
    });

    // Send a success response with the created event
    res.status(201).json({
      message: 'Event created successfully!',
      event
    });
  } catch (error) {
    res.status(500).send({
      error: "An error occurred while creating the event",
      details: error.message,
    })
  }

})

app.get('/events/getEvents', authenticateJWT, async (req, res) => {
  const month = parseInt(req.query.month);
  const year = parseInt(req.query.year);
  console.log(month)
  if (!month || !year) {
    return res.status(400).json({ error: "Please provide both month and year." });
  }

  const startDate = new Date(year, month - 1, 1); // month is 0-indexed
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(year, month, 0); // last day of month
  endDate.setHours(23, 59, 59, 999);

  try {
    const events = await Event.findAll({
      // where: {
      //   datetime: {
      //     [Op.between]: [startDate, endDate]
      //   }
      // }
    });

    res.status(200).json({ events });
  } catch (err) {
    console.error("❌ Error fetching events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});





function verifyToken(req, res, next) {
  const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];

  if (!token) {
    return res.status(403).send("❌ No token provided");
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send("❌ Invalid or expired token");
    }
    req.user = decoded;
    next();
  });
}





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

    if (ws.user.id === recipient.id) {
      return ws.send(JSON.stringify({ type: 'friendReqError', error: "You can't send a friend request to yourself." }))
    }

    if (ws.user.friends.includes(recipient.id)) {
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
    if (!requester) {
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
    if (!requester) {
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
  const {
    title,
    description,
    date,
    time,
    location,
    participants
  } = data;

  try {
    const creator = await User.findByPk(ws.user.id);
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
      userId: ws.user.id,
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
  const {
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

  try {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) throw new Error('Not valid sesion');
      currentUser = user;
    });

    const event = await Event.findByPk(eventId);
    if (!event) throw new Error('Event not found');

    if (!event.invitedUserIds.includes(currentUser.id)) {
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

  try {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) throw new Error('Not valid sesion');
      currentUser = user;
    });

    const event = await Event.findByPk(eventId);
    if (!event) throw new Error('Event not found');

    if (!event.invitedUserIds.includes(currentUser.id)) {
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

  try {
    var currentUser
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) throw new Error('Not valid sesion');
      currentUser = user;
    });

    if (type === 'markAsRead' && notificationId) {
      await Notification.destroy({ where: { id: notificationId } });
      ws.send(JSON.stringify({ type: 'notificationRemoved', notificationId }));
    }
  } catch (err) {
    console.error('Error deletng notification:', err);
    ws?.send?.(JSON.stringify({
      type: 'error',
      message: 'Internal server error',
    }));
  }
}

app.get('/events/getEvents', authenticateJWT, async (req, res) => {
  const day = parseInt(req.query.day)
  const month = parseInt(req.query.month)
  const year = parseInt(req.query.year)
  if (!month || !year) {
    res.status(400).json({ error: "Please provide month and year." })
  }

  let startDate = new Date(year, month, 1)
  startDate.setHours(0, 0, 0, 0)
  let endDate = new Date(year, month + 1, 0)
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
  catch (err) {
    res.status(500).json({ error: "Failed to fetch events" })
  }
})

app.get('/events/getEvent', authenticateJWT, async (req, res) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3000')
  const eventId = req.query.eventId;
  try {
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
  const userId = req.user.id;

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

  try {
    // Tuka she se sluchwa neshto
  } catch (err) {
    console.error('Error recomending events:', err);
    res.status(500).json({ error: 'Server error' });
  }
})

app.get('/syncGoogleCallendar', authenticateJWT, async (req, res) => {
  const userId = req.user.id;
  const userEvents = await Event.findAll({
    where: {
      userId: userId
    }
  })

  //Prashrtat se na Alek
  const response = await axios.post('http://localhost:5001/syncFromJavascript', {
    userEvents
  })

  res.status(response.status).json(response.data)
})

//Getting all the user calendars
app.get('/calendars', (req, res) => {
  const calendar = google.calendar({ version: "v3", auth: oauth2Client })
  calendar.calendarList.list({}, (err, response) => {
    if (err) {
      console.error("error fetching calendar", err)
      res.end("Error")
      return
    }

    const calendars = response.data.items
    res.json(calendars)
  })
})

//Getting events
app.get('/events', (req, res) => {
  const calendarId = req.query.calendar ?? 'primary'
  const calendar = google.calendar({ version: "v3", auth: oauth2Client })
  calendar.events.list({
    calendarId,
    timeMin: (new Date()).toISOString(),
    maxResults: 15,
    singleEvents: true,
    orderBy: "startTime"
  }, (err, response) => {
    if (err) {
      console.error("Cant fetch events")
      res.send("Error")
      return
    }

    const events = response.data.items
    res.json(events)
  })
})


// Enable CORS for the React frontend
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));


const { ApifyClient } = require('apify-client');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

/**
 * Get event recommendations based on date and city
 * @route GET /api/recommendations
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} city - City name (default: "Sofia, Bulgaria")
 * @returns {Array} - List of recommended events/activities
 */


app.get('/getRecommendations', async (req, res) => {
  try {
    // const { date, city = 'Sofia, Bulgaria' } = req.body
    const date = req.query.date; // ✅ FIXED\
    const city = req.query.city || 'Sofia, Bulgaria';
    console.log("jifdofjds")


    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD format.' });
    }

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    console.log(`Searching for events in ${city} on ${date}...`);

    // Step 1: Fetch real events from Apify Facebook scraper
    const apifyEvents = await fetchApifyEvents(city, date);
    console.log(`Found ${apifyEvents.length} real events from Apify`);

    // Step 2: Get AI-generated recommendations to fill gaps
    const aiEvents = await fetchAIRecommendations(city, formattedDate, 20);
    console.log(`Generated ${aiEvents.length} AI recommendations`);

    // Step 3: Combine events and format response
    const combinedEvents = formatEvents([...apifyEvents, ...aiEvents]).slice(0, 30);
    console.log(combinedEvents)
    res.json({
      date: formattedDate,
      city,
      events: combinedEvents
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      error: 'Failed to generate recommendations',
      message: error.message
    });
  }
});

/**
 * Fetch events from Apify's Facebook Events Scraper
 */
async function fetchApifyEvents(city, date) {
  const searchQuery = `${city} ${date}`;

  const input = {
    "searchQueries": [searchQuery],
    "startUrls": [],
    "maxEvents": 15
  };

  try {
    const run = await apifyClient.actor("UZBnerCFBo5FgGouO").call(input);
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    return items.filter(event => {
      // Filter out events that don't match our date
      const eventDate = new Date(event.utcStartDate);
      const requestDate = new Date(date);
      return eventDate.toDateString() === requestDate.toDateString();
    }).map(event => ({
      source: 'facebook',
      title: event.name,
      description: event.description ? truncateDescription(event.description, 200) : 'No description available',
      location: {
        name: event.location?.name || 'Location TBD',
        mapsLink: generateMapsLink(event.location)
      },
      time: {
        start: formatEventTime(event.startTime),
        end: event.duration ? calculateEndTime(event.startTime, event.duration) : 'TBD'
      },
      link: event.url,
      imageUrl: event.imageUrl || null,
      attendees: {
        going: event.usersGoing || 0,
        interested: event.usersInterested || 0
      },
      organizer: event.organizedBy?.replace('Event by ', '') || null
    }));
  } catch (error) {
    console.error('Error fetching Apify events:', error);
    return [];
  }
}

/**
 * Generate event recommendations using OpenAI
 */
async function fetchAIRecommendations(city, formattedDate, count) {
  if (count <= 0) return [];

  try {
    // Create an assistant with web browsing capabilities
    const assistant = await openai.beta.assistants.create({
      name: "Event Finder",
      instructions: "You are an assistant that searches for events and activities. Return only valid JSON that can be parsed without errors.",
      model: "gpt-4.1",
      //   tools: [{
      //     // type: "web_search_preview",
      //     user_location: {
      //         type: "approximate",
      //         country: "BG",
      //         city: "Sofia",
      //         region: "Sofia"
      //     },
      //     search_context_size: "medium",
      // }],
    });

    // Create a thread
    const thread = await openai.beta.threads.create();

    // Add a message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `Find ${count} interesting events that are suitable for a group of friends in ${city} on ${formattedDate}.
      
      Search for real events happening on that date. If the date is too far in the future and specific events aren't listed yet, find typical events that happen in ${city} during that time of year.
      
      For each event, provide:
      - Title
      - Description (brief overview of what it's about)
      - Location name
      - Time (start and end)
      - Link to the event page (if available)
      - Google Maps link for the location
      - Image URL (if available)
      
      Include a diverse mix of cultural events, outdoor activities, food experiences, concerts, parties, social events, IT exhibitions, sports events, and other interesting activities appropriate for a group of friends. Consider the season and typical weather.
      
      Return the data in valid JSON format with an 'events' array containing all events.`
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id
    });

    // Poll for the run completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);

    // Wait for the assistant to complete
    while (runStatus.status !== 'completed') {
      // If run requires action (like function calling), handle it here
      if (runStatus.status === 'requires_action') {
        console.log("Run requires action");
      }


      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    // Get the messages from the thread
    const messages = await openai.beta.threads.messages.list(thread.id);

    // Get the last message from the assistant
    const lastMessage = messages.data
      .filter(message => message.role === 'assistant')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

    // Extract the content of the message
    const responseContent = lastMessage.content[0].text.value;

    // Parse JSON from the response
    let events = [];
    try {
      // Try to parse the entire response as JSON
      const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/) ||
        responseContent.match(/{[\s\S]*}/);

      const jsonString = jsonMatch ?
        (jsonMatch[1] || jsonMatch[0]) :
        responseContent;

      const parsedData = JSON.parse(jsonString);
      events = parsedData.events || [];
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      // Fallback to empty events array
    }

    // Clean up - delete the assistant and thread when done
    await openai.beta.assistants.del(assistant.id);

    return events.map(event => ({
      source: 'ai',
      title: event.title || 'Untitled Event',
      description: event.description || 'No description available',
      location: {
        name: event.location || event.location_name || 'Location TBD',
        mapsLink: event.mapsLink || event.maps_link ||
          `https://www.google.com/maps/search/${encodeURIComponent((event.location || event.location_name || city) + ', ' + city)}`
      },
      time: {
        start: event.time?.start || event.start_time || 'TBD',
        end: event.time?.end || event.end_time || 'TBD'
      },
      link: event.link || event.url || null,
      imageUrl: event.imageUrl || event.image_url || event.image || null
    }));
  } catch (error) {
    console.error('Error getting AI recommendations:', error);
    return generateFallbackEvents(city, count);
  }
}

/**
 * Generate fallback events if both APIs fail
 */
function generateFallbackEvents(city, count) {
  const fallbackEvents = [];
  const categories = [
    'Museum Visit', 'City Tour', 'Local Market', 'Park Adventure',
    'Food Festival', 'Concert', 'Art Exhibition', 'Theater Show',
    'Comedy Night', 'Rooftop Bar', 'Historic Site', 'Local Cuisine',
    'Dance Party', 'Outdoor Activity', 'Shopping District', 'Craft Workshop',
    'Photography Tour', 'Wine Tasting', 'Street Performance', 'Local Festival'
  ];

  for (let i = 0; i < Math.min(count, categories.length); i++) {
    fallbackEvents.push({
      source: 'fallback',
      title: `${categories[i]} in ${city}`,
      description: `Explore ${city} with this recommended activity: ${categories[i]}`,
      location: {
        name: `Various locations in ${city}`,
        mapsLink: `https://www.google.com/maps/search/${encodeURIComponent(categories[i] + ' in ' + city)}`
      },
      time: {
        start: '10:00',
        end: '22:00'
      },
      link: null,
      imageUrl: null
    });
  }

  return fallbackEvents;
}

/**
 * Format and ensure consistent structure for all events
 */
function formatEvents(events) {
  return events.map(event => ({
    title: event.title,
    description: event.description,
    location: event.location,
    time: event.time,
    link: event.link || null,
    imageUrl: event.imageUrl,
    source: event.source,
    ...(event.attendees && { attendees: event.attendees }),
    ...(event.organizer && { organizer: event.organizer })
  }));
}

/**
 * Truncate description to specified length
 */
function truncateDescription(description, maxLength) {
  if (!description || description.length <= maxLength) return description;
  return description.substring(0, maxLength) + '...';
}

/**
 * Generate Google Maps link from location object
 */
function generateMapsLink(location) {
  if (!location) return null;

  let searchQuery;
  if (location.latitude && location.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  } else if (location.name) {
    searchQuery = location.name;
    if (location.city) searchQuery += `, ${location.city}`;
    if (location.streetAddress) searchQuery = `${location.streetAddress}, ${searchQuery}`;
    return `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
  }
  return null;
}

/**
 * Format event time from various formats
 */
function formatEventTime(timeString) {
  if (!timeString) return 'TBD';
  // Handle common time formats returned by the Facebook API
  // This is a basic implementation - expand as needed
  return timeString.replace(/EEST|UTC/g, '').trim();
}

/**
 * Calculate end time based on start time and duration
 */
function calculateEndTime(startTime, duration) {
  // This is a basic implementation - you may need to improve it
  if (!startTime || !duration) return 'TBD';
  try {
    return `End time estimated based on ${duration} duration`;
  } catch (e) {
    return 'TBD';
  }
}

// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET /getRecommendations?date=YYYY-MM-DD&city=CityName');
  console.log('- GET /health');
});
