package ch.zhaw.webengineering.todo.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Controller that serves different views
 */
@Controller
public class ViewController {
    @RequestMapping({"/", "/index", "/index.html"})
    public String index() {
        return "index";
    }

    @RequestMapping({"/about"})
    public String about() {
        return "about";
    }

    @RequestMapping({"/contact"})
    public String contact() {
        return "contact";
    }
}
