import * as signalR from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.token = null;
  }

  startConnection = async (token) => {
    this.token = token;
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7262/chatHub",{
        withCredentials: true, // Must match backend CORS configuration
        accessTokenFactory: () => this.token // Add JWT token for authentication

      })
      .configureLogging(signalR.LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    try {
      await this.connection.start();
      console.log("SignalR Connected.");
    } catch (err) {
      console.log("Error while establishing connection: ", err);
      setTimeout(this.startConnection, 5000); // Retry connection every 5 seconds
    }

    this.connection.onclose(async () => {
      console.log("SignalR Disconnected.");
      await this.startConnection();
    });
  };

  sendMessageToAll = async (message) => {
    try {
      await this.connection.invoke("SendMessageToAllUsersAsync", message);
    } catch (err) {
      console.error(err);
    }
  };

  onReceiveMessage = (callback) => {
    this.connection.on("SendMessageToAllUsersAsync", callback);
  };
  stopConnection = async () => {
    if (this.connection) {
      await this.connection.stop();
    }
  };
}

const signalRService = new SignalRService();
export default signalRService;