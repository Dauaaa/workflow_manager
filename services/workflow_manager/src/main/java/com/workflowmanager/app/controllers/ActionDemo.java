package com.workflowmanager.app.controllers;

import java.util.List;
import java.util.Optional;

public class ActionDemo {

    public enum ActionType {
        DELETE {
            @Override
            public ActionData getData() {
                return new StringData("DELETE");
            }
        },
        SET_INITIAL_WORKFLOW_STATE {
            @Override
            public ActionData getData() {
                return new WorkflowStateData(Optional.of(new WorkflowStateId(1)));
            }
        },
        SET_TAGS {
            @Override
            public ActionData getData() {
                return new TagData(List.of("tag1", "tag2", "tag3"));
            }
        };

        // Abstract method to get the associated data
        public abstract ActionData getData();
    }

    // Define the ActionData interface, each enum will have different implementations of this
    public interface ActionData {
        String serialize();
    }

    // A data type for DELETE (String data)
    public static class StringData implements ActionData {
        private final String data;

        public StringData(String data) {
            this.data = data;
        }

        @Override
        public String serialize() {
            return "{ \"type\": \"DELETE\", \"data\": \"" + data + "\" }";
        }
    }

    // A data type for SET_INITIAL_WORKFLOW_STATE (Optional<WorkflowStateId> data)
    public static class WorkflowStateData implements ActionData {
        private final Optional<WorkflowStateId> workflowStateId;

        public WorkflowStateData(Optional<WorkflowStateId> workflowStateId) {
            this.workflowStateId = workflowStateId;
        }

        @Override
        public String serialize() {
            String dataValue = workflowStateId.isPresent() ? workflowStateId.get().toString() : "null";
            return "{ \"type\": \"SET_INITIAL_WORKFLOW_STATE\", \"data\": " + dataValue + " }";
        }
    }

    // A data type for SET_TAGS (List<String> data)
    public static class TagData implements ActionData {
        private final List<String> tags;

        public TagData(List<String> tags) {
            this.tags = tags;
        }

        @Override
        public String serialize() {
            return "{ \"type\": \"SET_TAGS\", \"data\": " + tags.toString() + " }";
        }
    }

    // Example of a class to represent the WorkflowStateId
    public static class WorkflowStateId {
        private final int id;

        public WorkflowStateId(int id) {
            this.id = id;
        }

        @Override
        public String toString() {
            return String.valueOf(id);
        }
    }

    // Testing the serialization
    public static void testinho() {
        System.out.println(ActionType.DELETE.getData().serialize());
        System.out.println(ActionType.SET_INITIAL_WORKFLOW_STATE.getData().serialize());
        System.out.println(ActionType.SET_TAGS.getData().serialize());
    }
}
