package ch.zhaw.webengineering.todo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Application that provides functionality to manage Todos
 */
@SpringBootApplication
public class TodoList {
  public static void main(String[] args) {
    SpringApplication.run(TodoList.class);
  }
}
