package com.wsworkflowmanager.app;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

/**
 * How the websocket messaging works:
 *
 * <p>Subscribe/unsubscribe: S/D <key|D> D D unsubs the connection to all its current topics S <key>
 * subscribes the connection to a specific topic the topic key format:
 * <clientId>:<entityType>:<entityId>
 *
 * <p>Sending updates to client. This is sent from the service and forwarded to client or stored in
 * redis without the key
 *
 * <p>UPSERT: U <key> data DELETE: D <key>
 */
@Component
public class Receiver extends TextWebSocketHandler {
  // Map to store connections by connection ID
  private final Map<String, WebSocketSession> connections = new ConcurrentHashMap<>();

  // Map to store (entity type, entity id) -> set of connection IDs
  private final Map<String, Set<String>> entityConnections = new ConcurrentHashMap<>();
  private final Map<String, Set<String>> entityConnectionsInv = new ConcurrentHashMap<>();
  private final PongManager pongManager = new PongManager(this.connections);

  @Override
  public void afterConnectionEstablished(WebSocketSession session) {
    String connectionId = session.getId();
    this.connections.put(connectionId, session);
  }

  @Override
  public void handleTextMessage(WebSocketSession session, TextMessage textMessage) {
    String message = textMessage.getPayload();

    System.out.println(message);

    if (message.contentEquals("ping")) {
      this.pongManager.addPong(session.getId());
      return;
    }

    String[] commandFull = message.split(" ");

    if (commandFull.length != 2) return;

    String command = commandFull[0];
    String arg = commandFull[1];

    this.handleCommand(session.getId(), command, arg);
  }

  private void handleCommand(String sessionId, String command, String arg) {
    if (command.equals("D") && arg.equals("D")) {
      Set<String> subscriptionKeys = entityConnectionsInv.get(sessionId);
      if (subscriptionKeys == null) return;

      for (String key : subscriptionKeys) {
        Set<String> subscribers = this.entityConnections.get(key);

        if (subscribers != null) subscribers.remove(sessionId);
      }

      this.entityConnectionsInv.remove(sessionId);
    } else if (command.equals("D")) {
      Set<String> subscribers = this.entityConnections.get(arg);

      if (subscribers != null) subscribers.remove(sessionId);
    } else if (command.equals("S")) {
      String[] keysToSubscribe = arg.split(";");

      for (String key : keysToSubscribe) {
        this.entityConnections.computeIfAbsent(key, k -> new HashSet()).add(sessionId);
        this.entityConnectionsInv.computeIfAbsent(sessionId, k -> new HashSet()).add(key);
        // TODO: send entity's history
      }
    }
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
    String sessionId = session.getId();
    connections.remove(sessionId);

    this.handleCommand(sessionId, "D", "D");
  }

  @RabbitListener(queues = App.registerQueueName)
  public void receiveMessageRegister(String message) {
    System.out.println("REGISTER: Received <" + message + ">");
    // TODO implement redis stuff
  }

  @RabbitListener(queues = App.notifyQueueName)
  public void receiveMessageNotify(String message) {
    RabbitMessage parsedMessage = new RabbitMessage(message);
    if (parsedMessage.isNull()) return;

    Set<String> connIds = new HashSet<>();

    for (String key : parsedMessage.keys) {
      Set<String> newConnIds = entityConnections.get(key);

      if (newConnIds != null) connIds.addAll(newConnIds);
    }

    for (String connId : connIds) {
      WebSocketSession session = connections.get(connId);
      if (session != null && session.isOpen()) {
        try {
          session.sendMessage(new TextMessage(parsedMessage.payload.translateEscapes()));
        } catch (Exception e) {
          // TODO: Handle or log exception
          e.printStackTrace();
        }
      }
    }
  }

  class RabbitMessage {
    public List<String> keys;
    public String payload;

    public RabbitMessage(String message) {
      int r = 0;
      while (r < message.length()) {
        if (message.charAt(r) == ' ') break;
        r++;
      }

      String[] keyParts = message.subSequence(0, r).toString().split(";");
      if (keyParts.length == 0) return;

      String clientId = keyParts[0];
      this.keys = new ArrayList<>();
      for (int i = 1; i < keyParts.length; i++) {
        this.keys.addLast(String.format("%s:%s", clientId, keyParts[i]));
      }

      this.payload = message.subSequence(r, message.length()).toString();
    }

    public boolean isNull() {
      return this.keys == null || this.keys.size() == 0;
    }
  }

  class PongManager {
    private final Deque<Pong> pongs = new ConcurrentLinkedDeque<>();
    private final Map<String, Boolean> registeredPongs = new ConcurrentHashMap<>();
    private final Map<String, WebSocketSession> connections;
    private final AtomicBoolean pongScheduled = new AtomicBoolean(false);
    private final ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();

    public PongManager(Map<String, WebSocketSession> connections) {
      this.connections = connections;
    }

    public void addPong(String sessionId) {
      if (!this.registeredPongs.containsKey(sessionId)) {
        this.registeredPongs.put(sessionId, true);
        this.pongs.addLast(new Pong(sessionId));
        this.schedulePongs();
      }
    }

    private void sendPongs() {
      List<Pong> pongsToSend = this.getAndRemoveOldPongs();

      for (Pong pong : pongsToSend) {
        WebSocketSession session = this.connections.get(pong.sessionId);
        if (session != null) {
          try {
            session.sendMessage(new TextMessage("pong"));
          } catch (Exception e) {
            // TODO: Handle or log exception
            e.printStackTrace();
          }
        }
      }

      this.pongScheduled.set(false);
    }

    // Cleanup method to remove old Pong instances
    public List<Pong> getAndRemoveOldPongs() {
      Instant queryStart = Instant.now();

      // Traverse and remove all elements older than queryStart
      List<Pong> pongsToSend = new ArrayList<>();
      Pong pong = this.pongs.peekFirst();

      while (pong != null && pong.timestamp.isBefore(queryStart)) {
        if (pong.timestamp.isBefore(queryStart)) {
          pongsToSend.addLast(pong);
          registeredPongs.remove(pong.sessionId);

          this.pongs.removeFirst();
        } else {
          break; // Stop as soon as we reach a Pong with a recent timestamp
        }

        pong = this.pongs.peekFirst();
      }
      ;

      return pongsToSend;
    }

    private void schedulePongs() {
      if (!this.pongScheduled.get()) {
        this.pongScheduled.set(true);
        this.executor.schedule(this::sendPongs, 10, TimeUnit.SECONDS);
      }
    }
  }

  class Pong {
    public Instant timestamp;
    public String sessionId;

    public Pong(String sessionId) {
      this.sessionId = sessionId;
      this.timestamp = Instant.now();
    }
  }
}
