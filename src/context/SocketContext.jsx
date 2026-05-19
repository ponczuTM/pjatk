import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

const socket = io("http://192.168.68.247:3001");

export function SocketProvider({ children }) {
  const [state, setState] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    socket.on("stateUpdate", (data) => {
      setState({ ...data });
    });

    socket.on("usersUpdate", (data) => {
      setUsers(data);
    });

    return () => {
      socket.off("stateUpdate");
      socket.off("usersUpdate");
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, state, users }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}