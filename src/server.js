import express from 'express';
import { createServer } from 'http';           
import { Server } from 'socket.io';            
import { initSocket } from './socket/socketManager.js'; 
import connectDb from './config/connectDb.js';
import dns from 'node:dns';
import authRoutes from './routers/authRoutes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// Routers
import meetingRouter from './routers/meetingRouter.js';
import notesRouter from './routers/notesRouter.js';
import disputeRouter from './routers/disputeRouter.js';
import organizationRouter from './routers/organization.js';
import anonymousRouter from './routers/Anonymous.js';

// Vercel might have issues with setServers depending on permissions
// try {
//     dns.setServers(['1.1.1.1', '8.8.8.8']);
// } catch (e) {
//     console.warn("DNS setServers failed:", e.message);
// }

const app = express();

app.use(cors({ 
    origin: ['https://meeting-mind-frontend-rbky.vercel.app', 'http://localhost:5173', 'http://localhost:3000'], 
    credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/meetings', meetingRouter);
app.use('/notes', notesRouter);
app.use('/dispute', disputeRouter);
app.use('/organizations', organizationRouter);
app.use('/anonymous', anonymousRouter);

app.get('/', (req, res) => {
    res.send('Server is running');
});

// Database connection (started but not blocking for Serverless)
connectDb()
    .then(() => console.log("MongoDb connected"))
    .catch(err => console.error("MongoDB connection failed:", err));

// For local development or platforms where persistent connections work
// Vercel doesn't support persistent Socket.IO connections in Serverless Functions
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;

if (!isVercel) {
    const PORT = process.env.PORT || 5000;
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: true,
            credentials: true
        }
    });

    initSocket(io);

    httpServer.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
}

export default app;