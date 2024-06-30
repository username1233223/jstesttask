export enum UDP_STATE {
  UDP_STATE_READY = 'udp_state_ready',
  UDP_STATE_ERROR = 'udp_state_error',
}

export const UDP_BROADCAST_ADDRESS = '255.255.255.255';
export const DEFAULT_UDP_SERVER_PORT = 22001;
export const DEFAULT_EXPRESS_PORT = 9000;
export const INACTIVITY_THRESHOLD = 15000;
export const CHECK_INTERVAL = 1000;

export enum UDP_PROTOCOL_MESSAGES {
  HELLO = 'hello',
  HEARTBEAT = 'heartbeat',
  CALL_FUNCTION = 'call_function',
  RESULT_OK = 'result_ok',
  RESULT_ERROR = 'result_error',
}

export enum UDP_RESULT_ERROR {
  RECONNECT_NEED = 'reconnect_need',
  WRONG_ARGUMENTS = 'wrong_arguments',
  NO_SUCH_FUNCTION = 'no_such_function',
  NO_SUCH_CLIENT = 'no_such_client',
  CALL_FUNCTION_TIMEOUT = 'call_function_timeout',
  MISSING_CLIENT_ID = 'missing_client_id',
  MISSING_FUNCTION_NAME = 'missing_function_name',
}
export enum KEYPROTECTED_ERROR {
  KEYPROTECTED_MISSING_KEYFILE = 'keyprotected_missing_keyfile',
  KEYPROTECTED_KEY_TOO_SHORT = 'keyprotected_key_too_short',
  KEYPROTECTED_KEY_TOO_LONG = 'keyprotected_key_too_long',
  KEYPROTECTED_WRONG_PASSWORD = 'keyprotected_wrong_password',
  KEYPROTECTED_PASSWORD_REQUIRED = 'keyprotected_password_required',
  KEYPROTECTED_NO_CALLBACK = 'no_callback_specified',
}

export enum SOCKET_EVENTS {
  LISTENING = 'listening',
  ERROR = 'error',
  MESSAGE = 'message',
}
export enum CLIENT_STATE {
  INITIAL = 'INITIAL',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
}
