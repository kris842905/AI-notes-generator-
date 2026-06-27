package com.students.notesgenerator.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class ViewController {

    @RequestMapping(value = {
        "/",
        "/login",
        "/signup",
        "/notes/**",
        "/summaries/**",
        "/flashcards/**",
        "/quizzes/**",
        "/chat/**",
        "/bookmarks/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
