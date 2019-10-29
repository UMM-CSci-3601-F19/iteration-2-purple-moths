package umm3601.laundry;

import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

import java.util.Iterator;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static com.mongodb.client.model.Filters.eq;

public class LaundryController {
  private final MongoCollection<Document> roomCollection;
  private MongoCollection<Document> machineCollection;

  private MongoCollection<Document> machinePollingCollection;
  private MongoDatabase pullingDatabase;

  /*
   * This is a switch for the E2E test
   * before running the tests
   * set seedLocalSource to be true,
   * after testing, set the boolean
   * back to true in order to make
   * the functionality works.
   */
  private boolean seedLocalSource = false;

  public LaundryController(MongoDatabase machineDatabase, MongoDatabase roomDatabase, MongoDatabase machinePollingDatabase) {
    this.pullingDatabase = machinePollingDatabase;
    machineCollection = machineDatabase.getCollection("machines");
    roomCollection = roomDatabase.getCollection("rooms");
    if (!seedLocalSource) {
      machinePollingCollection = machinePollingDatabase.getCollection("machineDataFromPollingAPI");
    } else {
      machinePollingCollection = machineDatabase.getCollection("machines");
    }
  }

  public String getRooms() {
    return serializeIterable(roomCollection.find());
  }

  public String getMachines() {
    return serializeIterable(machineCollection.find());
  }

  public String getMachinesAtRoom(String room) {
    Document filterDoc = new Document();
    filterDoc = filterDoc.append("room_id", room);
    return serializeIterable(machineCollection.find(filterDoc));
  }

  private String serializeIterable(Iterable<Document> documents) {
    return StreamSupport.stream(documents.spliterator(), false)
      .map(Document::toJson)
      .collect(Collectors.joining(", ", "[", "]"));
  }

  public String getMachine(String id) {
    FindIterable<Document> jsonMachines
      = machineCollection.find(eq("id", id));

    Iterator<Document> iterator = jsonMachines.iterator();
    if (iterator.hasNext()) {
      Document machine = iterator.next();
      return machine.toJson();
    } else {
      // We didn't find the desired machine
      return null;
    }
  }

  public void updateMachines() {

    if (!seedLocalSource) {
      machinePollingCollection = pullingDatabase.getCollection("machineDataFromPollingAPI");
    } else {
      machinePollingCollection = pullingDatabase.getCollection("machines");
    }

    long currentTime = System.currentTimeMillis();

    FindIterable<Document> newMachines = machinePollingCollection.find();

    for (Document newDocument : newMachines) {
      Document oldDocument = new Document(newDocument);
      FindIterable<Document> oldDocuments = machineCollection.find();
      for (Document d : oldDocuments) {
        if (d.get("id").equals(newDocument.get("id"))) {
          oldDocument = new Document(d);
          break;
        }
      }
      Document originalNewDocument = new Document(newDocument);

      if (newDocument.getBoolean("running")) {
        if (newDocument.get("type").equals("dryer")) {
          if (!oldDocument.getBoolean("running") || oldDocument.get("runBegin") == null) {
            newDocument.put("runBegin", currentTime);
            newDocument.put("remainingTime", 60);
            newDocument.put("runEnd", -1);
            newDocument.put("vacantTime", -1);
          } else {
            newDocument.put("runBegin", oldDocument.get("runBegin"));
            newDocument.put("remainingTime", Math.max(0, 60 - (int) ((currentTime - oldDocument.getLong("runBegin")) / 60000)));
            newDocument.put("runEnd", -1);
            newDocument.put("vacantTime", -1);
          }
        } else {
          if (!oldDocument.getBoolean("running") || oldDocument.get("runBegin") == null) {
            newDocument.put("runBegin", currentTime);
            newDocument.put("remainingTime", 35);
            newDocument.put("runEnd", -1);
            newDocument.put("vacantTime", -1);
          } else {
            newDocument.put("runBegin", oldDocument.get("runBegin"));
            newDocument.put("remainingTime", Math.max(0, 35 - (int) ((currentTime - oldDocument.getLong("runBegin")) / 60000)));
            newDocument.put("runEnd", -1);
            newDocument.put("vacantTime", -1);
          }
        }
      } else {
        if (oldDocument.getBoolean("running") || oldDocument.get("runEnd") == null) {
          newDocument.put("runEnd", currentTime);
          newDocument.put("vacantTime", 0);
          newDocument.put("runBegin", -1);
          newDocument.put("remainingTime", -1);
        } else {
          newDocument.put("runEnd", oldDocument.get("runEnd"));
          newDocument.put("vacantTime", (int) ((currentTime - oldDocument.getLong("runEnd")) / 60000));
          newDocument.put("runBegin", -1);
          newDocument.put("remainingTime", -1);
        }
      }


      machinePollingCollection.replaceOne(originalNewDocument, newDocument);
    }

    machineCollection.drop();
    for (Document d : newMachines) {
      machineCollection.insertOne(d);
    }
    System.out.println("[laundry-controller] INFO - Machines collection status updated");
  }
}
