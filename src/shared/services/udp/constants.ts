export enum UDP_STATE {
    UDP_STATE_READY = "udp_state_ready",
    UDP_STATE_ERROR = "udp_state_error"
  }
  
  export const UDP_BROADCAST_ADDRESS = "255.255.255.255";
  export const DEFAULT_UDP_SERVER_PORT = 22001;
  export const INACTIVITY_THRESHOLD = 15000;
  export const CHECK_INTERVAL = 1000;
  
  export enum UDP_PROTOCOL_MESSAGES {
    HELLO = "hello",
    HEARTBEAT = "heartbeat",
    CALL_FUNCTION = "call_function",
    RESULT_OK = "result_ok",
    RESULT_ERROR = "result_error",
  }

  export enum SOCKET_EVENTS {
    LISTENING = "listening",
    ERROR = "error",
    MESSAGE = "message"
  }
  export enum CLIENT_STATE {
    INITIAL = 'INITIAL',
    CONNECTED = 'CONNECTED',
    DISCONNECTED = 'DISCONNECTED'
}