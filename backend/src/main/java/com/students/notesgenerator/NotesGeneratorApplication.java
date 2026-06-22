package com.students.notesgenerator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class NotesGeneratorApplication {
    public static void main(String[] args) {
        SpringApplication.run(NotesGeneratorApplication.class, args);
    }
}
