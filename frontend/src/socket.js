import { io } from "socket.io-client";

// 🤖 DYNAMIC SOCKET URL: Automatically grabs the current network IP from the browser bar
const currentIP = window.location.hostname;

const socket = io(`http://${currentIP}:5000`, {
    auth: {
        token: localStorage.getItem("token")
    },
    // Kept to ensure smooth connection across different devices on your Wi-Fi
    transports: ['websocket', 'polling']
});

export default socket;