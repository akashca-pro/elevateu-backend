import 'dotenv/config'
import { Server } from "socket.io";

const connectedUsers = {};

export const initializeSocket = (server) =>{
    const io = new Server(server, {
        cors : {
            origin : process.env.CLIENT_URL,
            methods : ['GET','POST']
        }
    })

    io.on('connection',(socket)=>{
        // console.log(`New client connected: ${socket.id}`);

        // Register user with their ID and role
        socket.on('register',({ userId, role })=>{
            connectedUsers[userId] = { socketId : socket.id, role };
            // console.log(`User ${userId} (${role}) registered with socket ${socket.id}`);
        })

        socket.on('disconnect',()=> {
            for(const userId in connectedUsers){
                if(connectedUsers[userId].socketId === socket.id){
                    delete connectedUsers[userId];
                    break;
                }
            }
        })
    })
    return io
}

export { connectedUsers }