package com.surakshasetu.util;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonToken;
import com.google.gson.stream.JsonWriter;

import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.lang.reflect.Type;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

public class JsonStorage {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    // Custom adapter so Gson converts LocalDateTime <-> String instead of using reflection
    private static final TypeAdapter<LocalDateTime> LOCAL_DATE_TIME_ADAPTER = new TypeAdapter<LocalDateTime>() {
        @Override
        public void write(JsonWriter out, LocalDateTime value) throws IOException {
            if (value == null) {
                out.nullValue();
            } else {
                out.value(value.format(FORMATTER));
            }
        }

        @Override
        public LocalDateTime read(JsonReader in) throws IOException {
            if (in.peek() == JsonToken.NULL) {
                in.nextNull();
                return null;
            }
            String value = in.nextString();
            return LocalDateTime.parse(value, FORMATTER);
        }
    };

    private static final Gson gson = new GsonBuilder()
            .setPrettyPrinting()
            .registerTypeAdapter(LocalDateTime.class, LOCAL_DATE_TIME_ADAPTER)
            .create();

    private static final String DATA_FOLDER = "data/";

    public static <T> List<T> readList(String fileName, Type type) {
        String path = DATA_FOLDER + fileName;

        try {
            if (!Files.exists(Paths.get(path))) {
                return new ArrayList<>();
            }
            try (FileReader reader = new FileReader(path)) {
                List<T> list = gson.fromJson(reader, type);
                return (list != null) ? list : new ArrayList<>();
            }
        } catch (IOException e) {
            throw new RuntimeException("Error reading " + fileName + ": " + e.getMessage(), e);
        }
    }

    public static <T> void writeList(String fileName, List<T> list) {
        String path = DATA_FOLDER + fileName;

        try {
            Files.createDirectories(Paths.get(DATA_FOLDER));

            try (FileWriter writer = new FileWriter(path)) {
                gson.toJson(list, writer);
            }
        } catch (IOException e) {
            throw new RuntimeException("Error writing " + fileName + ": " + e.getMessage(), e);
        }
    }
}