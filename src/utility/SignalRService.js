import * as signalR from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.token = null;
    this.isConnected = false;
    this.connectionCallbacks = [];
  }

  startConnection = async (token) => {
    this.token = token;
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7262/chatHub", {
        withCredentials: true,
        accessTokenFactory: () => this.token
      })
      .configureLogging(signalR.LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    // Connection state handlers
    this.connection.onreconnecting(() => {
      this.isConnected = false;
      console.log("SignalR reconnecting...");
    });

    this.connection.onreconnected(() => {
      this.isConnected = true;
      console.log("SignalR reconnected.");
      this.executeQueuedCallbacks();
    });

    this.connection.onclose(async () => {
      this.isConnected = false;
      console.log("SignalR Disconnected.");
      await this.startConnection();
    });

    try {
      await this.connection.start();
      this.isConnected = true;
      console.log("SignalR Connected.");
      this.executeQueuedCallbacks();
    } catch (err) {
      console.log("Error while establishing connection: ", err);
      setTimeout(() => this.startConnection(token), 5000);
    }
  };

  executeQueuedCallbacks = () => {
    while (this.connectionCallbacks.length > 0) {
      const callback = this.connectionCallbacks.shift();
      callback();
    }
  };

  sendMessageToAll = async (message) => {
    if (!this.isConnected) {
      console.log("Queueing message - connection not ready");
      return new Promise((resolve) => {
        this.connectionCallbacks.push(() => {
          this.sendMessageToAll(message).then(resolve);
        });
      });
    }

    try {
      await this.connection.invoke("SendMessageToAllUsersAsync", message);
    } catch (err) {
      console.error("Error sending message:", err);
      throw err;
    }
  };

  onReceiveMessageHistory = (callback) => {
    this.connection.on("ReceiveMessageHistory", callback);
  };

  onReceiveMessage = (callback) => {
    this.connection.on("SendMessageToAllUsersAsync", callback);
  };

  stopConnection = async () => {
    if (this.connection) {
      this.isConnected = false;
      await this.connection.stop();
    }
  };
}

const signalRService = new SignalRService();
export default signalRService;